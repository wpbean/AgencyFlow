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

let receivingClient: Resend | null = null;

// Inbound email lives under whichever Resend account owns the receiving
// domain, which may be a different account (and API key) than the one used
// for sending campaigns -- e.g. on the free plan, where one account can only
// verify one domain. Falls back to RESEND_API_KEY when both live on the same
// account.
export function getResendReceivingClient(): Resend {
  const apiKey = process.env.RESEND_RECEIVING_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_RECEIVING_API_KEY (or RESEND_API_KEY) is not set. Add it to your environment to receive inbound email."
    );
  }
  if (!receivingClient) receivingClient = new Resend(apiKey);
  return receivingClient;
}
