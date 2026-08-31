import { boostAmountCents, proAmountCents, resolveDotOffer, resolveDotOfferByAmount } from "./pricing";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CheckoutLike = {
  id: string;
  mode: string | null;
  payment_status: string | null;
  currency: string | null;
  amount_total: number | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  subscription?: string | { id?: string } | null;
  customer?: string | { id?: string } | null;
};

export type DotGrant = {
  kind: "dots";
  profileId: string;
  dots: number;
  sessionId: string;
};

/** @deprecated use DotGrant */
export type CreditGrant = DotGrant & { credits: number };

export type ProGrant = {
  kind: "pro";
  profileId: string;
  subscriptionId: string;
  customerId: string;
  sessionId: string;
};

export type BoostGrant = {
  kind: "boost";
  profileId: string;
  requestId: string;
  sessionId: string;
};

export type FulfillmentSkip = {
  kind: "skip";
  reason: string;
};

export type Fulfillment = DotGrant | ProGrant | BoostGrant | FulfillmentSkip;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function paidInEur(session: CheckoutLike): string | null {
  if (session.payment_status !== "paid") return "not_paid";
  if ((session.currency ?? "").toLowerCase() !== "eur") return "currency";
  if (!Number.isInteger(session.amount_total) || (session.amount_total ?? 0) <= 0) {
    return "amount";
  }
  return null;
}

function resolveProfileId(session: CheckoutLike): string | null {
  const fromMeta = session.metadata?.profile_id?.trim() ?? "";
  const fromRef = session.client_reference_id?.trim() ?? "";
  if (fromMeta && !isUuid(fromMeta)) return null;
  if (fromRef && !isUuid(fromRef)) return null;
  if (fromMeta && fromRef && fromMeta !== fromRef) return null;
  const id = fromMeta || fromRef;
  return id && isUuid(id) ? id : null;
}

function idOf(value: string | { id?: string } | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.id ?? "";
}

/**
 * Decide what to grant from a verified Stripe Checkout Session.
 * Ignores metadata.credits and any client-supplied amounts.
 */
export function fulfillmentFromCheckout(session: CheckoutLike): Fulfillment {
  const sessionId = session.id?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return { kind: "skip", reason: "bad_session" };
  }

  const profileId = resolveProfileId(session);
  if (!profileId) return { kind: "skip", reason: "profile" };

  const unpaid = paidInEur(session);
  if (unpaid) return { kind: "skip", reason: unpaid };

  if (session.mode === "payment") {
    if ((session.metadata?.kind ?? "") === "boost") {
      const requestId = session.metadata?.request_id?.trim() ?? "";
      if (!isUuid(requestId)) return { kind: "skip", reason: "request" };
      if (session.amount_total !== boostAmountCents()) {
        return { kind: "skip", reason: "amount_mismatch" };
      }
      return {
        kind: "boost",
        profileId,
        requestId,
        sessionId,
      };
    }

    let offer = resolveDotOffer(session.metadata?.pack_id ?? "");
    if (!offer && session.amount_total != null) {
      offer = resolveDotOfferByAmount(session.amount_total);
    }
    if (!offer) return { kind: "skip", reason: "unknown_pack" };
    if (session.amount_total !== offer.amountCents) {
      return { kind: "skip", reason: "amount_mismatch" };
    }
    return {
      kind: "dots",
      profileId,
      dots: offer.dots,
      sessionId,
    };
  }

  if (session.mode === "subscription") {
    const subscriptionId = idOf(session.subscription);
    const customerId = idOf(session.customer);
    if (!subscriptionId || !customerId) {
      return { kind: "skip", reason: "subscription" };
    }
    if (session.amount_total !== proAmountCents()) {
      return { kind: "skip", reason: "amount_mismatch" };
    }
    return {
      kind: "pro",
      profileId,
      subscriptionId,
      customerId,
      sessionId,
    };
  }

  return { kind: "skip", reason: "mode" };
}

export function shouldActivateSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}
