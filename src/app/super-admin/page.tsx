
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgTable } from "@/components/super-admin/OrgTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, CreditCard, Activity } from "lucide-react"
import Image from "next/image"

export default async function SuperAdminDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Double check super admin status
    const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!superAdmin) {
        redirect('/')
    }

    // Fetch stats
    const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

    const { count: activeOrgs } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active')

    const { data: organizations } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8 space-y-8">
            <div className="space-y-2">
                <div className="flex items-center gap-0 mb-4">
                    <div className="relative w-20 h-20">
                        <Image
                            src="/logo.png"
                            alt="Attendix"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 -ml-5">Attendix</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-200">Super Admin Dashboard</h1>
                <p className="text-gray-400">System overview and management.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Organizations</CardTitle>
                        <Building2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{orgCount || 0}</div>
                        <p className="text-xs text-gray-500">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{activeOrgs || 0}</div>
                        <p className="text-xs text-gray-500">{(orgCount && activeOrgs) ? Math.round((activeOrgs / orgCount) * 100) : 0}% conversion rate</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Platform Users</CardTitle>
                        <Users className="h-4 w-4 text-pink-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">-</div>
                        <p className="text-xs text-gray-500">Total registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">99.9%</div>
                        <p className="text-xs text-gray-500">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Organizations</h2>
                </div>

                <OrgTable organizations={organizations || []} />
            </div>
        </div>
    )
}
