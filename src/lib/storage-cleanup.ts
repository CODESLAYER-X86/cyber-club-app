import { unlink } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { deleteFromR2 } from './r2';

/**
 * Automatically purges an image file from storage (Cloudflare R2, Supabase Storage, or local disk)
 * when its database record is deleted.
 */
export async function deleteMediaFromStorage(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  const trimmed = imageUrl.trim();
  if (!trimmed) return;

  try {
    // 1. Cloudflare R2 check
    const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '');
    if ((r2PublicUrl && trimmed.startsWith(r2PublicUrl)) || trimmed.includes('.r2.dev')) {
      await deleteFromR2(trimmed);
      return;
    }

    // 2. Supabase Storage check
    if (trimmed.includes('/storage/v1/object/public/uploads/')) {
      const storagePath = trimmed.split('/uploads/')[1];
      if (storagePath) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.storage.from('uploads').remove([decodeURIComponent(storagePath)]);
        }
      }
      return;
    }

    // 3. Local disk storage fallback
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('//') &&
      !trimmed.includes('\0')
    ) {
      const publicDir = path.resolve(process.cwd(), 'public');
      const filePath = path.resolve(publicDir, trimmed.replace(/^\/+/, ''));
      if (filePath.startsWith(publicDir)) {
        await unlink(filePath);
      }
    }
  } catch (err) {
    console.error('deleteMediaFromStorage error:', err);
  }
}
