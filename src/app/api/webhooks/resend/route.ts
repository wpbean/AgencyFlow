import { NextResponse, type NextRequest } from "next/server";
import { getResendClient } from "@/lib/email/resend";
import { handleInboundEmail } from "@/lib/email/inbound";

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

  if (event.type !== "email.received") {
    return new NextResponse(null, { status: 200 });
  }

  try {
    await handleInboundEmail(event.data.email_id);
  } catch (err) {
    console.error("Inbound email processing failed", err);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
