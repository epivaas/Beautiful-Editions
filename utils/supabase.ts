import { createClient } from "@supabase/supabase-js";

// Haal de omgevingsvariabelen op (ze zijn ingesteld als 'NEXT_PUBLIC_...')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Controleren of de variabelen bestaan (goed voor TypeScript)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local file."
  );
}

// Initialiseer en exporteer de Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);