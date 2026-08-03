import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createPublicClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
