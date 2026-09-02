import { createSupabaseBrowser } from './supabase-browser';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload a file to Supabase Storage from the browser with strict security validation.
 * Returns the public URL or throws on failure.
 *
 * Bucket: "uploads" (must be public, created in Supabase dashboard)
 * Path:   {folder}/{timestamp}-{random}.{ext}
 */
export async function uploadToSupabase(file: File, folder: string = 'uploads'): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds the 5MB limit');
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.');
  }

  // Sanitize file extension
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'jpg';

  // Sanitize folder to prevent path traversal
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';

  const supabase = createSupabaseBrowser();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `${sanitizedFolder}/${filename}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(storagePath);
  return data.publicUrl;
}
