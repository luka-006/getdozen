import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { normalizeEmailIdentity } from "./email-identity";
import { normalizeReferralCode } from "./referral-code";
import { referralMax, resetRewardConfigWarnings } from "./reward-config";

const migrationSql = readFileSync(
  new URL("../../supabase/migrations/20261114193000_waitlist_bonus_and_referrals.sql", import.meta.url),
  "utf8",
);

const FIXTURE = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'ledger_status') then
    create type public.ledger_status as enum ('pending', 'available', 'expired', 'voided');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  display_name text not null default 'Maker',
  credits numeric(10,2) not null default 0,
  credits_pending numeric(10,2) not null default 0,
  reviews_given integer not null default 0,
  bugs_found integer not null default 0,
  has_reviewed_once boolean not null default false,
  rating_avg numeric(4,2) not null default 0,
  rating_count integer not null default 0,
  is_ramped boolean not null default false,
  is_pro boolean not null default false,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  purchased_credits numeric(10,2) not null default 0,
  daily_review_count integer not null default 0,
  daily_review_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10,2) not null,
  reason text not null,
  ref_id uuid,
  status public.ledger_status not null default 'available',
  expires_at timestamptz,
  available_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.recompute_balances(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  update public.profiles
  set
    credits = greatest(coalesce((
      select sum(amount) from public.credit_ledger
      where user_id = p_user_id and status = 'available'
    ), 0), 0),
    credits_pending = coalesce((
      select sum(amount) from public.credit_ledger
      where user_id = p_user_id and status = 'pending' and amount > 0
    ), 0)
  where id = p_user_id;
end;
$fn$;

create or replace function public.ledger_insert(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_ref_id uuid default null,
  p_status public.ledger_status default 'available',
  p_expires_at timestamptz default null,
  p_available_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
begin
  insert into public.credit_ledger (user_id, amount, reason, ref_id, status, expires_at, available_at)
  values (
    p_user_id,
    p_amount,
    p_reason,
    p_ref_id,
    p_status,
    case
      when p_amount > 0 and p_status in ('available', 'pending')
        then coalesce(p_expires_at, now() + interval '6 months')
      else p_expires_at
    end,
    p_available_at
  )
  returning id into v_id;

  perform public.recompute_balances(p_user_id);
  return v_id;
end;
$fn$;
`;

type Db = PGlite;
let db: Db;

async function rows<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await db.query<T>(sql, params);
  return result.rows;
}

async function reset() {
  await db.exec(`
    delete from public.credit_ledger;
    delete from public.referral_payouts;
    update public.waitlist
      set referred_by_user_id = null,
          referred_by_waitlist_id = null,
          bonus_user_id = null;
    delete from public.profiles;
    delete from public.waitlist;
    delete from public.referral_code_registry;
  `);
}

async function insertProfile(id: string, email: string) {
  await db.query(
    `insert into public.profiles (id, email, display_name) values ($1::uuid, $2, 'Maker')`,
    [id, email],
  );
}

async function insertWaitlist(email: string, confirmed = false) {
  const result = await rows<{ id: string; referral_code: string; email: string }>(
    `insert into public.waitlist (email, confirmed_at)
     values ($1, case when $2::boolean then now() else null end)
     returning id::text, referral_code, email`,
    [email, confirmed],
  );
  return result[0];
}

async function grant(
  userId: string,
  amounts: { bonus?: number | null; referral?: number | null; max?: number | null } = {},
) {
  const result = await rows<{ result: unknown }>(
    `select public.grant_launch_rewards($1::uuid, $2::int, $3::int, $4::int) as result`,
    [
      userId,
      amounts.bonus === undefined ? 10 : amounts.bonus,
      amounts.referral === undefined ? 2 : amounts.referral,
      amounts.max === undefined ? 3 : amounts.max,
    ],
  );
  const raw = result[0]?.result;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as {
    ok: boolean;
    reason?: string;
    waitlist_granted?: boolean;
    referral_paid?: number;
  };
}

async function countLedger(reason: string, userId?: string) {
  const result = await rows<{ n: number }>(
    userId
      ? `select count(*)::int as n from public.credit_ledger where reason = $1 and user_id = $2::uuid`
      : `select count(*)::int as n from public.credit_ledger where reason = $1`,
    userId ? [reason, userId] : [reason],
  );
  return Number(result[0]?.n ?? 0);
}

const REFERRER = "00000000-0000-4000-8000-000000000010";
const FRIEND = "00000000-0000-4000-8000-000000000020";
const FRIEND_2 = "00000000-0000-4000-8000-000000000021";
const FRIEND_3 = "00000000-0000-4000-8000-000000000022";
const FRIEND_4 = "00000000-0000-4000-8000-000000000023";
const LATER = "00000000-0000-4000-8000-000000000030";

describe("launch reward migration", { concurrency: 1 }, () => {
  before(async () => {
    db = new PGlite();
    await db.exec(FIXTURE);
    await db.exec(migrationSql);
  });

  after(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await reset();
  });

  it("declares the idempotent indexes and the row lock", () => {
    assert.match(migrationSql, /credit_ledger \(user_id\)\s+where reason = 'waitlist_bonus'/);
    assert.match(migrationSql, /credit_ledger \(ref_id\)\s+where reason = 'referral_bonus'/);
    assert.match(migrationSql, /for update/i);
    assert.equal(migrationSql.includes("REFERRAL_MAX"), false);
  });

  it("matches the TypeScript email identity", async () => {
    const samples = [
      "  Foo@X.com ",
      "a+tag@yahoo.com",
      "f.o.o@gmail.com",
      "f.o.o@googlemail.com",
      "f.o.o@yahoo.com",
      "foo@gmail.com",
    ];
    for (const sample of samples) {
      const result = await rows<{ v: string }>(
        `select public.normalize_email_identity($1) as v`,
        [sample],
      );
      assert.equal(result[0]?.v, normalizeEmailIdentity(sample));
    }
  });

  it("grants once on the first eligible sign-in", async () => {
    await insertWaitlist("ada@example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    const first = await grant(FRIEND);
    assert.equal(first.waitlist_granted, true);
    assert.equal(await countLedger("waitlist_bonus", FRIEND), 1);
    const balance = await rows<{ credits: string }>(
      `select credits::text from public.profiles where id = $1::uuid`,
      [FRIEND],
    );
    assert.equal(Number(balance[0]?.credits), 10);

    const second = await grant(FRIEND);
    assert.equal(second.waitlist_granted, false);
    assert.equal(await countLedger("waitlist_bonus", FRIEND), 1);
  });

  it("does not grant twice when two calls race", async () => {
    await insertWaitlist("ada@example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    await Promise.all([grant(FRIEND), grant(FRIEND)]);
    assert.equal(await countLedger("waitlist_bonus"), 1);
  });

  it("gives nothing to a non-waitlist email", async () => {
    await insertProfile(FRIEND, "ada@example.com");
    const result = await grant(FRIEND);
    assert.equal(result.waitlist_granted, false);
    assert.equal(await countLedger("waitlist_bonus"), 0);
  });

  it("gives nothing when the waitlist row is unconfirmed", async () => {
    await insertWaitlist("ada@example.com", false);
    await insertProfile(FRIEND, "ada@example.com");
    const result = await grant(FRIEND);
    assert.equal(result.waitlist_granted, false);
    assert.equal(await countLedger("waitlist_bonus"), 0);
    const claimed = await rows<{ bonus_claimed_at: string | null }>(
      `select bonus_claimed_at::text from public.waitlist`,
    );
    assert.equal(claimed[0]?.bonus_claimed_at ?? null, null);
  });

  it("matches a case-different email", async () => {
    await insertWaitlist("Foo@X.com", true);
    await insertProfile(FRIEND, "foo@x.com");
    const result = await grant(FRIEND);
    assert.equal(result.waitlist_granted, true);
    assert.equal(await countLedger("waitlist_bonus", FRIEND), 1);
  });

  it("grants when the profile is created after the auth user", async () => {
    await insertWaitlist("ada@example.com", true);
    const missing = await grant(FRIEND);
    assert.equal(missing.ok, false);
    assert.equal(missing.reason, "no_profile");
    await insertProfile(FRIEND, "ada@example.com");
    const result = await grant(FRIEND);
    assert.equal(result.waitlist_granted, true);
  });

  it("does not grant again after the account is deleted and recreated", async () => {
    await insertWaitlist("ada@example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    await grant(FRIEND);
    await db.query(`delete from public.profiles where id = $1::uuid`, [FRIEND]);
    await insertProfile(LATER, "ada@example.com");
    const again = await grant(LATER);
    assert.equal(again.waitlist_granted, false);
    assert.equal(await countLedger("waitlist_bonus", LATER), 0);
    const claimed = await rows<{ n: number }>(
      `select count(*)::int as n from public.waitlist where bonus_claimed_at is not null`,
    );
    assert.equal(Number(claimed[0]?.n), 1);
  });

  it("does not claim the row when the bonus amount is disabled", async () => {
    await insertWaitlist("ada@example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    await grant(FRIEND, { bonus: 0 });
    assert.equal(await countLedger("waitlist_bonus"), 0);
    const later = await grant(FRIEND, { bonus: 10 });
    assert.equal(later.waitlist_granted, true);
  });

  it("keeps the existing six-month ledger expiry", async () => {
    await insertWaitlist("ada@example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    await grant(FRIEND);
    const result = await rows<{ days: number }>(
      `select extract(day from (expires_at - now()))::int as days
       from public.credit_ledger where reason = 'waitlist_bonus'`,
    );
    const days = Number(result[0]?.days);
    assert.ok(days > 150 && days < 200, `expected about six months, got ${days} days`);
  });

  it("gives every new waitlist row a unique code", async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const row = await insertWaitlist(`person${i}@example.com`, true);
      assert.ok(normalizeReferralCode(row.referral_code), row.referral_code);
      codes.add(row.referral_code);
    }
    assert.equal(codes.size, 20);
  });

  it("stores a known ref once and ignores an unknown code", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    const joiner = await insertWaitlist("joiner@example.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      joiner.email,
      "zzzzzzzz",
    ]);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      joiner.email,
      referrer.referral_code,
    ]);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      joiner.email,
      "23456789",
    ]);
    const stored = await rows<{ referred_by_waitlist_id: string | null }>(
      `select referred_by_waitlist_id::text from public.waitlist where id = $1::uuid`,
      [joiner.id],
    );
    assert.equal(stored[0]?.referred_by_waitlist_id, referrer.id);
  });

  it("blocks self-referral for case, plus-tag, and gmail-dot variants", async () => {
    const cases: Array<[string, string]> = [
      ["ada@example.com", "ada@example.com"],
      ["Ada@Example.com", "ada@example.com"],
      ["ada+news@yahoo.com", "ada@yahoo.com"],
      ["a.da@gmail.com", "ada@gmail.com"],
      ["a.da@googlemail.com", "ada@gmail.com"],
    ];
    for (const [storedEmail, attempt] of cases) {
      await reset();
      const row = await insertWaitlist(storedEmail, true);
      await db.query(`select public.attach_waitlist_referral($1, $2)`, [
        attempt,
        row.referral_code,
      ]);
      const stored = await rows<{ referred_by_waitlist_id: string | null }>(
        `select referred_by_waitlist_id::text from public.waitlist where id = $1::uuid`,
        [row.id],
      );
      assert.equal(
        stored[0]?.referred_by_waitlist_id ?? null,
        null,
        `${storedEmail} vs ${attempt}`,
      );
    }
  });

  it("does not treat a different domain as a self-referral", async () => {
    const referrer = await insertWaitlist("ada@gmail.com", true);
    await insertWaitlist("ada@yahoo.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "ada@yahoo.com",
      referrer.referral_code,
    ]);
    const stored = await rows<{ referred_by_waitlist_id: string | null }>(
      `select referred_by_waitlist_id::text from public.waitlist where email = 'ada@yahoo.com'`,
    );
    assert.equal(stored[0]?.referred_by_waitlist_id, referrer.id);

    await reset();
    const dotted = await insertWaitlist("a.da@yahoo.com", true);
    await insertWaitlist("ada@yahoo.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "ada@yahoo.com",
      dotted.referral_code,
    ]);
    const yahoo = await rows<{ referred_by_waitlist_id: string | null }>(
      `select referred_by_waitlist_id::text from public.waitlist where email = 'ada@yahoo.com'`,
    );
    assert.equal(yahoo[0]?.referred_by_waitlist_id, dotted.id);
  });

  it("does not pay a waitlist-only email", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    await insertProfile(REFERRER, "referrer@example.com");
    await insertWaitlist("friend@example.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "friend@example.com",
      referrer.referral_code,
    ]);
    assert.equal(await countLedger("referral_bonus"), 0);
  });

  it("pays when the friend creates a confirmed account, and only once", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    await insertProfile(REFERRER, "referrer@example.com");
    await insertWaitlist("friend@example.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "friend@example.com",
      referrer.referral_code,
    ]);
    await insertProfile(FRIEND, "friend@example.com");
    const first = await grant(FRIEND, { max: 3 });
    assert.equal(Number(first.referral_paid), 1);
    assert.equal(await countLedger("referral_bonus", REFERRER), 1);
    const ref = await rows<{ ref_id: string }>(
      `select ref_id::text from public.credit_ledger where reason = 'referral_bonus'`,
    );
    assert.equal(ref[0]?.ref_id, FRIEND);

    await Promise.all([grant(FRIEND, { max: 3 }), grant(FRIEND, { max: 3 })]);
    assert.equal(await countLedger("referral_bonus", REFERRER), 1);
  });

  it("enforces the configured cap, including concurrent payouts", async () => {
    const previous = process.env.REFERRAL_MAX;
    process.env.REFERRAL_MAX = "3";
    resetRewardConfigWarnings();
    try {
      const max = referralMax();
      assert.equal(max, 3);
      const referrer = await insertWaitlist("referrer@example.com", true);
      await insertProfile(REFERRER, "referrer@example.com");
      const friends = [
        [FRIEND, "f1@example.com"],
        [FRIEND_2, "f2@example.com"],
        [FRIEND_3, "f3@example.com"],
        [FRIEND_4, "f4@example.com"],
      ] as const;
      for (const [id, email] of friends) {
        await insertWaitlist(email, true);
        await db.query(`select public.attach_waitlist_referral($1, $2)`, [
          email,
          referrer.referral_code,
        ]);
        await insertProfile(id, email);
      }
      await Promise.all(friends.map(([id]) => grant(id, { max })));
      assert.equal(await countLedger("referral_bonus", REFERRER), 3);
      const stillReferred = await rows<{ n: number }>(
        `select count(*)::int as n from public.waitlist where referred_by_waitlist_id = $1::uuid`,
        [referrer.id],
      );
      assert.equal(Number(stillReferred[0]?.n), 4);
      const pending = await rows<{ n: number }>(
        `select public.pending_referral_count($1::uuid, $2::uuid) as n`,
        [REFERRER, referrer.id],
      );
      assert.equal(Number(pending[0]?.n), 1);
    } finally {
      if (previous === undefined) delete process.env.REFERRAL_MAX;
      else process.env.REFERRAL_MAX = previous;
      resetRewardConfigWarnings();
    }
  });

  it("counts only unpaid referrals and hides their emails", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    await insertProfile(REFERRER, "referrer@example.com");
    await insertWaitlist("f1@example.com", true);
    await insertWaitlist("f2@example.com", true);
    const code = referrer.referral_code;
    await db.query(`select public.attach_waitlist_referral($1, $2)`, ["f1@example.com", code]);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, ["f2@example.com", code]);
    const before = await rows<{ n: number }>(
      `select public.pending_referral_count($1::uuid, $2::uuid) as n`,
      [REFERRER, referrer.id],
    );
    assert.equal(Number(before[0]?.n), 2);

    await insertProfile(FRIEND, "f1@example.com");
    await grant(FRIEND, { max: 3 });
    const after = await rows<{ n: number }>(
      `select public.pending_referral_count($1::uuid, $2::uuid) as n`,
      [REFERRER, referrer.id],
    );
    assert.equal(Number(after[0]?.n), 1);
    const definition = await rows<{ def: string }>(
      `select pg_get_functiondef('public.pending_referral_count(uuid, uuid)'::regprocedure) as def`,
    );
    assert.equal(definition[0]?.def.includes("w.email"), true);
    assert.equal(/returns setof|return query/i.test(definition[0]?.def ?? ""), false);
  });

  it("pays a held referral when the referrer creates an account later", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    await insertWaitlist("friend@example.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "friend@example.com",
      referrer.referral_code,
    ]);
    await insertProfile(FRIEND, "friend@example.com");
    const early = await grant(FRIEND, { max: 3 });
    assert.equal(Number(early.referral_paid), 0);
    assert.equal(await countLedger("referral_bonus"), 0);

    await insertProfile(REFERRER, "referrer@example.com");
    const later = await grant(REFERRER, { max: 3 });
    assert.equal(Number(later.referral_paid), 1);
    assert.equal(await countLedger("referral_bonus", REFERRER), 1);
  });

  it("does not pay when the referral amount or cap is disabled", async () => {
    const referrer = await insertWaitlist("referrer@example.com", true);
    await insertProfile(REFERRER, "referrer@example.com");
    await insertWaitlist("friend@example.com", true);
    await db.query(`select public.attach_waitlist_referral($1, $2)`, [
      "friend@example.com",
      referrer.referral_code,
    ]);
    await insertProfile(FRIEND, "friend@example.com");
    await grant(FRIEND, { referral: 0, max: 3 });
    await grant(FRIEND, { referral: 2, max: 0 });
    assert.equal(await countLedger("referral_bonus"), 0);
  });

  it("reuses the waitlist code on the profile", async () => {
    const row = await insertWaitlist("Ada@Example.com", true);
    await insertProfile(FRIEND, "ada@example.com");
    const profile = await rows<{ referral_code: string }>(
      `select referral_code from public.profiles where id = $1::uuid`,
      [FRIEND],
    );
    assert.equal(profile[0]?.referral_code, row.referral_code);
  });
});

describe("referral code backfill", { concurrency: 1 }, () => {
  it("gives every existing user a code and reuses the waitlist code", async () => {
    const fresh = new PGlite();
    try {
      await fresh.exec(FIXTURE);
      await fresh.exec(`
        insert into public.waitlist (email, confirmed_at)
        values ('Foo@X.com', now());
        insert into public.profiles (id, email, display_name)
        values ('00000000-0000-4000-8000-000000000041', 'foo@x.com', 'Foo'),
               ('00000000-0000-4000-8000-000000000042', 'other@example.com', 'Other');
      `);
      await fresh.exec(migrationSql);
      const result = await fresh.query<{
        email: string;
        referral_code: string | null;
      }>(`select email, referral_code from public.profiles order by email`);
      assert.equal(result.rows.length, 2);
      assert.ok(result.rows.every((row) => normalizeReferralCode(row.referral_code)));
      const waitlist = await fresh.query<{ referral_code: string }>(
        `select referral_code from public.waitlist`,
      );
      const foo = result.rows.find((row) => row.email === "foo@x.com");
      assert.equal(foo?.referral_code, waitlist.rows[0]?.referral_code);
      const codes = new Set(result.rows.map((row) => row.referral_code));
      assert.equal(codes.size, 2);
    } finally {
      await fresh.close();
    }
  });
});
