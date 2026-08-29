import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend-client";
import { ownerInbox } from "@/lib/mail-inbox";
import { resendFromAddress } from "@/lib/resend-mail";
import { SITE_EMAIL } from "@/lib/site-email";

export const runtime = "nodejs";

type InboundEvent = {
  type: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
  };
};

export async function POST(request: Request) {
  const resend = getResendClient();
  if (!resend) {
    return new NextResponse("Mailer not configured", { status: 503 });
  }

  const payload = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();

  let event: InboundEvent;
  try {
    if (secret) {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: request.headers.get("svix-id") ?? "",
          timestamp: request.headers.get("svix-timestamp") ?? "",
          signature: request.headers.get("svix-signature") ?? "",
        },
        webhookSecret: secret,
      }) as InboundEvent;
    } else if (process.env.NODE_ENV === "production") {
      console.error("RESEND_WEBHOOK_SECRET missing in production");
      return new NextResponse("Webhook secret not configured", { status: 503 });
    } else {
      event = JSON.parse(payload) as InboundEvent;
    }
  } catch (err) {
    console.error("Resend webhook verification failed", err);
    return new NextResponse("Invalid webhook", { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    return new NextResponse("Missing email_id", { status: 400 });
  }

  const { data, error } = await resend.emails.receiving.forward({
    emailId,
    from: resendFromAddress(),
    to: ownerInbox(),
  });

  if (error) {
    console.error("Resend inbound forward failed", error);
    return new NextResponse(error.message, { status: 500 });
  }

  console.info("Forwarded inbound email", {
    emailId,
    to: ownerInbox(),
    from: SITE_EMAIL,
    originalFrom: event.data?.from,
    subject: event.data?.subject,
    forwardId: data?.id,
  });

  return NextResponse.json({ ok: true, id: data?.id });
}
