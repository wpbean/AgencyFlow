import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { emailSuppressions } from "@/db/schema";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function page(body: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribe</title></head><body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111"><h1 style="font-size:1.25rem">${body}</h1></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = token ? verifyUnsubscribeToken(token) : null;

  if (!email) {
    return page("This unsubscribe link is invalid or has expired.");
  }

  await db
    .insert(emailSuppressions)
    .values({ email: email.toLowerCase(), reason: "unsubscribed" })
    .onConflictDoNothing();

  return page(`${email} has been unsubscribed and will not receive further campaign emails.`);
}
