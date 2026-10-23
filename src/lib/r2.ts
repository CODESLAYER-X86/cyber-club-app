import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let s3ClientInstance: S3Client | null = null;

/**
 * Returns true if all required Cloudflare R2 environment variables are present.
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

/**
 * Returns a cached S3Client instance targeting Cloudflare R2's S3-compatible endpoint.
 */
function getR2Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are missing or incomplete in environment variables.');
  }

  s3ClientInstance = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3ClientInstance;
}

/**
 * Uploads a file buffer directly to Cloudflare R2 and returns its public URL.
 *
 * @param buffer - File data buffer
 * @param key - Destination object path (e.g., 'gallery/1729700000-xyz.webp')
 * @param contentType - MIME type (e.g., 'image/webp')
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_URL;

  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured.');
  }
  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_URL is not configured.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${publicBaseUrl.replace(/\/$/, '')}/${cleanKey}`;
}
