import { NextRequest } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase-server';
import { errorResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '@/lib/api-utils';
import { isR2Configured, uploadBufferToR2, deleteFromR2 } from '@/lib/r2';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    // Session authentication check
    const caller = await getSupabaseUser();
    if (!caller) {
      return unauthorizedResponse('You must be signed in to upload media');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return errorResponse('No file provided');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('File size exceeds the 10MB limit');
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return errorResponse('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.');
    }

    if (!isR2Configured()) {
      return errorResponse('Cloudflare R2 is not fully configured on the server', 503);
    }

    // Sanitize folder and filename
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'webp';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const key = `${sanitizedFolder}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadBufferToR2(buffer, key, file.type);

    return successResponse({ url, key });
  } catch (err: any) {
    console.error('Error in /api/upload:', err);
    return serverErrorResponse(err?.message || 'Failed to upload image to R2');
  }
}

export async function GET(request: NextRequest) {
  const accountId = process.env.R2_ACCOUNT_ID?.trim().replace(/^["']|["']$/g, '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["']|["']$/g, '');
  const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["']|["']$/g, '');
  const bucketName = process.env.R2_BUCKET_NAME?.trim().replace(/^["']|["']$/g, '');
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^["']|["']$/g, '');

  const diagnostics = {
    hasAccountId: !!accountId,
    accountIdPreview: accountId ? `${accountId.slice(0, 4)}...${accountId.slice(-4)}` : null,
    hasAccessKeyId: !!accessKeyId,
    accessKeyIdLength: accessKeyId?.length || 0,
    hasSecretKey: !!secretKey,
    hasBucketName: !!bucketName,
    bucketName: bucketName || null,
    hasPublicUrl: !!publicUrl,
    publicUrl: publicUrl || null,
    isR2Configured: isR2Configured(),
    testUploadResult: null as any,
  };

  if (diagnostics.isR2Configured) {
    try {
      const testBuffer = Buffer.from('r2-healthcheck-ping');
      const testKey = `healthcheck/ping-${Date.now()}.txt`;
      const url = await uploadBufferToR2(testBuffer, testKey, 'text/plain');
      diagnostics.testUploadResult = { success: true, url };
      try {
        await deleteFromR2(testKey);
      } catch {}
    } catch (err: any) {
      diagnostics.testUploadResult = { success: false, error: err?.message || String(err) };
    }
  }

  return successResponse(diagnostics);
}
