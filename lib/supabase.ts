import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars no configuradas. Modo solo-CSV activo.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);
