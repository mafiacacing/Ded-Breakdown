import { createClient } from '@supabase/supabase-js';

// Inisialisasi klien Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Pastikan URL dan API key sudah tersedia
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or API key is missing!');
}

// Buat klien Supabase
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

// Helper function untuk mengakses database dari Drizzle ORM
export async function getSupabaseClient() {
  return supabase;
}