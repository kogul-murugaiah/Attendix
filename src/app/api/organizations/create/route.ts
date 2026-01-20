import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // 1. Authenticate User (Standard Client)
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { org_name, org_type, contact_phone, institution_name, code_prefix } = body;

        // Generate Org Slug from Name
        let org_code = org_name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Ensure uniqueness (simple check, ideally a loop)
        const { data: existing } = await supabase
            .from('organizations')
            .select('org_code')
            .eq('org_code', org_code)
            .single();

        if (existing) {
            org_code = `${org_code}-${Math.floor(Math.random() * 1000)}`;
        }

        // Get Free Plan
        const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('plan_code', 'free')
            .single();

        if (!freePlan) {
            return NextResponse.json({ error: 'Default plan not found' }, { status: 500 });
        }

        // 2. Initialize Service Role Client (for Admin operations)
        // We use this to Bypass RLS for 'organizations' INSERT if the policy is missing or strict
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Create Organization (Using Admin Client to bypass RLS)
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                org_code,
                org_name,
                org_type,
                institution_name,
                code_prefix: code_prefix || null, // Save the Code Prefix
                contact_email: session.user.email,
                contact_phone,
                subscription_plan: 'free',
                subscription_status: 'trial',
                max_events: freePlan.max_events,
                max_participants_per_event: freePlan.max_participants_per_event,
                max_staff: freePlan.max_staff,
                features: freePlan.features,
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (orgError) throw orgError;

        // Create Org Admin (Owner)
        // We can use Admin client here too to be safe, or user client if policy allows.
        // Using Admin client ensures it works even if triggers/RLS are tricky.
        const { error: adminError } = await supabaseAdmin
            .from('organization_admins')
            .insert({
                user_id: session.user.id,
                organization_id: org.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin',
                email: session.user.email!,
                role: 'org_owner',
                is_primary: true
            });

        if (adminError) throw adminError;

        return NextResponse.json({ success: true, org_code, id: org.id });

    } catch (error: any) {
        console.error('Error creating organization:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

