import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('village_patients').select('id, name, avatar_url').limit(1)
  if (error) {
    console.error("Error fetching patients:", error)
  } else {
    console.log("Patients:", data)
    if (data[0] && data[0].avatar_url) {
      console.log("Avatar URL length:", data[0].avatar_url.length)
      console.log("Starts with:", data[0].avatar_url.substring(0, 50))
    }
  }
}
test()