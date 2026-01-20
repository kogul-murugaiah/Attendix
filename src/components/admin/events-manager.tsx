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
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Event } from '@/lib/types'
import { Pencil, Trash2 } from 'lucide-react'

export default function EventsManager() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        event_name: '',
        event_code: '',
        category: '',
        venue: '',
        event_datetime: '', // datetime-local format
        max_capacity: 0,
        manager_email: '',
        is_registration_open: true
    })

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('events').select('*').order('event_datetime')
        if (data) setEvents(data)
        setLoading(false)
    }

    const resetForm = () => {
        setFormData({
            event_name: '', event_code: '', category: '', venue: '', event_datetime: '', max_capacity: 0, manager_email: '', is_registration_open: true
        })
        setEditingId(null)
    }

    const handleEditClick = (event: Event) => {
        setFormData({
            event_name: event.event_name,
            event_code: event.event_code,
            category: event.category,
            venue: event.venue,
            event_datetime: new Date(event.event_datetime).toISOString().slice(0, 16), // Format for datetime-local
            max_capacity: event.max_capacity || 0,
            manager_email: event.manager_email || '',
            is_registration_open: event.is_registration_open ?? true
        })
        setEditingId(event.id)
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload = {
            event_name: formData.event_name,
            event_code: formData.event_code,
            category: formData.category,
            venue: formData.venue,
            event_datetime: new Date(formData.event_datetime).toISOString(),
            max_capacity: formData.max_capacity,
            manager_email: formData.manager_email,
            is_registration_open: formData.is_registration_open
        }

        let error;

        if (editingId) {
            // Update
            const res = await supabase.from('events').update(payload).eq('id', editingId)
            error = res.error
        } else {
            // Insert
            const res = await supabase.from('events').insert(payload)
            error = res.error
        }

        if (error) {
            toast.error('Failed to save event: ' + error.message)
        } else {
            toast.success(editingId ? 'Event updated!' : 'Event created!')
            setOpen(false)
            resetForm()
            fetchEvents()
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY DELETE event "${name}"?\n\nThis might delete all associated participant records depending on database rules.`)) return

        setLoading(true)
        const { error } = await supabase.from('events').delete().eq('id', id)
        setLoading(false)

        if (error) {
            toast.error('Failed to delete event: ' + error.message)
        } else {
            toast.success('Event deleted successfully')
            fetchEvents()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Manage Events</h3>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val)
                    if (!val) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300">
                            Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#13131a]/95 backdrop-blur-xl border border-white/10 text-white sm:max-w-[500px] shadow-2xl shadow-purple-900/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                                {editingId ? 'Edit Event' : 'Add New Event'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Code</Label>
                                    <Input required value={formData.event_code} onChange={e => setFormData({ ...formData, event_code: e.target.value })} placeholder="CODE01" className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Category</Label>
                                    <Input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Technical" className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Event Name</Label>
                                <Input required value={formData.event_name} onChange={e => setFormData({ ...formData, event_name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Venue</Label>
                                <Input required value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Date & Time</Label>
                                <Input type="datetime-local" required value={formData.event_datetime} onChange={e => setFormData({ ...formData, event_datetime: e.target.value })} className="bg-black/50 border-white/10 text-white [color-scheme:dark] focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Input type="number" value={formData.max_capacity} onChange={e => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="reg_open"
                                    checked={formData.is_registration_open}
                                    onChange={e => setFormData({ ...formData, is_registration_open: e.target.checked })}
                                    className="w-5 h-5 rounded-md border-white/10 bg-black/50 text-purple-600 focus:ring-purple-500/20"
                                />
                                <Label htmlFor="reg_open" className="text-gray-400 text-sm font-medium cursor-pointer select-none">
                                    Registration Open
                                </Label>
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold mt-4 rounded-xl shadow-lg shadow-purple-900/20">
                                {editingId ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20">
                <div className="relative bg-[#13131a]/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400 font-medium">Code</TableHead>
                                <TableHead className="text-gray-400 font-medium">Name</TableHead>
                                <TableHead className="text-gray-400 font-medium">Venue</TableHead>
                                <TableHead className="text-gray-400 font-medium">Time</TableHead>
                                <TableHead className="text-gray-400 font-medium">Attendance</TableHead>
                                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((e) => (
                                <TableRow key={e.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-mono text-xs text-purple-400">{e.event_code}</TableCell>
                                    <TableCell className="font-medium text-white group-hover:text-cyan-400 transition-colors">{e.event_name}</TableCell>
                                    <TableCell className="text-gray-400">{e.venue}</TableCell>
                                    <TableCell className="text-gray-400">{new Date(e.event_datetime).toLocaleString()}</TableCell>
                                    <TableCell className="text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (e.current_attendance / (e.max_capacity || 100)) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-mono text-gray-400">{e.current_attendance}/{e.max_capacity || '∞'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.is_registration_open
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                            {e.is_registration_open ? 'Open' : 'Closed'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(e)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id, e.event_name)} className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
