import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = supabaseReady
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : createClient('https://placeholder.supabase.co', 'placeholder');

if (!supabaseReady) {
    console.warn('Supabase env vars no configuradas. Modo solo-CSV activo.');
}
