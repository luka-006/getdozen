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

// TRUNCATED_FOR_TOOL_LIMIT - using invoke file push instead
