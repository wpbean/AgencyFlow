import { NextResponse, type NextRequest } from "next/server";
import { getResendClient } from "@/lib/email/resend";
import { handleInboundEmail } from "@/lib/email/inbound";
import { handleCampaignEvent, isCampaignWebhookEvent } from "@/lib/email/webhook-events";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RESEND_WEBHOOK_SECRET is not set; rejecting inbound webhook.");
    return new NextResponse(null, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    id: request.headers.get("svix-id") ?? "",
    timestamp: request.headers.get("svix-timestamp") ?? "",
    signature: request.headers.get("svix-signature") ?? "",
  };

  let event;
  try {
    event = getResendClient().webhooks.verify({ payload, headers, webhookSecret });
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  try {
    if (event.type === "email.received") {
      await handleInboundEmail(event.data.email_id);
    } else if (isCampaignWebhookEvent(event)) {
      await handleCampaignEvent(event);
    }
  } catch (err) {
    console.error(`Resend webhook processing failed for event "${event.type}"`, err);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
