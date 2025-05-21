// Tambahkan ini di baris pertama
import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function main() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) throw error
  console.log('Data:', data)
}

main()