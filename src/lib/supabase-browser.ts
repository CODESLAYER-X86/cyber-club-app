import { createBrowserClient } from '@supabase/ssr';

/** Supabase browser client — used only for Google OAuth sign-in. */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
