#!/usr/bin/env npx tsx
/**
 * Seed fictional demo board posts + active tester commitments (is_demo = true).
 * All names, URLs, icons, and studios are made up — nothing links to real products.
 *
 * Usage: npx tsx scripts/seed-preview-data.ts
 * Reseed: npx tsx scripts/seed-preview-data.ts --force
 * Clear:  npx tsx scripts/seed-preview-data.ts --clear
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { CORE_QUESTIONS, QUESTION_LIBRARY } from "../src/lib/constants";

const CHECKIN_INTERVAL_DAYS = 3;

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const clear = process.argv.includes("--clear");
const force = process.argv.includes("--force");

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Person = {
  email: string;
  display_name: string;
  avatar_url: string;
  is_pro?: boolean;
  is_ramped?: boolean;
  reviews_given?: number;
  rating_avg?: number;
  rating_count?: number;
};

const MAKERS: Person[] = [
  {
    email: "preview-forge@demo.getdozen.dev",
    display_name: "Pixel Forge",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=forge",
    is_pro: true,
    is_ramped: true,
    reviews_given: 24,
    rating_avg: 4.8,
    rating_count: 12,
  },
  {
    email: "preview-nova@demo.getdozen.dev",
    display_name: "Nova Budget",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=nova",
    reviews_given: 9,
    rating_avg: 4.5,
    rating_count: 6,
  },
  {
    email: "preview-trail@demo.getdozen.dev",
    display_name: "Trailhead Studio",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=trail",
    is_ramped: true,
    reviews_given: 16,
    rating_avg: 4.9,
    rating_count: 8,
  },
  {
    email: "preview-lumen@demo.getdozen.dev",
    display_name: "Lumen Health",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=lumen",
    reviews_given: 5,
    rating_avg: 4.2,
    rating_count: 3,
  },
  {
    email: "preview-orbit@demo.getdozen.dev",
    display_name: "Orbit Notes",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=orbit",
    is_pro: true,
    reviews_given: 31,
    rating_avg: 4.7,
    rating_count: 15,
  },
  {
    email: "preview-hollow@demo.getdozen.dev",
    display_name: "Hollow Lantern Games",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=hollow",
    is_pro: true,
    reviews_given: 18,
    rating_avg: 4.6,
    rating_count: 9,
  },
  {
    email: "preview-kite@demo.getdozen.dev",
    display_name: "Kitefall Interactive",
    avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=kite",
    reviews_given: 11,
    rating_avg: 4.4,
    rating_count: 5,
  },
];

const TESTERS: Person[] = [
  { email: "preview-tester-01@demo.getdozen.dev", display_name: "Mira K.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=mira-k" },
  { email: "preview-tester-02@demo.getdozen.dev", display_name: "Jonas P.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=jonas-p" },
  { email: "preview-tester-03@demo.getdozen.dev", display_name: "Suki T.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=suki-t" },
  { email: "preview-tester-04@demo.getdozen.dev", display_name: "Evan L.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=evan-l" },
  { email: "preview-tester-05@demo.getdozen.dev", display_name: "Priya N.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=priya-n" },
  { email: "preview-tester-06@demo.getdozen.dev", display_name: "Theo W.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=theo-w" },
  { email: "preview-tester-07@demo.getdozen.dev", display_name: "Hana S.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=hana-s" },
  { email: "preview-tester-08@demo.getdozen.dev", display_name: "Marcus D.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=marcus-d" },
  { email: "preview-tester-09@demo.getdozen.dev", display_name: "Yuki A.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=yuki-a" },
  { email: "preview-tester-10@demo.getdozen.dev", display_name: "Cleo F.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=cleo-f" },
  { email: "preview-tester-11@demo.getdozen.dev", display_name: "Omar B.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=omar-b" },
  { email: "preview-tester-12@demo.getdozen.dev", display_name: "Rin C.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=rin-c" },
  { email: "preview-tester-13@demo.getdozen.dev", display_name: "Dalia H.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=dalia-h" },
  { email: "preview-tester-14@demo.getdozen.dev", display_name: "Felix G.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=felix-g" },
  { email: "preview-tester-15@demo.getdozen.dev", display_name: "Nora V.", avatar_url: "https://api.dicebear.com/9.x/thumbs/svg?seed=nora-v" },
];

type DemoPost = {
  makerIndex: number;
  type: "tester" | "feedback" | "combo";
  product_type: "app" | "game";
  app_name: string;
  app_url: string;
  app_description: string;
  platform: "web" | "ios" | "android" | "steam" | "itch";
  focus_tag?: "UX" | "Market" | "Technical" | "Gameplay" | null;
  testers_needed?: number;
  testers_filled?: number;
  question_count?: number;
  credit_cost?: number;
  bounty_multiplier?: number;
  duration_days?: number;
  hoursAgo?: number;
  opt_in_link?: string | null;
  icon_seed?: string;
};

const POSTS: DemoPost[] = [
  {
    makerIndex: 0,
    type: "tester",
    product_type: "app",
    app_name: "Focus Flow",
    app_url: "https://preview.example/apps/focus-flow",
    app_description: "Minimal Pomodoro timer with widget and weekly streaks.",
    platform: "ios",
    focus_tag: "UX",
    testers_needed: 12,
    testers_filled: 6,
    duration_days: 14,
    hoursAgo: 6,
    opt_in_link: "https://preview.example/testflight/focus-flow",
    icon_seed: "focus-flow",
  },
  {
    makerIndex: 5,
    type: "tester",
    product_type: "game",
    app_name: "Starlit Courier",
    app_url: "https://preview.example/games/starlit-courier",
    app_description:
      "Cozy delivery roguelite — fly fragile parcels through asteroid lanes.",
    platform: "steam",
    focus_tag: "Gameplay",
    testers_needed: 12,
    testers_filled: 8,
    duration_days: 14,
    hoursAgo: 10,
    opt_in_link: "https://preview.example/playtest/starlit-courier",
    icon_seed: "starlit-courier",
  },
  {
    makerIndex: 1,
    type: "feedback",
    product_type: "app",
    app_name: "Receipt Snap",
    app_url: "https://preview.example/apps/receipt-snap",
    app_description: "Scan receipts for freelancers — need clarity on onboarding.",
    platform: "android",
    focus_tag: "Market",
    question_count: 8,
    credit_cost: 16,
    bounty_multiplier: 1.5,
    hoursAgo: 18,
    icon_seed: "receipt-snap",
  },
  {
    makerIndex: 6,
    type: "feedback",
    product_type: "game",
    app_name: "Pinefolk Tavern",
    app_url: "https://preview.example/itch/pinefolk-tavern",
    app_description:
      "Management sim about running a fantasy inn — demo build on page.",
    platform: "itch",
    focus_tag: "Gameplay",
    question_count: 10,
    credit_cost: 20,
    hoursAgo: 5,
    icon_seed: "pinefolk-tavern",
  },
  {
    makerIndex: 2,
    type: "combo",
    product_type: "app",
    app_name: "Trailhead Maps",
    app_url: "https://preview.example/apps/trailhead-maps",
    app_description: "Offline hiking maps with GPX import and elevation profiles.",
    platform: "android",
    focus_tag: "Technical",
    testers_needed: 12,
    testers_filled: 7,
    question_count: 10,
    credit_cost: 20,
    duration_days: 14,
    hoursAgo: 30,
    opt_in_link: "https://preview.example/play/trailhead-maps",
    icon_seed: "trailhead-maps",
  },
  {
    makerIndex: 5,
    type: "combo",
    product_type: "game",
    app_name: "Vaultbreaker 2084",
    app_url: "https://preview.example/games/vaultbreaker-2084",
    app_description:
      "Top-down stealth puzzler in a neon archive — needs playtest pacing notes.",
    platform: "steam",
    focus_tag: "Gameplay",
    testers_needed: 12,
    testers_filled: 5,
    question_count: 10,
    credit_cost: 30,
    duration_days: 20,
    hoursAgo: 14,
    opt_in_link: "https://preview.example/playtest/vaultbreaker",
    icon_seed: "vaultbreaker-2084",
  },
  {
    makerIndex: 3,
    type: "tester",
    product_type: "app",
    app_name: "Sleep Ledger",
    app_url: "https://preview.example/apps/sleep-ledger",
    app_description: "Track sleep debt without wearables — manual check-ins only.",
    platform: "web",
    testers_needed: 12,
    testers_filled: 4,
    duration_days: 14,
    hoursAgo: 52,
    icon_seed: "sleep-ledger",
  },
  {
    makerIndex: 4,
    type: "feedback",
    product_type: "app",
    app_name: "Orbit Notes",
    app_url: "https://preview.example/apps/orbit-notes",
    app_description: "Markdown notes with bi-directional links for indie makers.",
    platform: "web",
    focus_tag: "UX",
    question_count: 7,
    credit_cost: 14,
    hoursAgo: 8,
    icon_seed: "orbit-notes",
  },
  {
    makerIndex: 6,
    type: "tester",
    product_type: "game",
    app_name: "Relay Protocol",
    app_url: "https://preview.example/games/relay-protocol",
    app_description: "Co-op programming puzzle game about routing signal packets.",
    platform: "web",
    focus_tag: "Gameplay",
    testers_needed: 12,
    testers_filled: 9,
    duration_days: 14,
    hoursAgo: 22,
    icon_seed: "relay-protocol",
  },
  {
    makerIndex: 0,
    type: "tester",
    product_type: "app",
    app_name: "Palette Kit",
    app_url: "https://preview.example/apps/palette-kit",
    app_description: "Export Figma tokens to Tailwind and SwiftUI.",
    platform: "ios",
    testers_needed: 12,
    testers_filled: 10,
    duration_days: 14,
    hoursAgo: 72,
    opt_in_link: "https://preview.example/testflight/palette-kit",
    icon_seed: "palette-kit",
  },
  {
    makerIndex: 2,
    type: "feedback",
    product_type: "app",
    app_name: "Campfire Chat",
    app_url: "https://preview.example/apps/campfire-chat",
    app_description: "Async standups for remote teams — testing pricing page copy.",
    platform: "web",
    focus_tag: "Market",
    question_count: 6,
    credit_cost: 12,
    hoursAgo: 4,
    icon_seed: "campfire-chat",
  },
  {
    makerIndex: 3,
    type: "feedback",
    product_type: "game",
    app_name: "Driftwood Rally",
    app_url: "https://preview.example/games/driftwood-rally",
    app_description: "Arcade time-trial racer with daily ghost challenges.",
    platform: "itch",
    focus_tag: "Gameplay",
    question_count: 8,
    credit_cost: 16,
    hoursAgo: 3,
    icon_seed: "driftwood-rally",
  },
  {
    makerIndex: 4,
    type: "feedback",
    product_type: "app",
    app_name: "Ledger Lite",
    app_url: "https://preview.example/apps/ledger-lite",
    app_description: "Simple expense tracker for side projects — onboarding needs work.",
    platform: "ios",
    focus_tag: "UX",
    question_count: 7,
    credit_cost: 14,
    hoursAgo: 7,
    icon_seed: "ledger-lite",
  },
  {
    makerIndex: 1,
    type: "feedback",
    product_type: "game",
    app_name: "Neon Dockyard",
    app_url: "https://preview.example/games/neon-dockyard",
    app_description: "Puzzle game about arranging cargo in a space port.",
    platform: "steam",
    focus_tag: "Gameplay",
    question_count: 10,
    credit_cost: 20,
    bounty_multiplier: 1.5,
    hoursAgo: 9,
    icon_seed: "neon-dockyard",
  },
];

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function seededInt(seed: string, min: number, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return min + (Math.abs(h) % (max - min + 1));
}

function appIconUrl(seed: string, productType: "app" | "game"): string {
  const style = productType === "game" ? "shapes" : "identicon";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function daysSinceJoin(seed: string, duration: number): number {
  const max = Math.max(1, Math.min(duration - 1, 12));
  return seededInt(seed, 1, max);
}

function buildCheckinState(seed: string, duration: number, daysJoinedAgo: number) {
  const checkinDays = Array.from({ length: duration }, () => false);
  let completed = 0;
  let missed = 0;

  for (let day = 0; day < duration; day += CHECKIN_INTERVAL_DAYS) {
    if (day > daysJoinedAgo) break;
    const hit = seededInt(`${seed}:checkin:${day}`, 0, 99) < 88;
    if (hit) {
      checkinDays[day] = true;
      completed++;
    } else if (day < daysJoinedAgo) {
      missed++;
    }
  }

  return { checkinDays, checkins_completed: completed, checkins_missed: missed };
}

const CHECKIN_SNIPPETS = [
  "Onboarding is clear but the settings screen feels buried.",
  "Love the pacing — day three felt smoother than day one.",
  "Crash once when switching tabs; otherwise solid.",
  "Tutorial could be shorter; I knew what to do after two minutes.",
  "Dark mode contrast on buttons needs a bump.",
  "Multiplayer lobby was empty but solo mode works well.",
  "Export flow is fast; would pay for batch mode.",
  "Map tiles load slowly on older Android — worth noting.",
];

function checkinAnswer(seed: string): string {
  const idx = seededInt(seed, 0, CHECKIN_SNIPPETS.length - 1);
  return CHECKIN_SNIPPETS[idx]!;
}

async function ensurePerson(person: Person): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === person.email);
  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: person.email,
      email_confirm: true,
      user_metadata: { display_name: person.display_name },
    });
    if (error || !data.user) {
      throw new Error(`createUser ${person.email}: ${error?.message}`);
    }
    userId = data.user.id;
  }

  await admin.from("profiles").upsert(
    {
      id: userId,
      email: person.email,
      display_name: person.display_name,
      avatar_url: person.avatar_url,
      is_pro: person.is_pro ?? false,
      is_ramped: person.is_ramped ?? false,
      reviews_given: person.reviews_given ?? 0,
      rating_avg: person.rating_avg ?? 0,
      rating_count: person.rating_count ?? 0,
    },
    { onConflict: "id" },
  );

  return userId;
}

async function clearDemo() {
  const { data: rows } = await admin.from("requests").select("id").eq("is_demo", true);
  const ids = (rows ?? []).map((r) => r.id);
  if (!ids.length) {
    console.log("No demo requests to remove.");
    return;
  }

  await admin.from("reviews").delete().in("request_id", ids);

  const { data: commitments } = await admin
    .from("tester_commitments")
    .select("id")
    .in("request_id", ids);
  const commitmentIds = (commitments ?? []).map((c) => c.id);

  if (commitmentIds.length) {
    await admin.from("checkins").delete().in("commitment_id", commitmentIds);
    await admin.from("tester_commitments").delete().in("id", commitmentIds);
  }

  await admin.from("questions").delete().in("request_id", ids);
  await admin.from("requests").delete().in("id", ids);
  console.log(`Removed ${ids.length} demo request(s) and ${commitmentIds.length} commitment(s).`);
}

function demoCustomQuestions(count: number): string[] {
  const pool = QUESTION_LIBRARY.flatMap((g) => g.questions);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[i % pool.length]!);
  }
  return out;
}

async function seedQuestions(requestId: string, post: DemoPost) {
  if (post.type !== "feedback" && post.type !== "combo") return;

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

  const { error } = await admin.from("questions").insert(rows);
  if (error) throw new Error(`questions ${post.app_name}: ${error.message}`);
}

async function seedCommitments(
  requestId: string,
  post: DemoPost,
  postIndex: number,
  testerIds: string[],
) {
  const filled = post.testers_filled ?? 0;
  if (filled <= 0 || (post.type !== "tester" && post.type !== "combo")) return;

  const duration = post.duration_days ?? 14;

  for (let i = 0; i < filled; i++) {
    const testerIndex = (postIndex * 3 + i) % testerIds.length;
    const testerId = testerIds[testerIndex]!;
    const tester = TESTERS[testerIndex]!;
    const seed = `${post.app_name}:${tester.display_name}`;

    const daysJoinedAgo = daysSinceJoin(`${seed}:days`, duration);
    const optedInAt = new Date();
    optedInAt.setDate(optedInAt.getDate() - daysJoinedAgo);
    optedInAt.setHours(seededInt(`${seed}:hour`, 8, 21), seededInt(`${seed}:min`, 0, 59), 0, 0);

    const completesAt = new Date(optedInAt);
    completesAt.setDate(completesAt.getDate() + duration);

    const { checkinDays, checkins_completed, checkins_missed } = buildCheckinState(
      seed,
      duration,
      daysJoinedAgo,
    );

    const status = daysJoinedAgo >= duration ? "completed" : "active";

    const { data: commitment, error } = await admin
      .from("tester_commitments")
      .insert({
        request_id: requestId,
        tester_id: testerId,
        google_email: tester.email,
        google_email_hash: hashEmail(tester.email),
        opted_in_at: optedInAt.toISOString(),
        completes_at: completesAt.toISOString(),
        duration_days: duration,
        platform: post.platform,
        checkin_days: checkinDays,
        checkins_completed,
        checkins_missed,
        status,
        last_checkin_at:
          checkins_completed > 0
            ? new Date(
                optedInAt.getTime() +
                  Math.floor(daysJoinedAgo / CHECKIN_INTERVAL_DAYS) *
                    CHECKIN_INTERVAL_DAYS *
                    86400000,
              ).toISOString()
            : null,
      })
      .select("id")
      .single();

    if (error || !commitment) {
      throw new Error(`commitment ${post.app_name}/${tester.display_name}: ${error?.message}`);
    }

    for (let day = 0; day < duration; day += CHECKIN_INTERVAL_DAYS) {
      if (!checkinDays[day]) continue;
      await admin.from("checkins").insert({
        commitment_id: commitment.id,
        day_index: day,
        prompt_answer: checkinAnswer(`${seed}:answer:${day}`),
      });
    }
  }
}

async function seed() {
  const { count } = await admin
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("is_demo", true);

  if ((count ?? 0) > 0 && !force) {
    console.log(
      `Demo data already present (${count} posts). Use --clear or --force to reseed.`,
    );
    return;
  }

  if (force && (count ?? 0) > 0) {
    await clearDemo();
  }

  const makerIds: string[] = [];
  for (const maker of MAKERS) {
    makerIds.push(await ensurePerson(maker));
  }

  const testerIds: string[] = [];
  for (const tester of TESTERS) {
    testerIds.push(await ensurePerson(tester));
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  let commitmentTotal = 0;

  for (let postIndex = 0; postIndex < POSTS.length; postIndex++) {
    const post = POSTS[postIndex]!;
    const created = new Date(Date.now() - (post.hoursAgo ?? 12) * 60 * 60 * 1000);
    const iconSeed = post.icon_seed ?? post.app_name.toLowerCase().replace(/\s+/g, "-");

    const { data: inserted, error } = await admin
      .from("requests")
      .insert({
        user_id: makerIds[post.makerIndex],
        type: post.type,
        product_type: post.product_type,
        app_name: post.app_name,
        app_url: post.app_url,
        app_description: post.app_description,
        app_icon_url: appIconUrl(iconSeed, post.product_type),
        platform: post.platform,
        focus_tag: post.focus_tag ?? null,
        question_count: post.question_count ?? (post.type === "tester" ? 0 : 7),
        credit_cost: post.credit_cost ?? 14,
        testers_needed: post.testers_needed ?? (post.type === "feedback" ? 0 : 12),
        testers_filled: post.testers_filled ?? 0,
        status: "open",
        bounty_multiplier: post.bounty_multiplier ?? 1,
        expires_at: expiresAt.toISOString(),
        duration_days: post.duration_days ?? 14,
        opt_in_link: post.opt_in_link ?? null,
        is_demo: true,
        created_at: created.toISOString(),
      })
      .select("id")
      .single();

    if (error || !inserted) {
      throw new Error(`insert ${post.app_name}: ${error?.message}`);
    }

    const filled = post.testers_filled ?? 0;
    if (filled > 0 && (post.type === "tester" || post.type === "combo")) {
      await seedCommitments(inserted.id, post, postIndex, testerIds);
      commitmentTotal += filled;
    }

    if (post.type === "feedback" || post.type === "combo") {
      await seedQuestions(inserted.id, post);
    }
  }

  console.log(
    `Seeded ${POSTS.length} fictional posts, ${commitmentTotal} mock tester commitments, ${TESTERS.length} testers.`,
  );
}

async function main() {
  if (clear) {
    await clearDemo();
  } else {
    await seed();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
