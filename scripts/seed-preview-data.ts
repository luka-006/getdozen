#!/usr/bin/env npx tsx
/**
 * Seed fictional demo board posts for preview recordings (is_demo = true).
 * All names, URLs, and studios are made up — nothing links to real products.
 *
 * Usage: npx tsx scripts/seed-preview-data.ts
 * Reseed: npx tsx scripts/seed-preview-data.ts --clear && npx tsx scripts/seed-preview-data.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

type Maker = {
  email: string;
  display_name: string;
  avatar_url: string;
  is_pro?: boolean;
  is_ramped?: boolean;
  reviews_given?: number;
  rating_avg?: number;
  rating_count?: number;
};

const MAKERS: Maker[] = [
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
};

/** Fictional URLs only — preview.example is a reserved documentation TLD pattern. */
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
    testers_filled: 4,
    duration_days: 14,
    hoursAgo: 6,
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
    testers_filled: 6,
    duration_days: 14,
    hoursAgo: 10,
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
    testers_filled: 3,
    question_count: 10,
    credit_cost: 30,
    duration_days: 20,
    hoursAgo: 14,
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
    testers_filled: 2,
    duration_days: 14,
    hoursAgo: 52,
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
    testers_filled: 8,
    duration_days: 14,
    hoursAgo: 22,
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
    testers_filled: 9,
    duration_days: 14,
    hoursAgo: 72,
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
  },
];

async function ensureMaker(maker: Maker): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list.users.find((u) => u.email?.toLowerCase() === maker.email);
  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: maker.email,
      email_confirm: true,
      user_metadata: { display_name: maker.display_name },
    });
    if (error || !data.user) throw new Error(`createUser ${maker.email}: ${error?.message}`);
    userId = data.user.id;
  }

  await admin.from("profiles").upsert(
    {
      id: userId,
      email: maker.email,
      display_name: maker.display_name,
      avatar_url: maker.avatar_url,
      is_pro: maker.is_pro ?? false,
      is_ramped: maker.is_ramped ?? false,
      reviews_given: maker.reviews_given ?? 0,
      rating_avg: maker.rating_avg ?? 0,
      rating_count: maker.rating_count ?? 0,
    },
    { onConflict: "id" },
  );

  return userId;
}

async function clearDemo() {
  const { data: rows } = await admin.from("requests").select("id").eq("is_demo", true);
  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length) {
    await admin.from("questions").delete().in("request_id", ids);
    await admin.from("requests").delete().in("id", ids);
  }
  console.log(`Removed ${ids.length} demo request(s).`);
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
    makerIds.push(await ensureMaker(maker));
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  for (const post of POSTS) {
    const created = new Date(Date.now() - (post.hoursAgo ?? 12) * 60 * 60 * 1000);
    const { error } = await admin.from("requests").insert({
      user_id: makerIds[post.makerIndex],
      type: post.type,
      product_type: post.product_type,
      app_name: post.app_name,
      app_url: post.app_url,
      app_description: post.app_description,
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
      is_demo: true,
      created_at: created.toISOString(),
    });
    if (error) throw new Error(`insert ${post.app_name}: ${error.message}`);
  }

  console.log(`Seeded ${POSTS.length} fictional demo posts for ${MAKERS.length} makers.`);
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
