'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface ScanHistoryProps {
    type: 'gate_entry' | 'event_attendance'
    eventId?: string
}

export default function ScanHistory({ type, eventId }: ScanHistoryProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        let query = supabase
            .from('scan_logs')
            .select(`
                *,
                participants (
                    name,
                    participant_code,
                    email
                )
            `)
            .eq('status', 'success')
            .eq('scan_type', type)
            .order('scan_timestamp', { ascending: false })

        if (eventId) {
            query = query.eq('event_id', eventId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching logs:', error)
        } else {
            setLogs(data || [])
        }
        setLoading(false)
    }

    // Refresh on mount
    useEffect(() => {
        if (type === 'event_attendance' && !eventId) return; // Wait for eventId
        fetchLogs()

        // Subscribe to changes
        const channel = supabase
            .channel('scan_logs_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_logs' }, () => {
                fetchLogs()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [type, eventId])

    if (loading && logs.length === 0) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {type === 'gate_entry' ? 'Reception Entries' : 'Event Attendance'}
                    <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Participant</TableHead>
                                <TableHead>Code</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-gray-500">
                                        No scans yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            {format(new Date(log.scan_timestamp), 'HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.participants?.name || 'Unknown'}
                                            <div className="text-xs text-gray-400">{log.participants?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                                                {log.participants?.participant_code}
                                            </code>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
