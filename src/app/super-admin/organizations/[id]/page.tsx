
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { OrgDetailsForm } from '@/components/super-admin/OrgDetailsForm'
import { createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'

export default async function OrgDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params


    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify super admin
    const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!superAdmin) {
        redirect('/')
    }

    // Fetch org details
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

    if (orgError) {
        console.error('Error fetching org:', orgError)
    }

    if (!org) {
        return (
            <div className="p-8 text-white">
                <h1 className="text-xl font-bold text-red-500">Organization not found</h1>
                <p className="text-gray-400">ID: {id}</p>
                <p className="text-gray-400">Error: {orgError?.message}</p>
                <p className="text-gray-400">Details: {orgError?.details}</p>
            </div>
        )
    }

    // Fetch primary admin for this organization
    const { data: primaryAdmin } = await supabase
        .from('organization_admins')
        .select('id, user_id, name, email')
        .eq('organization_id', id)
        .eq('is_primary', true)
        .single()

    async function updateOrg(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const plan = formData.get('plan') as string
        const status = formData.get('status') as string
        const maxEvents = formData.get('max_events')
        const maxParticipants = formData.get('max_participants')
        const maxStaff = formData.get('max_staff')
        const contactPerson = formData.get('contact_person') as string
        const contactEmail = formData.get('contact_email') as string
        const billingEmail = formData.get('billing_email') as string
        const codePrefix = formData.get('code_prefix') as string
        const orgCode = formData.get('org_code') as string

        await supabase
            .from('organizations')
            .update({
                subscription_plan: plan,
                subscription_status: status,
                max_events: maxEvents ? parseInt(maxEvents as string) : org.max_events,
                max_participants_per_event: maxParticipants ? parseInt(maxParticipants as string) : org.max_participants_per_event,
                max_staff: maxStaff ? parseInt(maxStaff as string) : org.max_staff,
                contact_person: contactPerson,
                contact_email: contactEmail,
                billing_email: billingEmail,
                code_prefix: codePrefix,
                org_code: orgCode,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        revalidatePath(`/super-admin/organizations/${id}`)
        revalidatePath('/super-admin')
    }

    async function updateAdminEmail(formData: FormData) {
        'use server'
        const newEmail = formData.get('admin_email') as string
        const adminUserId = formData.get('admin_user_id') as string

        if (!newEmail || !adminUserId) {
            throw new Error('Missing required fields')
        }

        const adminClient = createAdminClient()

        // Update email in auth.users
        const { error: authError } = await adminClient.auth.admin.updateUserById(
            adminUserId,
            { email: newEmail }
        )

        if (authError) {
            console.error('Failed to update auth email:', authError)
            throw authError
        }

        // Also update email in organization_admins table
        const supabase = await createClient()
        await supabase
            .from('organization_admins')
            .update({ email: newEmail })
            .eq('user_id', adminUserId)

        // Also update email in staff table (admins are synced to staff)
        await supabase
            .from('staff')
            .update({ email: newEmail })
            .eq('user_id', adminUserId)

        revalidatePath(`/super-admin/organizations/${id}`)
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8 space-y-8 flex items-center justify-center">
            <div className="w-full max-w-4xl space-y-8">
                <div className="flex items-center space-x-4">
                    <Link href="/super-admin">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{org.org_name}</h1>
                        <p className="text-gray-400 text-sm font-mono">{org.org_code}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-400">
                        {org.id}
                    </Badge>
                </div>

                <OrgDetailsForm
                    org={org}
                    updateOrgAction={updateOrg}
                    primaryAdmin={primaryAdmin}
                    updateAdminEmailAction={updateAdminEmail}
                />
            </div>
        </div>
    )
}
