'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/context/organization-context'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OverviewTab() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const [stats, setStats] = useState({
        totalParticipants: 0,
        gateEntries: 0,
        totalEvents: 0,
    })
    const [eventData, setEventData] = useState<any[]>([])

    useEffect(() => {
        if (organization) {
            fetchStats()
        }
    }, [organization])

    const fetchStats = async () => {
        if (!organization) return

        // Parallel fetch
        const p1 = supabase.from('participants').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id)
        const p2 = supabase.from('participants').select('id', { count: 'exact', head: true }).eq('gate_entry_status', true).eq('organization_id', organization.id)
        const p3 = supabase.from('events').select('*').eq('organization_id', organization.id)

        const [r1, r2, r3] = await Promise.all([p1, p2, p3])

        setStats({
            totalParticipants: r1.count || 0,
            gateEntries: r2.count || 0,
            totalEvents: r3.data?.length || 0
        })

        if (r3.data) {
            setEventData(r3.data.map((e: any) => ({
                name: e.event_name,
                attendance: e.current_attendance
            })))
        }
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Registrations Card */}
                <div className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/50 via-transparent to-cyan-500/50 hover:from-purple-500 hover:to-cyan-500 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-[#13131a]/90 backdrop-blur-xl rounded-2xl p-6 h-full border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-900/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </div>
                        <div className="text-5xl font-bold text-white mb-2 tracking-tight">{stats.totalParticipants}</div>
                        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Registrations</div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-medium">
                            <span className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                +2 today
                            </span>
                        </div>
                    </div>
                </div>

                {/* Gate Entries Card */}
                <div className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-orange-500/50 via-transparent to-pink-500/50 hover:from-orange-500 hover:to-pink-500 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-[#13131a]/90 backdrop-blur-xl rounded-2xl p-6 h-full border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-900/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                        </div>
                        <div className="text-5xl font-bold text-white mb-2 tracking-tight">{stats.gateEntries}</div>
                        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Reception Entries</div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-orange-400 font-medium">
                            <span className="bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                                {stats.totalParticipants > 0 ? ((stats.gateEntries / stats.totalParticipants) * 100).toFixed(1) : 0}% turnout
                            </span>
                        </div>
                    </div>
                </div>

                {/* Active Events Card */}
                <div className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-cyan-500/50 via-transparent to-blue-500/50 hover:from-cyan-500 hover:to-blue-500 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-[#13131a]/90 backdrop-blur-xl rounded-2xl p-6 h-full border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-900/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div className="text-5xl font-bold text-white mb-2 tracking-tight">{stats.totalEvents}</div>
                        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">Active Events</div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400 font-medium">
                            <span className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                                All systems live
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30">
                <div className="relative bg-[#13131a]/90 backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Event Attendance</h2>
                            <p className="text-sm text-gray-400">Real-time stats across all active events</p>
                        </div>
                        <div className="flex gap-2 bg-white/5 rounded-xl p-1 border border-white/5">
                            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-purple-900/20">Today</button>
                            <button className="px-4 py-2 rounded-lg text-gray-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors">Week</button>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dy={10}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    stroke="#6b7280"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(19, 19, 26, 0.9)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                    }}
                                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)', radius: 4 }}
                                />
                                <Bar
                                    dataKey="attendance"
                                    fill="url(#barGradient)"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
