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
import { Participant } from '@/lib/types'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil } from 'lucide-react'

export default function ParticipantsTab() {
    const [participants, setParticipants] = useState<Participant[]>([])
    const [events, setEvents] = useState<{ id: string, event_name: string }[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        department: '',
        year_of_study: '',
        event1_id: '' as string | null,
        event2_id: '' as string | null,
        event3_id: '' as string | null,
        participant_code: ''
    })

    useEffect(() => {
        fetchParticipants()
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        const { data } = await supabase.from('events').select('id, event_name')
        if (data) setEvents(data)
    }

    const fetchParticipants = async () => {
        setLoading(true)
        let query = supabase.from('participants').select('*').order('created_at', { ascending: false })

        if (search) {
            query = query.ilike('name', `%${search}%`)
        }

        // Limit to 50 for performance in this demo
        query = query.limit(50)

        const { data, error } = await query
        if (!error && data) {
            setParticipants(data as Participant[])
        }
        setLoading(false)
    }

    const handleEditClick = (participant: Participant) => {
        setEditingParticipant(participant)
        setEditFormData({
            name: participant.name,
            email: participant.email,
            phone: participant.phone || '',
            college: participant.college,
            department: participant.department || '',
            year_of_study: participant.year_of_study || '',
            event1_id: participant.event1_id || null,
            event2_id: participant.event2_id || null,
            event3_id: participant.event3_id || null,
            participant_code: participant.participant_code
        })
        setEditOpen(true)
    }

    const handleUpdateParticipant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingParticipant) return

        const { error } = await supabase
            .from('participants')
            .update({
                name: editFormData.name,
                email: editFormData.email,
                phone: editFormData.phone,
                college: editFormData.college,
                department: editFormData.department,
                year_of_study: editFormData.year_of_study,
                event1_id: editFormData.event1_id || null,
                event2_id: editFormData.event2_id || null,
                event3_id: editFormData.event3_id || null
            })
            .eq('id', editingParticipant.id)

        if (error) {
            toast.error('Failed to update participant: ' + error.message)
        } else {
            toast.success('Participant updated successfully')
            setEditOpen(false)
            fetchParticipants()
        }
    }

    const getEventName = (id: string | null | undefined) => {
        if (!id) return null
        return events.find(e => e.id === id)?.event_name || 'Unknown Event'
    }

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
                <Button variant="outline" className="border-white/10 bg-black/50 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl backdrop-blur-md" onClick={() => {
                    // CSV Export Logic
                    const headers = ['Code', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Event 1', 'Event 2', 'Event 3']
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + headers.join(",") + "\n"
                        + participants.map(p => {
                            return [
                                p.participant_code,
                                `"${p.name}"`,
                                p.email,
                                p.phone,
                                `"${p.college}"`,
                                `"${p.department}"`,
                                p.year_of_study,
                                `"${getEventName(p.event1_id) || ''}"`,
                                `"${getEventName(p.event2_id) || ''}"`,
                                `"${getEventName(p.event3_id) || ''}"`
                            ].join(",")
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
                                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.length === 0 && !loading && (
                                <TableRow className="border-white/5">
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">No participants found</TableCell>
                                </TableRow>
                            )}
                            {participants.map((p) => (
                                <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-mono text-xs text-purple-400 group-hover:text-purple-300 transition-colors">{p.participant_code}</TableCell>
                                    <TableCell className="font-medium text-white">
                                        <div className="flex flex-col">
                                            <span>{p.name}</span>
                                            <span className="text-xs text-gray-500">{p.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                        <div className="flex flex-col text-xs">
                                            <span>{p.college}</span>
                                            <span className="text-gray-600">{p.department} • {p.year_of_study}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400 text-xs font-mono">{p.phone}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {[p.event1_id, p.event2_id, p.event3_id].filter(Boolean).map((eid, i) => (
                                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-300 w-fit">
                                                    {getEventName(eid)}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
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
                                {[1, 2, 3].map(num => (
                                    <div key={num} className="space-y-1">
                                        <Label className="text-gray-500 text-xs">Event {num}</Label>
                                        <select
                                            className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 outline-none"
                                            value={editFormData[`event${num}_id` as keyof typeof editFormData] as string || ''}
                                            onChange={e => setEditFormData({ ...editFormData, [`event${num}_id`]: e.target.value || null })}
                                        >
                                            <option value="">-- None --</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id} className="bg-gray-900">{ev.event_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
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
