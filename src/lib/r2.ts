import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let s3ClientInstance: S3Client | null = null;

function getCleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Returns true if all required Cloudflare R2 environment variables are present.
 */
export function isR2Configured(): boolean {
  return !!(
    getCleanEnv(process.env.R2_ACCOUNT_ID) &&
    getCleanEnv(process.env.R2_ACCESS_KEY_ID) &&
    getCleanEnv(process.env.R2_SECRET_ACCESS_KEY) &&
    getCleanEnv(process.env.R2_BUCKET_NAME) &&
    getCleanEnv(process.env.R2_PUBLIC_URL)
  );
}

/**
 * Returns a cached S3Client instance targeting Cloudflare R2's S3-compatible endpoint.
 */
export function getR2Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const accountId = getCleanEnv(process.env.R2_ACCOUNT_ID);
  const accessKeyId = getCleanEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = getCleanEnv(process.env.R2_SECRET_ACCESS_KEY);

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
  const bucketName = getCleanEnv(process.env.R2_BUCKET_NAME);
  const publicBaseUrl = getCleanEnv(process.env.R2_PUBLIC_URL);

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

/**
 * Deletes an object from Cloudflare R2 by key or public URL.
 */
export async function deleteFromR2(keyOrUrl: string): Promise<boolean> {
  try {
    if (!isR2Configured()) return false;
    const client = getR2Client();
    const bucketName = getCleanEnv(process.env.R2_BUCKET_NAME);
    if (!bucketName) return false;

    // Extract key if a full URL was provided
    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http')) {
      try {
        const urlObj = new URL(keyOrUrl);
        key = urlObj.pathname.replace(/^\/+/, '');
      } catch {
        key = keyOrUrl;
      }
    }

    const cleanKey = key.replace(/^\/+/, '');

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      })
    );
    return true;
  } catch (err) {
    console.error('Failed to delete object from R2:', err);
    return false;
  }
}

