import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messageAttachments } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { getAttachmentBytes, getThumbnailBytes } from "@/lib/email/attachment-storage";

// SVGs can embed scripts and shouldn't be re-encoded as a raster thumbnail.
function canThumbnail(contentType: string): boolean {
  return contentType.startsWith("image/") && contentType !== "image/svg+xml";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [attachment] = await db.select().from(messageAttachments).where(eq(messageAttachments.id, id)).limit(1);
  // Purged attachments keep their DB row (see purgedAt on messageAttachments) but the bytes
  // are gone from disk — treat them the same as "not found" here; the UI shows an expired
  // placeholder instead of ever requesting this route for them.
  if (!attachment || attachment.purgedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wantsThumbnail = new URL(request.url).searchParams.get("variant") === "thumb" && canThumbnail(attachment.contentType);

  try {
    const bytes = wantsThumbnail ? await getThumbnailBytes(attachment.storagePath) : await getAttachmentBytes(attachment.storagePath);
    const contentType = wantsThumbnail ? "image/webp" : attachment.contentType;
    const disposition = wantsThumbnail || attachment.isInline ? "inline" : "attachment";
    const filename = (attachment.filename || attachment.id).replace(/"/g, "");

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
