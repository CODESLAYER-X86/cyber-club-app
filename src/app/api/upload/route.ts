import { NextRequest } from 'next/server';
import { getSupabaseUser } from '@/lib/supabase-server';
import { errorResponse, serverErrorResponse, successResponse, unauthorizedResponse } from '@/lib/api-utils';
import { isR2Configured, uploadBufferToR2 } from '@/lib/r2';

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
