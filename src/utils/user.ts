import { createClient } from '@supabase/supabase-js';

// Inisialisasi klien Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Pastikan kredensial tersedia
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing!');
}

// Buat klien Supabase
const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

/**
 * Mendapatkan data user dari token
 * @param token Token autentikasi user
 * @returns Data user yang valid atau error jika tidak ditemukan
 */
export async function getUserFromToken(token: string) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new Error(`User not found: ${error.message}`);
    }
    
    return data.user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    throw error;
  }
}

/**
 * Mendapatkan semua proyek milik user
 * @param userId ID user
 * @returns Array proyek milik user
 */
export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      throw new Error(`Failed to fetch user projects: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user projects:', error);
    throw error;
  }
}

/**
 * Mendapatkan aktivitas terbaru user
 * @param userId ID user
 * @param limit Jumlah maksimum aktivitas yang diambil (default: 10)
 * @returns Array aktivitas terbaru
 */
export async function getUserRecentActivities(userId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw new Error(`Failed to fetch user activities: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
}