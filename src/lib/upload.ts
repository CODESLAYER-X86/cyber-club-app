import { createSupabaseBrowser } from './supabase-browser';

/**
 * Upload a file to Supabase Storage from the browser.
 * Returns the public URL or throws on failure.
 *
 * Bucket: "uploads" (must be public, created in Supabase dashboard)
 * Path:   {folder}/{timestamp}-{random}.{ext}
 */
export async function uploadToSupabase(file: File, folder: string = 'uploads'): Promise<string> {
  const supabase = createSupabaseBrowser();

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `${folder}/${filename}`;

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
