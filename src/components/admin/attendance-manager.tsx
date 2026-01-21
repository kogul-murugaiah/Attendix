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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Participant, Event } from '@/lib/types'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from "sonner"

export default function AttendanceManager() {
    const { organization } = useOrganization()
    // stable instance to prevent subscription drops
    const [supabase] = useState(() => createClient())
    const [participants, setParticipants] = useState<Participant[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        console.log("Admin: AttendanceManager MOUNTED. Org ID:", organization?.id)
        if (!organization?.id) {
            console.log("Admin: No Organization ID yet. Waiting...")
            return
        }

        console.log("Admin: Initializing Subscriptions for Org:", organization.id)
        fetchData()

        const channel = supabase
            .channel('admin-attendance-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'event_registrations', // Listen for event attendance updates
                },
                (payload) => {
                    // We just re-fetch participants to keep it simple and consistent with the join
                    fetchParticipants()
                }
            )
            .subscribe()

        const studentChannel = supabase
            .channel('admin-student-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_registrations',
                    filter: `organization_id=eq.${organization.id}`
                },
                (payload) => {
                    fetchParticipants()
                }
            )
            .subscribe()

        // --- GLOBAL BROADCAST LISTENER (Direct Line) ---
        const globalChannel = supabase
            .channel('app-global')
            .on(
                'broadcast',
                { event: 'new-registration' },
                (payload) => {
                    // Check if this alert is for MY organization
                    if (payload.payload.organization_id === organization.id) {
                        fetchParticipants()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            supabase.removeChannel(studentChannel)
            supabase.removeChannel(globalChannel)
        }
    }, [organization?.id])

    const fetchData = async () => {
        if (!organization?.id) return
        setLoading(true)
        const { data: eventsData } = await supabase.from('events').select('*').eq('organization_id', organization.id)
        if (eventsData) setEvents(eventsData)

        await fetchParticipants()
        setLoading(false)
    }

    const fetchParticipants = async () => {
        if (!organization) return
        let query = supabase.from('student_registrations').select('*, event_registrations(*)').eq('organization_id', organization.id).order('created_at', { ascending: false })
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,participant_code.ilike.%${search}%`)
        }
        query = query.limit(50)

        const { data, error } = await query
        if (data) {
            // Map student_registrations to Participant type locally for UI consistency
            const mappedParticipants: Participant[] = data.map((r: any) => ({
                id: r.id,
                name: r.full_name,
                email: r.email,
                phone: r.phone,
                participant_code: r.participant_code || r.qr_code,
                register_number: r.register_number,
                organization_id: r.organization_id,
                gate_entry_status: r.checked_in,
                gate_entry_timestamp: r.checked_in_at,
                // Map Joined Event Data
                events: r.event_registrations.map((er: any) => ({
                    event_id: er.event_id,
                    attendance_status: er.attendance_status,
                    scanned_at: er.scanned_at
                })),
                created_at: r.created_at,
                custom_data: r.custom_data,
                status: r.status
            }))
            setParticipants(mappedParticipants)
        }
    }

    const getEventName = (id: string) => {
        if (!id) return undefined
        return events.find(e => e.id === id)?.event_name
    }

    const logAdminAction = async (participantId: string, type: string, status: string, eventId?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get staff ID
        const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()

        const orgId = organization?.id
        if (!orgId) return

        await supabase.from('scan_logs').insert({
            organization_id: orgId,
            participant_id: participantId,
            scanned_by: staff?.id || null, // Allow admin override without staff record
            scan_type: 'admin_override',
            status: status,
            event_id: eventId || null,
            scan_timestamp: new Date().toISOString()
        })
    }

    const toggleReception = async (p: Participant) => {
        const newValue = !p.gate_entry_status
        setProcessingId(p.id + 'reception')

        // Update checked_in column
        const { error } = await supabase
            .from('student_registrations')
            .update({
                checked_in: newValue,
                checked_in_at: newValue ? new Date().toISOString() : null
            })
            .eq('id', p.id)

        if (error) {
            toast.error('Failed to update reception status')
        } else {
            setParticipants(participants.map(part =>
                part.id === p.id ? { ...part, gate_entry_status: newValue } : part
            ))
            toast.success(`Reception status: ${newValue ? 'ENTERED' : 'REMOVED'}`)

            await logAdminAction(p.id, 'gate_entry', newValue ? 'admin_update' : 'removed')
        }
        setProcessingId(null)
    }

    const toggleEventAttendance = async (p: Participant, eventId: string) => {
        // Enforce Reception Check-in
        if (!p.gate_entry_status) {
            toast.error("Participant must check in at Reception first!")
            return
        }

        const registration = p.events?.find(e => e.event_id === eventId)

        const currentStatus = registration?.attendance_status || false
        const newValue = !currentStatus
        setProcessingId(p.id + eventId)

        try {
            // 1. Get Staff ID for 'scanned_by'
            const { data: { user } } = await supabase.auth.getUser()
            let staffId = null
            if (user) {
                const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()
                staffId = staff?.id
            }

            // 2. Perform Update/Insert
            let error

            if (!registration) {
                // Insert new registration
                const { error: insertError } = await supabase
                    .from('event_registrations')
                    .insert({
                        participant_id: p.id,
                        event_id: eventId,
                        attendance_status: newValue,
                        scanned_by: staffId // Use correct Foreign Key
                    })
                error = insertError
            } else {
                // Update existing
                const { error: updateError } = await supabase
                    .from('event_registrations')
                    .update({
                        attendance_status: newValue,
                        scanned_at: newValue ? new Date().toISOString() : null,
                        scanned_by: staffId // Use correct Foreign Key
                    })
                    .eq('participant_id', p.id)
                    .eq('event_id', eventId)
                error = updateError
            }

            if (error) throw error

            toast.success(`Attendance updated`)
            fetchParticipants()
            await logAdminAction(p.id, 'event_attendance', newValue ? 'admin_update' : 'removed', eventId)

        } catch (err: any) {
            console.error("Attendance Update Error:", err)
            toast.error(err.message || 'Failed to update event attendance')
        } finally {
            setProcessingId(null)
        }
    }

    const StatusBadge = ({ active, onClick, loading, label, disabled }: any) => (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 w-full justify-between group ${disabled
                ? 'bg-black/20 border-white/5 text-gray-600 cursor-not-allowed grayscale'
                : active
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            <div className="flex flex-col items-start text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</span>
                <span className={`text-xs font-medium ${disabled ? 'text-gray-600' : active ? 'text-green-400' : 'text-gray-400'}`}>
                    {disabled ? 'N/A' : active ? 'Present' : 'Absent'}
                </span>
            </div>
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
                <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${disabled ? 'bg-gray-800 text-gray-600' : active ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                    {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
            )}
        </button>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Input
                        placeholder="Search by name, code..."
                        className="relative bg-black/50 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={fetchParticipants} className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300">
                    Search
                </Button>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20">
                <div className="relative bg-[#13131a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400 font-medium w-[200px]">Participant</TableHead>
                                <TableHead className="text-gray-400 font-medium text-center w-[160px]">Reception</TableHead>
                                {events.map(event => (
                                    <TableHead key={event.id} className="text-gray-400 font-medium text-center min-w-[140px]">
                                        {event.event_name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.map((p) => (
                                <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white">{p.name}</span>
                                            <span className="text-xs text-purple-400 font-mono">{p.participant_code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <StatusBadge
                                            label="Reception"
                                            active={p.gate_entry_status}
                                            loading={processingId === p.id + 'reception'}
                                            onClick={() => toggleReception(p)}
                                        />
                                    </TableCell>
                                    {events.map((event) => {
                                        const registration = p.events?.find(e => e.event_id === event.id)
                                        const isAttended = registration?.attendance_status || false
                                        // If registration exists, we show status.
                                        // If NOT registered, we show 'Not Registered' or allow Add? 
                                        // For now, let's allow marking present implies "Walk-in" registration for that event.

                                        return (
                                            <TableCell key={event.id} className="p-2">
                                                <StatusBadge
                                                    label={event.event_code}
                                                    active={isAttended}
                                                    loading={processingId === p.id + event.id}
                                                    onClick={() => toggleEventAttendance(p, event.id)}
                                                    disabled={!registration}
                                                />
                                                {!registration && (
                                                    <div className="text-[10px] text-center text-gray-600 mt-1 font-medium italic">Not Registered</div>
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
