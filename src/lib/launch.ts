/**
 * Waitlist is the public mode while Dozen is closed.
 * Set LAUNCH_OPEN=false on Vercel (and locally) to lock the site.
 * LAUNCH_OPEN unset or any value other than "false" keeps the product open.
 */
export function waitlistMode() {
  return process.env.LAUNCH_OPEN === "false";
}

export function isLaunchOpen() {
  return !waitlistMode();
}
