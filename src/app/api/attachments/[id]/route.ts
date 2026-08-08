import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messageAttachments } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { readAttachmentBytes } from "@/lib/email/attachment-storage";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [attachment] = await db.select().from(messageAttachments).where(eq(messageAttachments.id, id)).limit(1);
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readAttachmentBytes(attachment.storagePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const disposition = attachment.isInline ? "inline" : "attachment";
  const filename = (attachment.filename || attachment.id).replace(/"/g, "");

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
