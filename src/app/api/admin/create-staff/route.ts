import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Note: This requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, name, role, assigned_event_id } = body

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto confirm
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        if (!authUser.user) {
            return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
        }

        // 2. Insert Staff Record
        const { error: dbError } = await supabaseAdmin
            .from('staff')
            .insert({
                user_id: authUser.user.id,
                name,
                email,
                role,
                assigned_event_id: assigned_event_id || null
            })

        if (dbError) {
            return NextResponse.json({ error: 'Database insert failed: ' + dbError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: authUser.user })

    } catch (err: any) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
