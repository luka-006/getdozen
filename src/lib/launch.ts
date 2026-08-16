/**
 * Waitlist is off while we test the full product.
 * Set LAUNCH_OPEN=false on Vercel (and locally) to lock the site again.
 */
export function isLaunchOpen() {
  return process.env.LAUNCH_OPEN !== "false";
}
