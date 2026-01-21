import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase Admin client using the Service Role Key.
 * Use this ONLY for administrative operations that require bypassing RLS,
 * such as updating user emails in auth.users.
 * 
 * This should NEVER be exposed to the client.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
