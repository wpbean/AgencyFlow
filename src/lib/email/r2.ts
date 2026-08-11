import "server-only";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is S3-compatible, so the regular AWS SDK works against it —
// just point the endpoint at the account's R2 URL and use "auto" for region.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

function bucket(): string {
  return requiredEnv("R2_BUCKET");
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getR2Client().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getR2Client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function getObjectBytes(key: string): Promise<Buffer> {
  const result = await getR2Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error(`R2 object ${key} had no body`);
  return Buffer.from(bytes);
}

// The browser is redirected straight to this signed URL, so the image bytes
// stream from Cloudflare's edge instead of round-tripping through our VPS —
// that's what actually buys the loading-speed win, not just the storage move.
export async function getSignedGetUrl(
  key: string,
  expiresInSeconds: number,
  overrides?: { responseContentType?: string; responseContentDisposition?: string }
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ResponseContentType: overrides?.responseContentType,
    ResponseContentDisposition: overrides?.responseContentDisposition,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}
