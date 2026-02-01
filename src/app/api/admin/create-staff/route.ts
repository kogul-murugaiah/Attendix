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
        const { email, password, name, role, assigned_event_id, organization_id } = body

        if (!organization_id) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Check staff limit before creating
        const { data: org, error: orgFetchError } = await supabaseAdmin
            .from('organizations')
            .select('max_staff, org_name, subscription_plan')
            .eq('id', organization_id)
            .single()

        if (orgFetchError || !org) {
            return NextResponse.json({
                error: 'Organization not found. Please ensure you are logged in to a valid organization.'
            }, { status: 404 })
        }

        const { count: staffCount, error: countError } = await supabaseAdmin
            .from('staff')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organization_id)

        if (countError) {
            return NextResponse.json({ error: 'Failed to verify staff count' }, { status: 500 })
        }

        const maxStaff = org.max_staff ?? 5 // Fallback only if column is null

        if (staffCount !== null && staffCount >= maxStaff) {
            return NextResponse.json({
                error: `Staff limit reached! Your ${org.subscription_plan} plan allows only ${maxStaff} staff members. (Current count: ${staffCount}). Please upgrade your plan.`
            }, { status: 400 })
        }

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

        // 2. Insert Staff Record with Organization ID
        const { error: dbError } = await supabaseAdmin
            .from('staff')
            .insert({
                user_id: authUser.user.id,
                organization_id,
                name,
                email,
                role,
                assigned_event_id: assigned_event_id || null,
                is_active: true
            })

        if (dbError) {
            // Rollback auth user if db fails? Ideally yes, but keeping simple for now.
            // Maybe delete the auth user?
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return NextResponse.json({ error: 'Database insert failed: ' + dbError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: authUser.user })

    } catch (err: any) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
