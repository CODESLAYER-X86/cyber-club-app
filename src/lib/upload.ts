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
 * Compresses an image client-side to WebP format with dimension bounds.
 * Falls back to original file if compression is unsupported or fails.
 */
export async function compressImageToWebp(file: File, maxWidth = 1400, quality = 0.82): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
          const compressed = new File([blob], newName, { type: 'image/webp' });
          resolve(compressed);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
  });
}

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

  // Automatically optimize image to WebP client-side if possible
  let optimizedFile = file;
  try {
    optimizedFile = await compressImageToWebp(file, 1400, 0.82);
  } catch {
    optimizedFile = file;
  }

  // Sanitize file extension
  const rawExt = optimizedFile.name.split('.').pop()?.toLowerCase() || '';
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'webp';

  // Sanitize folder to prevent path traversal
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';

  const supabase = createSupabaseBrowser();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `${sanitizedFolder}/${filename}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(storagePath, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: optimizedFile.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(storagePath);
  return data.publicUrl;
}
