import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messageAttachments } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { getAttachmentDownloadUrl, getThumbnailBytes } from "@/lib/email/attachment-storage";

// SVGs can embed scripts and shouldn't be re-encoded as a raster thumbnail.
function canThumbnail(contentType: string): boolean {
  return contentType.startsWith("image/") && contentType !== "image/svg+xml";
}

// Thumbnails are proxied and cached with a stable URL so repeat thread opens
// are served from the browser cache with zero network round trip. Full
// originals are only ever fetched on an explicit lightbox click, so instead
// we redirect to a short-lived signed R2 URL — the (potentially multi-MB)
// bytes stream straight from Cloudflare's edge rather than through our VPS.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [attachment] = await db.select().from(messageAttachments).where(eq(messageAttachments.id, id)).limit(1);
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wantsThumbnail = new URL(request.url).searchParams.get("variant") === "thumb" && canThumbnail(attachment.contentType);

  try {
    if (wantsThumbnail) {
      const bytes = await getThumbnailBytes(attachment.storagePath);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/webp",
          "Content-Disposition": "inline",
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      });
    }

    const filename = attachment.filename || attachment.id;
    const signedUrl = await getAttachmentDownloadUrl(
      attachment.storagePath,
      attachment.contentType,
      attachment.isInline ? "inline" : "attachment",
      filename
    );
    return NextResponse.redirect(signedUrl, { status: 302, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
