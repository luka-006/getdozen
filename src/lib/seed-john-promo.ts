/**
 * Seed promo / marketing mock data for the test account john@getdozen.dev only.
 * Does not touch preview-* demo accounts except as peer reviewers / thanks senders.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { CORE_QUESTIONS, QUESTION_LIBRARY } from "@/lib/constants";
import { runSeedPreview, type SeedPreviewResult } from "@/lib/seed-preview-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const JOHN_EMAIL = "john@getdozen.dev";
const PROMO_APP_URL_PREFIX = "https://promo.getdozen.dev/";
const LEDGER_REASON_PREFIX = "john-promo-seed:";

export type SeedJohnPromoOptions = {
  force?: boolean;
  clear?: boolean;
  dryRun?: boolean;
};

export type SeedJohnPromoSummary = {
  balance?: number;
  balancePending?: number;
  reviewsGiven?: number;
  memberSince?: string;
  demoRequests?: number;
  promoLedgerNet?: number;
  shippedApps?: number;
  peerReviews?: number;
  thanksMessages?: number;
};

export type SeedJohnPromoResult = {
  johnId: string;
  skipped?: boolean;
  cleared?: boolean;
  dryRun?: boolean;
  message?: string;
  summary?: SeedJohnPromoSummary;
};

function getAdmin(): SupabaseClient {
  return createAdminClient();
}

type SeedRuntime = {
  admin: SupabaseClient;
  dryRun: boolean;
  force: boolean;
};

function createRuntime(options: Pick<SeedJohnPromoOptions, "dryRun" | "force">): SeedRuntime {
  return {
    admin: getAdmin(),
    dryRun: options.dryRun ?? false,
    force: options.force ?? false,
  };
}

type DemoPost = {
  type: "feedback" | "tester" | "combo";
  product_type: "app" | "game";
  app_name: string;
  app_slug: string;
  app_description: string;
  platform: "web" | "ios" | "android";
  focus_tag?: "UX" | "Market" | "Technical" | null;
  status?: "open" | "completed" | "in_progress";
  testers_needed?: number;
  testers_filled?: number;
  question_count?: number;
  credit_cost?: number;
  daysAgo: number;
  opt_in_link?: string | null;
};

const JOHN_POSTS: DemoPost[] = [
  {
    type: "feedback",
    product_type: "app",
    app_name: "Sidequest Notes",
    app_slug: "sidequest-notes",
    app_description:
      "Quick capture for side-project ideas — need clarity on the first-run empty state.",
    platform: "web",
    focus_tag: "UX",
    question_count: 8,
    credit_cost: 16,
    status: "open",
    daysAgo: 41,
  },
  {
    type: "tester",
    product_type: "app",
    app_name: "Weekend Budget",
    app_slug: "weekend-budget",
    app_description: "Envelope budgeting for couples — TestFlight build ready.",
    platform: "ios",
    focus_tag: "Market",
    testers_needed: 12,
    testers_filled: 5,
    status: "open",
    daysAgo: 22,
    opt_in_link: "https://promo.getdozen.dev/testflight/weekend-budget",
  },
  {
    type: "combo",
    product_type: "app",
    app_name: "Relay Chat",
    app_slug: "relay-chat",
    app_description:
      "Async standups for remote teams — combo feedback + two-week tester window.",
    platform: "web",
    focus_tag: "Technical",
    testers_needed: 12,
    testers_filled: 8,
    question_count: 10,
    credit_cost: 24,
    status: "in_progress",
    daysAgo: 68,
    opt_in_link: "https://promo.getdozen.dev/play/relay-chat",
  },
  {
    type: "feedback",
    product_type: "app",
    app_name: "Plant Log",
    app_slug: "plant-log",
    app_description: "Watering reminders without smart sensors — Android beta link inside.",
    platform: "android",
    focus_tag: "UX",
    question_count: 7,
    credit_cost: 14,
    status: "completed",
    daysAgo: 14,
  },
];

const PEER_REVIEWER_EMAILS = [
  "preview-tester-01@demo.getdozen.dev",
  "preview-tester-03@demo.getdozen.dev",
  "preview-tester-07@demo.getdozen.dev",
  "preview-tester-11@demo.getdozen.dev",
];

const THANKS_FROM_EMAILS = [
  "preview-forge@demo.getdozen.dev",
  "preview-trail@demo.getdozen.dev",
  "preview-orbit@demo.getdozen.dev",
];

const JOHN_PROFILE = {
  display_name: "John M.",
  avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=john-getdozen",
  reviews_given: 19,
  rating_avg: 4.7,
  rating_count: 11,
  bugs_found: 3,
  is_ramped: true,
  has_reviewed_once: true,
  is_pro: true,
  purchased_credits: 120,
  memberMonthsAgo: 9,
};

const LEDGER_ROWS = [
  { amount: 268, reason: `${LEDGER_REASON_PREFIX}purchase`, daysAgo: 85, status: "available" as const },
  { amount: 28, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 72, status: "available" as const },
  { amount: 24, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 58, status: "available" as const },
  { amount: 22, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 44, status: "available" as const },
  { amount: 18, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 31, status: "available" as const },
  { amount: 16, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 19, status: "available" as const },
  { amount: 14, reason: `${LEDGER_REASON_PREFIX}review`, daysAgo: 8, status: "available" as const },
  { amount: 10, reason: `${LEDGER_REASON_PREFIX}checkin`, daysAgo: 16, status: "available" as const },
  { amount: 10, reason: `${LEDGER_REASON_PREFIX}checkin`, daysAgo: 10, status: "available" as const },
  { amount: 8, reason: `${LEDGER_REASON_PREFIX}checkin`, daysAgo: 4, status: "available" as const },
  { amount: 12.5, reason: `${LEDGER_REASON_PREFIX}review_pending`, daysAgo: 2, status: "pending" as const },
  { amount: -16, reason: `${LEDGER_REASON_PREFIX}post`, daysAgo: 41, status: "available" as const },
  { amount: -24, reason: `${LEDGER_REASON_PREFIX}post`, daysAgo: 68, status: "available" as const },
  { amount: -14, reason: `${LEDGER_REASON_PREFIX}post`, daysAgo: 14, status: "available" as const },
  { amount: -18, reason: `${LEDGER_REASON_PREFIX}post`, daysAgo: 22, status: "available" as const },
] as const;

const SHIPPED_APPS = [
  {
    app_name: "Sidequest Notes",
    app_slug: "sidequest-notes",
    daysAgo: 120,
    helperEmails: ["preview-tester-02@demo.getdozen.dev", "preview-tester-05@demo.getdozen.dev"],
  },
  {
    app_name: "Relay Chat",
    app_slug: "relay-chat",
    daysAgo: 45,
    helperEmails: ["preview-tester-08@demo.getdozen.dev"],
  },
] as const;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(11, 30, 0, 0);
  return d.toISOString();
}

function appIconUrl(slug: string): string {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(slug)}`;
}

function logAction(message: string, dryRun: boolean) {
  console.log(dryRun ? `[dry-run] ${message}` : message);
}

export async function ensureJohnId(admin: SupabaseClient = getAdmin()): Promise<string> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, display_name")
    .eq("email", JOHN_EMAIL)
    .maybeSingle();

  if (error) throw new Error(`profiles lookup: ${error.message}`);
  if (profile?.id) return profile.id;

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === JOHN_EMAIL);
  let userId = existing?.id;

  if (!userId) {
    const { data, error: createError } = await admin.auth.admin.createUser({
      email: JOHN_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: JOHN_PROFILE.display_name },
    });
    if (createError || !data.user) {
      throw new Error(`createUser ${JOHN_EMAIL}: ${createError?.message}`);
    }
    userId = data.user.id;
  }

  const { error: upsertError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: JOHN_EMAIL,
      display_name: JOHN_PROFILE.display_name,
      avatar_url: JOHN_PROFILE.avatar_url,
    },
    { onConflict: "id" },
  );
  if (upsertError) throw new Error(`profile upsert ${JOHN_EMAIL}: ${upsertError.message}`);

  return userId;
}

async function findUserIdByEmail(email: string, admin: SupabaseClient): Promise<string | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`profiles ${email}: ${error.message}`);
  return data?.id ?? null;
}

async function johnDemoRequestIds(johnId: string, admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin
    .from("requests")
    .select("id")
    .eq("user_id", johnId)
    .eq("is_demo", true);
  if (error) throw new Error(`requests lookup: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

async function clearJohnPromo(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const requestIds = await johnDemoRequestIds(johnId, admin);

  if (requestIds.length) {
    logAction(`Removing ${requestIds.length} demo request(s) owned by John…`, dryRun);
    if (!dryRun) {
      await admin.from("reviews").delete().in("request_id", requestIds);

      const { data: commitments } = await admin
        .from("tester_commitments")
        .select("id")
        .in("request_id", requestIds);
      const commitmentIds = (commitments ?? []).map((c) => c.id);
      if (commitmentIds.length) {
        await admin.from("checkins").delete().in("commitment_id", commitmentIds);
        await admin.from("tester_commitments").delete().in("id", commitmentIds);
      }

      await admin.from("questions").delete().in("request_id", requestIds);
      await admin.from("requests").delete().in("id", requestIds);
    }
  } else {
    logAction("No demo requests owned by John.", dryRun);
  }

  logAction("Removing John's reviews on other demo requests…", dryRun);
  if (!dryRun) {
    const { data: demoRequests } = await admin.from("requests").select("id").eq("is_demo", true);
    const demoIds = (demoRequests ?? []).map((r) => r.id);
    if (demoIds.length) {
      await admin.from("reviews").delete().eq("reviewer_id", johnId).in("request_id", demoIds);
    }
  }

  logAction("Removing promo ledger rows…", dryRun);
  if (!dryRun) {
    await admin
      .from("credit_ledger")
      .delete()
      .eq("user_id", johnId)
      .like("reason", `${LEDGER_REASON_PREFIX}%`);
    await admin.rpc("recompute_balances", { p_user_id: johnId });
  }

  logAction("Removing promo shipped apps…", dryRun);
  if (!dryRun) {
    await admin
      .from("shipped_apps")
      .delete()
      .eq("owner_id", johnId)
      .like("app_url", `${PROMO_APP_URL_PREFIX}%`);
  }

  const peerReviewerIds: string[] = [];
  for (const email of PEER_REVIEWER_EMAILS) {
    const id = await findUserIdByEmail(email, admin);
    if (id) peerReviewerIds.push(id);
  }

  if (peerReviewerIds.length) {
    logAction(`Removing ${peerReviewerIds.length} peer review(s) to John…`, dryRun);
    if (!dryRun) {
      await admin
        .from("profile_reviews")
        .delete()
        .eq("to_user_id", johnId)
        .in("from_user_id", peerReviewerIds);
    }
  }

  const thanksFromIds: string[] = [];
  for (const email of THANKS_FROM_EMAILS) {
    const id = await findUserIdByEmail(email, admin);
    if (id) thanksFromIds.push(id);
  }

  if (thanksFromIds.length) {
    logAction("Removing thanks messages to John from promo makers…", dryRun);
    if (!dryRun) {
      await admin
        .from("thanks_messages")
        .delete()
        .eq("to_user_id", johnId)
        .in("from_user_id", thanksFromIds);
    }
  }

  logAction("Resetting John's promo profile fields…", dryRun);
  if (!dryRun) {
    await admin
      .from("profiles")
      .update({
        reviews_given: 0,
        rating_avg: 0,
        rating_count: 0,
        bugs_found: 0,
        is_ramped: false,
        has_reviewed_once: false,
        is_pro: false,
        purchased_credits: 0,
      })
      .eq("id", johnId);
  }
}

function demoCustomQuestions(count: number): string[] {
  const pool = QUESTION_LIBRARY.flatMap((g) => g.questions);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[i % pool.length]!);
  }
  return out;
}

async function seedQuestions(
  requestId: string,
  post: DemoPost,
  runtime: SeedRuntime,
) {
  const { admin, dryRun } = runtime;
  if (post.type === "tester") return;

  const total = post.question_count ?? 7;
  const customCount = Math.max(0, total - CORE_QUESTIONS.length - 1);
  const custom = demoCustomQuestions(customCount);

  const rows = [
    ...CORE_QUESTIONS.map((text, i) => ({
      request_id: requestId,
      position: i,
      text,
      is_core: true,
      is_proof: false,
      expected_answer: null,
      suggested_answers: [] as string[],
    })),
    ...custom.map((text, i) => ({
      request_id: requestId,
      position: CORE_QUESTIONS.length + i,
      text,
      is_core: false,
      is_proof: false,
      expected_answer: null,
      suggested_answers: [] as string[],
    })),
    {
      request_id: requestId,
      position: CORE_QUESTIONS.length + custom.length,
      text: "Type the word test to prove you opened the demo.",
      is_core: false,
      is_proof: true,
      expected_answer: "test",
      suggested_answers: [] as string[],
    },
  ];

  if (dryRun) {
    logAction(`Would insert ${rows.length} questions for ${post.app_name}`, dryRun);
    return;
  }

  const { error } = await admin.from("questions").insert(rows);
  if (error) throw new Error(`questions ${post.app_name}: ${error.message}`);
}

async function seedJohnPosts(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  for (const post of JOHN_POSTS) {
    logAction(`Seeding request: ${post.app_name} (${post.daysAgo}d ago)`, dryRun);
    if (dryRun) continue;

    const { data: inserted, error } = await admin
      .from("requests")
      .insert({
        user_id: johnId,
        type: post.type,
        product_type: post.product_type,
        app_name: post.app_name,
        app_url: `${PROMO_APP_URL_PREFIX}${post.app_slug}`,
        app_description: post.app_description,
        app_icon_url: appIconUrl(post.app_slug),
        platform: post.platform,
        focus_tag: post.focus_tag ?? null,
        question_count: post.question_count ?? (post.type === "tester" ? 0 : 7),
        credit_cost: post.credit_cost ?? 14,
        testers_needed: post.testers_needed ?? (post.type === "feedback" ? 0 : 12),
        testers_filled: post.testers_filled ?? 0,
        status: post.status ?? "open",
        bounty_multiplier: 1,
        expires_at: expiresAt.toISOString(),
        duration_days: post.type === "tester" || post.type === "combo" ? 14 : null,
        opt_in_link: post.opt_in_link ?? null,
        is_demo: true,
        created_at: daysAgoIso(post.daysAgo),
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`insert ${post.app_name}: ${error?.message}`);
    }

    if (post.type !== "tester") {
      await seedQuestions(inserted.id, post, runtime);
    }
  }
}

async function seedJohnReviewsGiven(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const { data: targets, error } = await admin
    .from("requests")
    .select("id, app_name, type, user_id")
    .eq("is_demo", true)
    .neq("user_id", johnId)
    .in("type", ["feedback", "combo"])
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw new Error(`demo targets: ${error.message}`);
  if (!targets?.length) {
    logAction("No preview demo requests found for John's reviews (run seed-preview-data first).", dryRun);
    return;
  }

  for (const target of targets) {
    logAction(`Seeding review by John on ${target.app_name}`, dryRun);
    if (dryRun) continue;

    const autoConfirmAt = daysAgoIso(3);
    const createdAt = daysAgoIso(5);

    const { error: reviewError } = await admin.from("reviews").insert({
      request_id: target.id,
      reviewer_id: johnId,
      answers: {
        q0: "Clear value prop — onboarding could explain pricing sooner.",
        q1: "Settings tab was hard to find on mobile.",
        q2: "Maybe $6/mo if export worked offline.",
      },
      proof_passed: true,
      time_spent_seconds: 420,
      confirm_status: "confirmed",
      rating_received: 5,
      credits_awarded: 14,
      sample_question_ids: [],
      created_at: createdAt,
      auto_confirm_at: autoConfirmAt,
    });

    if (reviewError?.code === "23505") {
      logAction(`Review already exists on ${target.app_name}, skipping.`, dryRun);
      continue;
    }
    if (reviewError) throw new Error(`review ${target.app_name}: ${reviewError.message}`);
  }
}

async function seedPeerReviews(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const bodies = [
    { rating: 5, body: "Thoughtful feedback every time — super reliable tester." },
    { rating: 5, body: "Found two edge cases I would have missed. Great communicator." },
    { rating: 4, body: "Quick turnaround on combo requests. Would work with again." },
    { rating: 5, body: "Honest notes without being harsh — exactly what I needed." },
  ];

  for (let i = 0; i < PEER_REVIEWER_EMAILS.length; i++) {
    const fromId = await findUserIdByEmail(PEER_REVIEWER_EMAILS[i]!, admin);
    if (!fromId) {
      logAction(`Skipping peer review — ${PEER_REVIEWER_EMAILS[i]} not found.`, dryRun);
      continue;
    }

    const note = bodies[i] ?? bodies[0]!;
    logAction(`Seeding peer review from ${PEER_REVIEWER_EMAILS[i]}`, dryRun);
    if (dryRun) continue;

    const { error } = await admin.from("profile_reviews").upsert(
      {
        from_user_id: fromId,
        to_user_id: johnId,
        body: note.body,
        rating: note.rating,
        created_at: daysAgoIso(40 - i * 9),
      },
      { onConflict: "from_user_id,to_user_id" },
    );

    if (error) throw new Error(`profile_review: ${error.message}`);
  }
}

async function seedThanks(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const messages = [
    "Your UX notes on Sidequest were spot on — shipped the empty state fix.",
    "Appreciate the check-ins on Relay Chat. Day 6 feedback was gold.",
    "Thanks for the honest pricing feedback on Plant Log.",
  ];

  for (let i = 0; i < THANKS_FROM_EMAILS.length; i++) {
    const fromId = await findUserIdByEmail(THANKS_FROM_EMAILS[i]!, admin);
    if (!fromId) {
      logAction(`Skipping thanks — ${THANKS_FROM_EMAILS[i]} not found.`, dryRun);
      continue;
    }

    logAction(`Seeding thanks from ${THANKS_FROM_EMAILS[i]}`, dryRun);
    if (dryRun) continue;

    const { error } = await admin.from("thanks_messages").insert({
      from_user_id: fromId,
      to_user_id: johnId,
      body: messages[i] ?? messages[0]!,
      created_at: daysAgoIso(12 - i * 3),
    });

    if (error) throw new Error(`thanks ${THANKS_FROM_EMAILS[i]}: ${error.message}`);
  }
}

async function seedLedger(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  for (const row of LEDGER_ROWS) {
    logAction(`Ledger ${row.amount >= 0 ? "+" : ""}${row.amount} (${row.reason})`, dryRun);
    if (dryRun) continue;

    const { error } = await admin.rpc("ledger_insert", {
      p_user_id: johnId,
      p_amount: row.amount,
      p_reason: row.reason,
      p_ref_id: null,
      p_status: row.status,
      p_expires_at: null,
      p_available_at: daysAgoIso(row.daysAgo),
    });

    if (error) throw new Error(`ledger ${row.reason}: ${error.message}`);
  }

  if (!dryRun) {
    await admin.rpc("recompute_balances", { p_user_id: johnId });
  }
}

async function seedShippedApps(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  for (const app of SHIPPED_APPS) {
    const helperIds: string[] = [];
    for (const email of app.helperEmails) {
      const id = await findUserIdByEmail(email, admin);
      if (id) helperIds.push(id);
    }

    logAction(`Seeding shipped app: ${app.app_name}`, dryRun);
    if (dryRun) continue;

    const launched = new Date();
    launched.setDate(launched.getDate() - app.daysAgo);

    const { error } = await admin.from("shipped_apps").insert({
      owner_id: johnId,
      app_name: app.app_name,
      app_url: `${PROMO_APP_URL_PREFIX}${app.app_slug}`,
      launched_at: launched.toISOString().slice(0, 10),
      helper_ids: helperIds,
      created_at: daysAgoIso(app.daysAgo),
    });

    if (error) throw new Error(`shipped ${app.app_name}: ${error.message}`);
  }
}

async function updateJohnProfile(johnId: string, runtime: SeedRuntime) {
  const { admin, dryRun } = runtime;
  const createdAt = daysAgoIso(JOHN_PROFILE.memberMonthsAgo * 30);

  logAction("Updating John's profile stats and avatar…", dryRun);
  if (dryRun) return;

  const { error } = await admin
    .from("profiles")
    .update({
      display_name: JOHN_PROFILE.display_name,
      avatar_url: JOHN_PROFILE.avatar_url,
      reviews_given: JOHN_PROFILE.reviews_given,
      rating_avg: JOHN_PROFILE.rating_avg,
      rating_count: JOHN_PROFILE.rating_count,
      bugs_found: JOHN_PROFILE.bugs_found,
      is_ramped: JOHN_PROFILE.is_ramped,
      has_reviewed_once: JOHN_PROFILE.has_reviewed_once,
      is_pro: JOHN_PROFILE.is_pro,
      purchased_credits: JOHN_PROFILE.purchased_credits,
      created_at: createdAt,
    })
    .eq("id", johnId);

  if (error) throw new Error(`profile update: ${error.message}`);
}

async function summarize(
  johnId: string,
  adminClient: SupabaseClient,
  dryRun: boolean,
): Promise<SeedJohnPromoSummary | undefined> {
  if (dryRun) return undefined;

  const [profile, requests, ledger, shipped, peers, thanks] = await Promise.all([
    adminClient.from("profiles").select("credits, credits_pending, reviews_given, created_at").eq("id", johnId).single(),
    adminClient.from("requests").select("id", { count: "exact", head: true }).eq("user_id", johnId).eq("is_demo", true),
    adminClient.from("credit_ledger").select("amount").eq("user_id", johnId).like("reason", `${LEDGER_REASON_PREFIX}%`),
    adminClient.from("shipped_apps").select("id", { count: "exact", head: true }).eq("owner_id", johnId).like("app_url", `${PROMO_APP_URL_PREFIX}%`),
    adminClient.from("profile_reviews").select("id", { count: "exact", head: true }).eq("to_user_id", johnId),
    adminClient.from("thanks_messages").select("id", { count: "exact", head: true }).eq("to_user_id", johnId),
  ]);

  const ledgerSum = (ledger.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const summary: SeedJohnPromoSummary = {
    balance: profile.data?.credits,
    balancePending: profile.data?.credits_pending,
    reviewsGiven: profile.data?.reviews_given,
    memberSince: profile.data?.created_at,
    demoRequests: requests.count ?? 0,
    promoLedgerNet: ledgerSum,
    shippedApps: shipped.count ?? 0,
    peerReviews: peers.count ?? 0,
    thanksMessages: thanks.count ?? 0,
  };

  console.log("\n--- John promo seed summary ---");
  console.log(`Balance: ${summary.balance} dots (${summary.balancePending} pending)`);
  console.log(`Reviews given (profile): ${summary.reviewsGiven}`);
  console.log(`Member since: ${summary.memberSince}`);
  console.log(`Demo requests: ${summary.demoRequests}`);
  console.log(`Promo ledger net: ${summary.promoLedgerNet}`);
  console.log(`Shipped apps: ${summary.shippedApps}`);
  console.log(`Peer reviews: ${summary.peerReviews}`);
  console.log(`Thanks messages: ${summary.thanksMessages}`);

  return summary;
}

async function seedJohnPromoData(
  johnId: string,
  runtime: SeedRuntime,
): Promise<SeedJohnPromoResult> {
  const { admin, dryRun, force } = runtime;
  const existing = await johnDemoRequestIds(johnId, admin);

  if (existing.length > 0 && !force) {
    return {
      johnId,
      skipped: true,
      message: `John already has ${existing.length} demo request(s). Use force to reseed or clear to remove.`,
    };
  }

  if (force && existing.length > 0) {
    await clearJohnPromo(johnId, runtime);
  }

  await updateJohnProfile(johnId, runtime);
  await seedLedger(johnId, runtime);
  await seedJohnPosts(johnId, runtime);
  await seedJohnReviewsGiven(johnId, runtime);
  await seedPeerReviews(johnId, runtime);
  await seedThanks(johnId, runtime);
  await seedShippedApps(johnId, runtime);
  const summary = await summarize(johnId, admin, dryRun);

  return {
    johnId,
    dryRun,
    summary,
    message: dryRun ? "Dry run complete — no changes written." : "Done seeding John's promo profile.",
  };
}

export async function runSeedPreviewIfNeeded(
  options: { force?: boolean } = {},
): Promise<SeedPreviewResult> {
  return runSeedPreview({ force: options.force ?? false });
}

export async function runSeedJohnPromo(
  options: SeedJohnPromoOptions = {},
): Promise<SeedJohnPromoResult> {
  const runtime = createRuntime(options);
  const johnId = await ensureJohnId(runtime.admin);
  logAction(`Found ${JOHN_EMAIL} → ${johnId}`, runtime.dryRun);

  if (options.clear) {
    await clearJohnPromo(johnId, runtime);
    return {
      johnId,
      cleared: true,
      message: "Cleared John's promo data.",
    };
  }

  return seedJohnPromoData(johnId, runtime);
}
