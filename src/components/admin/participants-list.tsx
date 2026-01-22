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
import { Participant } from '@/lib/types'
import { FormField } from '@/lib/types/registration'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil, FileSpreadsheet, Mail } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import * as XLSX from 'xlsx'

export default function ParticipantsTab() {
    const { organization } = useOrganization()
    // stable instance to prevent subscription drops
    const [supabase] = useState(() => createClient())

    // --- State Definitions (Restored) ---
    const [participants, setParticipants] = useState<Participant[]>([])
    const [events, setEvents] = useState<{ id: string, event_name: string }[]>([])
    const [customFields, setCustomFields] = useState<FormField[]>([])
    const [eventSlots, setEventSlots] = useState<number>(3) // Default to 3, updated dynamically
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        department: '',
        year_of_study: '',
        // Dynamic event IDs will be handled via index access or spread
        participant_code: ''
    })
    // We'll use a dynamic object for events in editFormData now
    const [dynamicEventIds, setDynamicEventIds] = useState<Record<string, string | null>>({})


    // ... (rest of simple states)

    const handleSendTicket = async (participant: Participant) => {
        setSendingEmailId(participant.id)
        try {
            // Get the first event the participant is registered for
            const firstEvent = participant.events?.[0]

            const response = await fetch('/api/send-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: participant.id,
                    email: participant.email,
                    name: participant.full_name || participant.name,
                    eventName: firstEvent?.event_name || 'Event',
                    participantCode: participant.qr_code || participant.participant_code,
                    organizationName: organization?.org_name || 'Attendix',
                    eventDateTime: null, // You can add event date if available
                    venue: null // You can add venue if available
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send ticket')
            }

            toast.success('Ticket sent successfully')
        } catch (error: any) {
            console.error('Error sending ticket:', error)
            toast.error(error.message || 'Failed to send ticket')
        } finally {
            setSendingEmailId(null)
        }
    }




    const fetchEvents = async () => {
        if (!organization) return
        const { data } = await supabase.from('events').select('id, event_name').eq('organization_id', organization.id)
        if (data) setEvents(data)
    }

    const fetchFormFields = async () => {
        if (!organization) return
        // Get the active form for this organization
        const { data: formData } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('organization_id', organization.id)
            .eq('is_active', true)
            .single()

        if (!formData) return

        // Fetch all fields to determine event slots and custom fields
        const { data: fieldsData } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', formData.id)
            .order('display_order')

        if (fieldsData) {
            // 1. Calculate Event Slots
            // Count fields that are potentially event selectors (usually named event_1, event_2 etc or starting with event_)
            const eventFields = (fieldsData as FormField[]).filter(f => f.field_name.startsWith('event_') || f.field_name.includes('event'))
            // If explicit event fields exist, use their count. Otherwise fallback to observed max or default 3.
            // For now, let's assume any field starting with 'event_' is an event selector.
            // Be careful not to count 'events' array if it existed as a field (unlikely).
            // A safer bet might be checking `field_type` if it's a select/radio for events?
            // User's previous code implies fields like 'event_1', 'event_2'.
            const calculatedSlots = eventFields.length
            setEventSlots(calculatedSlots > 0 ? calculatedSlots : 3)

            // 2. Set Custom Fields (for table columns)
            // Filter out core fields AND event fields (since events have their own dedicated column)
            const displayFields = (fieldsData as FormField[]).filter(f => !f.is_core_field && !f.field_name.startsWith('event_'))
            setCustomFields(displayFields)
        }

    }

    const fetchParticipants = async () => {
        if (!organization) {
            console.log('fetchParticipants: No organization')
            return
        }

        console.log('fetchParticipants: Fetching for org', organization.id)

        try {
            setLoading(true)
            // Fetch from student_registrations with event_registrations join
            const { data, error } = await supabase
                .from('student_registrations')
                .select('*, event_registrations(event_id, events(event_name))')
                .eq('organization_id', organization.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching participants:', error)
                toast.error('Failed to load participants: ' + error.message)
            } else {
                console.log('fetchParticipants: Loaded', data?.length, 'participants')
                // Transform data to include event names
                const transformed = (data || []).map((p: any) => ({
                    ...p,
                    events: p.event_registrations?.map((er: any) => ({
                        event_id: er.event_id,
                        event_name: er.events?.event_name || 'Unknown',
                        attendance_status: er.attendance_status || false
                    })) || []
                }))
                setParticipants(transformed)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (participant: Participant) => {
        setEditingParticipant(participant)
        const customData = participant.custom_data || {}

        // Debugging: Console log to see what keys are actually in customData
        console.log('Custom Data for Edit:', customData);

        // Map Keys based on what RegistrationPage saves
        // RegistrationPage likely saves field names: 'event_preference_1', 'event_preference_2' ...
        // OR the field label "Event Preference 1"?
        // The default form (backfill) uses 'field_name': 'event_preference_1'

        const regEvents = participant.events || []

        // Dynamic Event Population
        const currentEventIds: Record<string, string | null> = {}
        for (let i = 1; i <= eventSlots; i++) {
            const index = i - 1
            // Try getting from registered events first (regEvents), then custom fields
            const evtId = regEvents[index]?.event_id ||
                customData[`event_${i}`] ||
                customData[`event_preference_${i}`] ||
                customData[`event${i}_id`] ||
                (participant as any)[`event${i}_id`] ||
                null
            currentEventIds[`event_${i}`] = evtId
        }
        setDynamicEventIds(currentEventIds)

        setEditFormData({
            name: participant.full_name || participant.name || '',
            email: participant.email,
            phone: participant.phone || '',
            college: customData.college_name || customData.college || participant.college || '',
            department: customData.department || participant.department || '',
            year_of_study: customData.year_of_study || participant.year_of_study || '',
            participant_code: participant.participant_code || participant.qr_code || ''
        })
        setEditOpen(true)
    }

    const handleUpdateParticipant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingParticipant) return

        // Prepare custom_data update with dynamic events
        const currentCustomData = editingParticipant.custom_data || {};
        const dynamicEventsUpdates: Record<string, any> = {};

        // Loop through slots to populate custom_data fields
        for (let i = 1; i <= eventSlots; i++) {
            const eid = dynamicEventIds[`event_${i}`];
            dynamicEventsUpdates[`event_${i}`] = eid;
            dynamicEventsUpdates[`event_preference_${i}`] = eid;
        }

        const updatedCustomData = {
            ...currentCustomData,
            college_name: editFormData.college,
            department: editFormData.department,
            year_of_study: editFormData.year_of_study,
            ...dynamicEventsUpdates
        };

        const { error } = await supabase
            .from('student_registrations')
            .update({
                full_name: editFormData.name,
                email: editFormData.email,
                phone: editFormData.phone,
                // Update custom_data with merged fields
                custom_data: updatedCustomData,
                // Update primary event_id (use first selected event as main)
                event_id: dynamicEventIds['event_1'] || null
            })
            .eq('id', editingParticipant.id)

        if (error) {
            toast.error('Failed to update participant: ' + error.message)
        } else {
            // Update event_registrations (Source of Truth for "Events" column)
            // Collect all non-null, non-none IDs from dynamicEventIds
            const newEventIds = Object.values(dynamicEventIds).filter(id => id && id !== 'none') as string[];
            // Ensure uniqueness
            const uniqueEventIds = Array.from(new Set(newEventIds));

            // 1. Delete old registrations
            await supabase.from('event_registrations').delete().eq('participant_id', editingParticipant.id);

            // 2. Insert new ones
            if (uniqueEventIds.length > 0) {
                const eventInserts = uniqueEventIds.map(eid => ({
                    participant_id: editingParticipant.id,
                    event_id: eid,
                    attendance_status: false // Default to false on change
                }));
                await supabase.from('event_registrations').insert(eventInserts);
            }

            toast.success('Participant updated successfully')
            setEditOpen(false)
            fetchParticipants()
        }
    }

    const getEventName = (id: string | null | undefined) => {
        if (!id) return null
        return events.find(e => e.id === id)?.event_name || 'Unknown Event'
    }

    const filteredParticipants = participants.filter(p =>
        (p.full_name || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.participant_code || p.qr_code || '').toLowerCase().includes(search.toLowerCase())
    )

    // Initial Fetch
    useEffect(() => {
        if (organization) {
            console.log('UseEffect triggered. Fetching data for org:', organization.id)
            fetchFormFields()
            fetchEvents()
            fetchParticipants()
        }
    }, [organization])

    // Realtime subscription
    useEffect(() => {
        if (!organization) return

        const channel = supabase
            .channel('table-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_registrations',
                    filter: `organization_id=eq.${organization.id}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload)
                    fetchParticipants()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organization])

    return (
        <div className="space-y-6">


            <div className="flex items-center gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Input
                        placeholder="Search by name..."
                        className="relative bg-black/50 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={fetchParticipants} className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300">
                    Search
                </Button>
                <Button variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-xl backdrop-blur-md" onClick={fetchParticipants} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 rounded-xl backdrop-blur-md" onClick={() => {
                    // Excel Export Logic
                    const baseHeaders = ['Code', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Events']
                    const customHeaders = customFields.map(f => f.field_label)
                    const headers = [...baseHeaders, ...customHeaders]

                    const data = participants.map(p => {
                        const registeredEvents = p.events?.map(re => re.event_name).join('; ') || ''
                        const baseData = [
                            p.participant_code || p.qr_code || '',
                            p.full_name || p.name || '',
                            p.email,
                            p.phone || '',
                            p.custom_data?.college_name || p.college || '',
                            p.custom_data?.department || p.department || '',
                            p.year_of_study || '',
                            registeredEvents
                        ]
                        const customData = customFields.map(f => p.custom_data?.[f.field_name] || '')
                        return [...baseData, ...customData]
                    })

                    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, "Participants")
                    XLSX.writeFile(wb, "Participants.xlsx")
                }}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                </Button>
                <Button variant="outline" className="border-white/10 bg-black/50 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl backdrop-blur-md" onClick={() => {
                    // CSV Export Logic
                    const baseHeaders = ['Code', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Events']
                    const customHeaders = customFields.map(f => f.field_label)
                    const headers = [...baseHeaders, ...customHeaders]
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + headers.join(",") + "\n"
                        + participants.map(p => {
                            const registeredEvents = p.events?.map(re => re.event_name).join('; ') || ''
                            const baseData = [
                                p.participant_code || p.qr_code || '',
                                `"${p.full_name || p.name || ''}"`,
                                p.email,
                                p.phone || '',
                                `"${p.custom_data?.college_name || p.college || ''}"`,
                                `"${p.custom_data?.department || p.department || ''}"`,
                                p.year_of_study || '',
                                `"${registeredEvents}"`
                            ]
                            const customData = customFields.map(f => `"${p.custom_data?.[f.field_name] || ''}"`)
                            return [...baseData, ...customData].join(",")
                        }).join("\n")
                    const encodedUri = encodeURI(csvContent)
                    const link = document.createElement("a")
                    link.setAttribute("href", encodedUri)
                    link.setAttribute("download", "participants.csv")
                    document.body.appendChild(link)
                    link.click()
                }}>
                    Export CSV
                </Button>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20">
                <div className="relative bg-[#13131a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400 font-medium">Code</TableHead>
                                <TableHead className="text-gray-400 font-medium">Name</TableHead>
                                <TableHead className="text-gray-400 font-medium">College / Dept</TableHead>
                                <TableHead className="text-gray-400 font-medium">Phone</TableHead>
                                <TableHead className="text-gray-400 font-medium">Events</TableHead>
                                {/* Dynamic custom field columns */}
                                {customFields.map((field) => (
                                    <TableHead key={field.id} className="text-gray-400 font-medium">{field.field_label}</TableHead>
                                ))}
                                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.length === 0 && !loading && (
                                <TableRow className="border-white/5">
                                    <TableCell colSpan={6 + customFields.length} className="text-center text-gray-500 py-8">No participants found</TableCell>
                                </TableRow>
                            )}
                            {filteredParticipants.map((participant) => (
                                <TableRow key={participant.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-mono text-xs text-purple-400 group-hover:text-purple-300 transition-colors">{participant.qr_code || participant.participant_code || '-'}</TableCell>
                                    <TableCell className="font-medium text-white">
                                        <div className="flex flex-col">
                                            <span>{participant.full_name || participant.name}</span>
                                            <span className="text-xs text-gray-500">{participant.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                        <div className="flex flex-col text-xs">
                                            <span>{participant.custom_data?.college_name || participant.college || '-'}</span>
                                            <span className="text-gray-600">{participant.custom_data?.department || participant.department || '-'} • {participant.year_of_study || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-xs font-mono">{participant.phone || '-'}</TableCell>
                                    <TableCell className="text-gray-400 text-xs">
                                        <div className="flex flex-col gap-1">
                                            {participant.events && participant.events.length > 0 ? (
                                                participant.events.map((re, idx) => (
                                                    <span key={idx}>• {re.event_name}</span>
                                                ))
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {/* Dynamic custom field cells */}
                                    {customFields.map((field) => (
                                        <TableCell key={field.id} className="text-gray-400 text-xs">
                                            {participant.custom_data?.[field.field_name] || '-'}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSendTicket(participant)}
                                                disabled={sendingEmailId === participant.id}
                                                className="text-cyan-400 hover:text-white hover:bg-cyan-500/10 rounded-lg"
                                                title="Send Ticket Email"
                                            >
                                                {sendingEmailId === participant.id ? (
                                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Mail className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(participant)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-[#13131a]/95 backdrop-blur-xl border border-white/10 text-white sm:max-w-[600px] shadow-2xl shadow-purple-900/20 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">Edit Participant</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateParticipant} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Participant Code</Label>
                                <Input disabled value={editFormData.participant_code} className="bg-black/30 border-white/5 text-gray-500 rounded-xl cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Phone</Label>
                                <Input value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Name</Label>
                            <Input required value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Email</Label>
                            <Input required value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">College</Label>
                            <Input required value={editFormData.college} onChange={e => setEditFormData({ ...editFormData, college: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Department</Label>
                                <Input value={editFormData.department} onChange={e => setEditFormData({ ...editFormData, department: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Year</Label>
                                <Input value={editFormData.year_of_study} onChange={e => setEditFormData({ ...editFormData, year_of_study: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-white/5">
                            <Label className="text-cyan-400 text-xs uppercase tracking-wider font-bold">Registered Events</Label>
                            <div className="grid gap-4">
                                {Array.from({ length: eventSlots }, (_, i) => i + 1).map(num => {
                                    // Get IDs of events selected in other slots
                                    const otherSelectedIds = Array.from({ length: eventSlots }, (_, i) => i + 1)
                                        .filter(n => n !== num)
                                        .map(n => dynamicEventIds[`event_${n}`])
                                        .filter(id => id && id !== 'none' && id !== '')

                                    return (
                                        <div key={num} className="space-y-1">
                                            <Label className="text-gray-500 text-xs">Event {num}</Label>
                                            <select
                                                className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 outline-none"
                                                value={dynamicEventIds[`event_${num}`] || ''}
                                                onChange={e => setDynamicEventIds({ ...dynamicEventIds, [`event_${num}`]: e.target.value || null })}
                                            >
                                                <option value="">-- None --</option>
                                                {events.map(ev => {
                                                    const isDisabled = otherSelectedIds.includes(ev.id)
                                                    return (
                                                        <option
                                                            key={ev.id}
                                                            value={ev.id}
                                                            disabled={isDisabled}
                                                            className={isDisabled ? "bg-gray-800 text-gray-500" : "bg-gray-900"}
                                                        >
                                                            {ev.event_name} {isDisabled ? '(Selected)' : ''}
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold mt-4 rounded-xl shadow-lg shadow-purple-900/20">
                            Update Participant
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
