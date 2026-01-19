'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
    const [participants, setParticipants] = useState<Participant[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchData()

        const channel = supabase
            .channel('admin-attendance-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'participants'
                },
                (payload) => {
                    const updatedParticipant = payload.new as Participant
                    setParticipants((currentParticipants) => {
                        const exists = currentParticipants.find(p => p.id === updatedParticipant.id)
                        if (exists) {
                            return currentParticipants.map(p =>
                                p.id === updatedParticipant.id ? updatedParticipant : p
                            )
                        }
                        return currentParticipants
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: eventsData } = await supabase.from('events').select('*')
        if (eventsData) setEvents(eventsData)

        await fetchParticipants()
        setLoading(false)
    }

    const fetchParticipants = async () => {
        let query = supabase.from('participants').select('*').order('created_at', { ascending: false })
        if (search) {
            query = query.ilike('name', `%${search}%`)
        }
        query = query.limit(50) // Pagination limit

        const { data } = await query
        if (data) setParticipants(data as Participant[])
    }

    const getEventName = (id: string | null | undefined) => {
        if (!id) return undefined
        return events.find(e => e.id === id)?.event_name
    }

    const logAdminAction = async (participantId: string, type: string, status: string, eventId?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get staff ID
        const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()

        if (staff) {
            await supabase.from('scan_logs').insert({
                participant_id: participantId,
                scanned_by: staff.id,
                scan_type: 'admin_override',
                status: status,
                event_id: eventId || null,
                scan_timestamp: new Date().toISOString()
            })
        }
    }

    const toggleReception = async (p: Participant) => {
        const newValue = !p.gate_entry_status
        setProcessingId(p.id + 'reception')

        const { error } = await supabase
            .from('participants')
            .update({
                gate_entry_status: newValue,
                gate_entry_timestamp: newValue ? new Date().toISOString() : null
            })
            .eq('id', p.id)

        if (error) {
            toast.error('Failed to update reception status')
        } else {
            setParticipants(participants.map(part =>
                part.id === p.id ? { ...part, gate_entry_status: newValue } : part
            ))
            toast.success(`Reception status: ${newValue ? 'ENTERED' : 'REMOVED'}`)

            // Log the action
            await logAdminAction(p.id, 'gate_entry', newValue ? 'admin_update' : 'removed')
        }
        setProcessingId(null)
    }

    const toggleEventAttendance = async (p: Participant, eventNum: 1 | 2 | 3) => {
        const eventId = p[`event${eventNum}_id` as keyof Participant] as string
        if (!eventId) return

        const currentStatus = p[`event${eventNum}_attendance` as keyof Participant] as boolean
        const newValue = !currentStatus
        setProcessingId(p.id + `event${eventNum}`)

        const updateData = {
            [`event${eventNum}_attendance`]: newValue,
            [`event${eventNum}_timestamp`]: newValue ? new Date().toISOString() : null
        }

        const { error } = await supabase
            .from('participants')
            .update(updateData)
            .eq('id', p.id)

        if (error) {
            toast.error('Failed to update event attendance')
        } else {
            setParticipants(participants.map(part =>
                part.id === p.id ? { ...part, [`event${eventNum}_attendance`]: newValue } : part
            ))
            toast.success(`Attendance updated for Event ${eventNum}`)

            // Log the action
            await logAdminAction(p.id, 'event_attendance', newValue ? 'admin_update' : 'removed', eventId)
        }
        setProcessingId(null)
    }

    const StatusBadge = ({ active, onClick, loading, label }: any) => (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 w-full justify-between group ${active
                ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</span>
                <span className={`text-xs font-medium ${active ? 'text-green-400' : 'text-gray-400'}`}>
                    {active ? 'Present' : 'Absent'}
                </span>
            </div>
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
                <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
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
                                <TableHead className="text-gray-400 font-medium text-center w-[160px]">Event 1</TableHead>
                                <TableHead className="text-gray-400 font-medium text-center w-[160px]">Event 2</TableHead>
                                <TableHead className="text-gray-400 font-medium text-center w-[160px]">Event 3</TableHead>
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
                                    {[1, 2, 3].map((num) => {
                                        const eventId = p[`event${num}_id` as keyof Participant] as string
                                        const eventName = getEventName(eventId)
                                        const isAttended = p[`event${num}_attendance` as keyof Participant] as boolean

                                        return (
                                            <TableCell key={num} className="p-2">
                                                {eventId ? (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-gray-500 truncate max-w-[140px]" title={eventName}>{eventName}</p>
                                                        <StatusBadge
                                                            label={`Event ${num}`}
                                                            active={isAttended}
                                                            loading={processingId === p.id + `event${num}`}
                                                            onClick={() => toggleEventAttendance(p, num as 1 | 2 | 3)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                                        <span className="text-xs text-gray-500">-</span>
                                                    </div>
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
