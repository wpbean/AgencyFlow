import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailSuppressions, campaignEvents, campaignRecipients } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function page(body: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribe</title></head><body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">${body}</h1></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const parsed = token ? verifyUnsubscribeToken(token) : null;

  if (!parsed) {
    return page("This unsubscribe link is invalid or has expired.");
  }

  const { email, campaignId, recipientId } = parsed;

  await db
    .insert(emailSuppressions)
    .values({ email: email.toLowerCase(), reason: "unsubscribed", campaignId: campaignId ?? null })
    .onConflictDoNothing();

  if (campaignId && recipientId) {
    await db
      .update(campaignRecipients)
      .set({ unsubscribedAt: new Date() })
      .where(eq(campaignRecipients.id, recipientId));
    await db.insert(campaignEvents).values({ campaignId, recipientId, type: "UNSUBSCRIBED" });
  }

  return page(`${email} has been unsubscribed and will not receive further campaign emails.`);
}
