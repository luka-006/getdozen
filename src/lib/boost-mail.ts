import { SITE_ORIGIN } from "@/lib/app-url";
import { BOOST_HOURS, BOOST_WAIT_DAYS } from "@/lib/constants";
import { BOOST_PRICE_EUR } from "@/lib/pricing";
import { sendResendEmail } from "@/lib/resend-mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { canBuyBoardBoost, isBoostActive } from "@/lib/boost";

type BoostOfferRow = {
  id: string;
  user_id: string;
  app_name: string;
  created_at: string;
};

function offerUrl(row: BoostOfferRow) {
  return `${SITE_ORIGIN}/requests/${row.id}`;
}

function offerText(row: BoostOfferRow) {
  return [
    `Your post "${row.app_name}" has been waiting ${BOOST_WAIT_DAYS}+ days.`,
    "",
    `Pay €${BOOST_PRICE_EUR} and it sits on top of the board for ${BOOST_HOURS} hours.`,
    "",
    offerUrl(row),
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function offerHtml(row: BoostOfferRow) {
  const url = escapeHtml(offerUrl(row));
  return [
    `<p>Your post "${escapeHtml(row.app_name)}" has been waiting ${BOOST_WAIT_DAYS}+ days.</p>`,
    `<p>Pay €${BOOST_PRICE_EUR} and it sits on top of the board for ${BOOST_HOURS} hours.</p>`,
    `<p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#1E4FD8;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600">Boost this post</a></p>`,
  ].join("");
}

async function sendResend(to: string, row: BoostOfferRow) {
  const mailed = await sendResendEmail({
    to,
    subject: `Pin "${row.app_name}" to the top for €${BOOST_PRICE_EUR}`,
    text: offerText(row),
    html: offerHtml(row),
  });
  return mailed.ok;
}

export async function sendBoostOffers() {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - BOOST_WAIT_DAYS * 24 * 60 * 60 * 1000);
  const mailerReady = Boolean(process.env.RESEND_API_KEY?.trim());

  const { data: rows } = await admin
    .from("requests")
    .select("id, user_id, app_name, created_at, boosted_until, boost_offer_sent_at, status")
    .eq("status", "open")
    .is("boost_offer_sent_at", null)
    .lte("created_at", cutoff.toISOString())
    .limit(40);

  for (const row of rows ?? []) {
    if (!canBuyBoardBoost(row.created_at)) continue;
    if (isBoostActive(row.boosted_until)) continue;

    const { data: owner } = await admin
      .from("profiles")
      .select("email")
      .eq("id", row.user_id)
      .maybeSingle();

    const email = owner?.email?.trim();
    let mailed = false;
    if (email) {
      mailed = await sendResend(email, row as BoostOfferRow);
    }

    if (mailed || !email || !mailerReady) {
      await admin
        .from("requests")
        .update({ boost_offer_sent_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }
}
