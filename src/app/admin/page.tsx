'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import OverviewTab from "@/components/admin/overview"
import ParticipantsTab from "@/components/admin/participants-list"
import EventsManager from "@/components/admin/events-manager"
import StaffManager from "@/components/admin/staff-manager"
import AttendanceManager from "@/components/admin/attendance-manager"
import ScanLogsTab from "@/components/admin/scan-logs"

export default function AdminDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAdmin()
    }, [])

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data: staff } = await supabase
            .from('staff')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!staff || staff.role !== 'admin') {
            router.push('/login') // or 403
            return
        }
        setLoading(false)
    }

    if (loading) return <div className="p-8">Loading Dashboard...</div>

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] text-white selection:bg-purple-500/30 selection:text-white font-sans">
            {/* Animated background gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0a0f]/50 to-[#0a0a0f]"></div>
            </div>

            <div className="relative z-10">
                <Tabs defaultValue="overview" className="flex flex-col min-h-screen">
                    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5 shadow-2xl shadow-purple-900/5">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            {/* Logo */}
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-inner border border-white/20">
                                        A
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Attendix</h1>
                                    <p className="text-xs text-gray-500 font-medium tracking-wider">ADMIN CONSOLE</p>
                                </div>
                            </div>

                            {/* Navigation Tabs - Desktop */}
                            <div className="hidden md:block">
                                <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-full backdrop-blur-lg flex gap-1">
                                    {['overview', 'participants', 'events', 'attendance', 'staff', 'logs'].map((tab) => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="rounded-full px-6 py-2 text-sm font-medium text-gray-400 transition-all duration-300 
                                            data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 
                                            data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.5)]
                                            hover:text-white hover:bg-white/5"
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {/* Logout */}
                            <Button
                                variant="ghost"
                                className="rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300"
                                onClick={() => {
                                    supabase.auth.signOut()
                                    router.push('/login')
                                }}
                            >
                                Logout
                            </Button>
                        </div>
                        {/* Mobile Tabs */}
                        <div className="md:hidden px-4 pb-4 overflow-x-auto scrollbar-hide">
                            <TabsList className="bg-white/5 border border-white/5 p-1 rounded-full backdrop-blur-lg inline-flex w-full min-w-max">
                                {['overview', 'participants', 'events', 'attendance', 'staff', 'logs'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="rounded-full px-4 py-2 text-xs font-medium text-gray-400 transition-all 
                                            data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 
                                            data-[state=active]:text-white"
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-20 flex-1 w-full">
                        <TabsContent value="overview" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <OverviewTab />
                        </TabsContent>
                        <TabsContent value="participants" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                            <ParticipantsTab />
                        </TabsContent>
                        <TabsContent value="events" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <EventsManager />
                        </TabsContent>
                        <TabsContent value="attendance" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-125">
                            <AttendanceManager />
                        </TabsContent>
                        <TabsContent value="staff" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                            <StaffManager />
                        </TabsContent>
                        <TabsContent value="logs" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <ScanLogsTab />
                        </TabsContent>
                    </main>
                </Tabs>
            </div>
        </div>
    )
}
