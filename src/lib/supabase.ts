import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn only, don't crash to allow build without keys
  console.warn('Missing Supabase Environment Variables')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
