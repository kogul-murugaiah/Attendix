'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/context/organization-context'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Need simpler type locally or join
type LogWithDetails = {
    id: string
    scan_type: string
    status: string
    scan_timestamp: string
    scanned_by: string // ID
    participant_code?: string
    staff_name?: string
}

export default function ScanLogsTab() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const [logs, setLogs] = useState<any[]>([])

    useEffect(() => {
        if (!organization) return

        const channel = supabase.channel('logs_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'scan_logs',
                filter: `organization_id=eq.${organization.id}`
            }, (payload) => {
                fetchLogs() // Refresh on new log
            })
            .subscribe()

        fetchLogs()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organization])

    const fetchLogs = async () => {
        if (!organization) return
        const { data, error } = await supabase
            .from('scan_logs')
            .select(`
                *,
                student_registrations (full_name, qr_code),
                staff (name)
            `)
            .eq('organization_id', organization.id)
            .order('scan_timestamp', { ascending: false })
            .limit(50)

        if (!error && data) {
            setLogs(data)
        } else if (error) {
            console.error("Error fetching logs details:", JSON.stringify(error, null, 2))
        }
    }

    const getStaffName = (log: any) => {
        if (!log.staff) return 'Unknown'
        if (Array.isArray(log.staff)) return log.staff[0]?.name || 'Unknown'
        return log.staff.name || 'Unknown'
    }

    const getParticipantName = (log: any) => {
        if (!log.student_registrations) return 'Unknown'
        if (Array.isArray(log.student_registrations)) return log.student_registrations[0]?.full_name || 'Unknown'
        return log.student_registrations.full_name || 'Unknown'
    }

    const getParticipantCode = (log: any) => {
        if (!log.student_registrations) return ''
        if (Array.isArray(log.student_registrations)) return log.student_registrations[0]?.qr_code || ''
        return log.student_registrations.qr_code || ''
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Recent Activity</h3>
            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20">
                <div className="relative bg-[#13131a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400 font-medium">Time</TableHead>
                                <TableHead className="text-gray-400 font-medium">Type</TableHead>
                                <TableHead className="text-gray-400 font-medium">Participant</TableHead>
                                <TableHead className="text-gray-400 font-medium">Staff</TableHead>
                                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="text-gray-400 font-mono text-xs">{new Date(log.scan_timestamp).toLocaleTimeString()}</TableCell>
                                    <TableCell className="capitalize text-white font-medium">{log.scan_type === 'gate_entry' ? 'reception entry' : log.scan_type?.replace('_', ' ')}</TableCell>
                                    <TableCell className="text-gray-300">
                                        <span className="block text-white font-medium group-hover:text-purple-400 transition-colors">{getParticipantName(log)}</span>
                                        <span className="text-xs text-gray-500">{getParticipantCode(log)}</span>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{getStaffName(log)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            log.status === 'success' || log.status === 'admin_update'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                                                : log.status === 'removed' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                        }>
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
