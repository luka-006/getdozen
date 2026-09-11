#!/usr/bin/env npx tsx
/**
 * Print one-click URLs to compose launch posts (open on your logged-in browser).
 *   npx tsx scripts/print-launch-links.ts
 */
const SITE = "https://getdozen.dev";
const VIDEO_V = `${SITE}/marketing/dozen-launch-preview.mp4`;
const VIDEO_H = `${SITE}/marketing/dozen-launch-horizontal.mp4`;

const xPost1 = `Dozen is live — a feedback loop for indie makers.

→ Post your app or game
→ 12 testers opt in for a 14-day run
→ Structured reviews, not "looks cool bro"

Test others. Earn Dots. Ship with proof.

${SITE}`;

const linkedIn = `I shipped Dozen — a marketplace for structured app and game feedback.

Indie makers need more than "looks great!" from friends. They need:
• 12 committed testers (not 200 email addresses)
• 14-day runs with check-ins
• Reviews that answer real questions
• A credit system that rewards quality, not volume

Testers earn Dots. Makers get signal before launch.

Live now: ${SITE}

If you're building mobile apps, web tools, or indie games — I'd love your feedback on the product itself.`;

function intent(base: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return `${base}?${q}`;
}

console.log("Dozen launch — open these while logged in\n");
console.log("=== X / Twitter (post 1 — attach video from Files or paste URL in reply) ===");
console.log(intent("https://twitter.com/intent/tweet", { text: xPost1 }));
console.log(`\nVideo to attach: ${VIDEO_V}\n`);

console.log("=== LinkedIn (paste body, attach horizontal video) ===");
console.log(intent("https://www.linkedin.com/feed/", {}));
console.log("(Compose new post manually; video:", VIDEO_H + ")\n");
console.log(linkedIn);
console.log("\n=== Hacker News ===");
console.log("https://news.ycombinator.com/submitlink?u=" + encodeURIComponent(SITE));
console.log("Title: Show HN: Dozen – structured feedback and 14-day tester runs for indie apps/games\n");

console.log("=== Waitlist (local, needs .env.local) ===");
console.log("npx tsx scripts/send-waitlist-launch.ts --dry-run");
console.log("npx tsx scripts/send-waitlist-launch.ts --to you@example.com");
console.log("npx tsx scripts/send-waitlist-launch.ts");
