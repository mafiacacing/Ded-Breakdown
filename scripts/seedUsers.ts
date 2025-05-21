import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function seedUsers() {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      [
        { full_name: 'Admin Utama', email: 'admin@amcp.test' },
        { full_name: 'Manajer Proyek 1', email: 'pm1@amcp.test' },
        { full_name: 'Supervisor Lapangan', email: 'spv@amcp.test' },
      ],
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select() // agar hasil tidak null

  if (error) {
    console.error('Upsert error:', error)
  } else {
    console.log('Users upserted:', data)
  }
}

seedUsers()