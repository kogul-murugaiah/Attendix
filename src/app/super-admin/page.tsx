
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgTable } from "@/components/super-admin/OrgTable"
import { UserMenu } from '@/components/super-admin/UserMenu'
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

    // Get total platform users (organization admins + staff)
    const { count: adminCount } = await supabase
        .from('organization_admins')
        .select('*', { count: 'exact', head: true })

    const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })

    const totalUsers = (adminCount || 0) + (staffCount || 0)

    const { data: organizations } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-10 h-10">
                            <Image
                                src="/logo.png"
                                alt="Attendix"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                            Attendix
                        </span>
                        <div className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                            Super Admin
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400 max-w-lg">
                        Manage organizations, subscriptions, and monitor system health from a single control center.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-white">{user.email}</p>
                        <p className="text-xs text-emerald-400">● System Online</p>
                    </div>
                    <UserMenu />
                </div>
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
                        <div className="text-2xl font-bold text-white">{totalUsers}</div>
                        <p className="text-xs text-gray-500">Admins + Staff members</p>
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
