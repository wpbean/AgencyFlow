import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to your environment to send campaigns.");
  }
  if (!client) client = new Resend(apiKey);
  return client;
}
