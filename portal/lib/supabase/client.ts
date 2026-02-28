import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build/prerender without env vars, use placeholders.
  // The client is only used in the browser after hydration.
  return createBrowserClient(
    url || 'http://localhost:54321',
    key || 'placeholder'
  );
}
