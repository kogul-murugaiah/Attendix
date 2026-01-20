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
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Staff, Event } from '@/lib/types'
import { Pencil, Trash2 } from 'lucide-react'

export default function StaffManager() {
    const { organization } = useOrganization()
    const supabase = createClient()
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'gate_volunteer',
        assigned_event_id: ''
    })

    useEffect(() => {
        if (organization) {
            fetchStaff()
            fetchEvents()
        }
    }, [organization])

    const fetchStaff = async () => {
        if (!organization) return
        const { data } = await supabase.from('staff').select('*, events(event_name)').eq('organization_id', organization.id)
        if (data) setStaffList(data as any)
    }

    const fetchEvents = async () => {
        if (!organization) return
        const { data } = await supabase.from('events').select('id, event_name').eq('organization_id', organization.id)
        if (data) setEvents(data as any)
    }

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'gate_volunteer', assigned_event_id: '' })
        setEditingId(null)
    }

    const handleEditClick = (staff: Staff) => {
        setFormData({
            name: staff.name,
            email: staff.email,
            password: '', // Can't edit password directly here usually
            role: staff.role,
            assigned_event_id: staff.assigned_event_id || ''
        })
        setEditingId(staff.id)
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingId) {
                // Update Staff Metadata directly
                const { error } = await supabase.from('staff').update({
                    name: formData.name,
                    role: formData.role,
                    assigned_event_id: formData.assigned_event_id || null
                }).eq('id', editingId)

                if (error) throw error
                toast.success('Staff details updated')
            } else {
                // Create
                const res = await fetch('/api/admin/create-staff', {
                    method: 'POST',
                    body: JSON.stringify({ ...formData, organization_id: organization?.id }),
                    headers: { 'Content-Type': 'application/json' }
                })
                const result = await res.json()
                if (!res.ok) throw new Error(result.error || 'Failed to create staff')
                toast.success('Staff member created successfully')
            }

            setOpen(false)
            resetForm()
            fetchStaff()

        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete staff member "${name}"?`)) return

        setLoading(true)
        const { error } = await supabase.from('staff').delete().eq('id', id)
        setLoading(false)

        if (error) {
            toast.error('Failed to delete staff: ' + error.message)
        } else {
            toast.success('Staff member deleted')
            fetchStaff()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Manage Staff</h3>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val)
                    if (!val) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300">
                            Add Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#13131a]/95 backdrop-blur-xl border border-white/10 text-white sm:max-w-[500px] shadow-2xl shadow-purple-900/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                                {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Name</Label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Email</Label>
                                <Input type="email" required disabled={!!editingId} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </div>
                            {!editingId && (
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Password</Label>
                                    <Input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Role</Label>
                                    <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#13131a] border-white/10 text-white">
                                            <SelectItem value="gate_volunteer">Receptionist</SelectItem>
                                            <SelectItem value="event_manager">Event Manager</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.role === 'event_manager' && (
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-xs uppercase tracking-wider font-medium">Assign Event</Label>
                                        <Select value={formData.assigned_event_id} onValueChange={v => setFormData({ ...formData, assigned_event_id: v })}>
                                            <SelectTrigger className="bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl">
                                                <SelectValue placeholder="Select Event" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#13131a] border-white/10 text-white">
                                                {events.map(e => (
                                                    <SelectItem key={e.id} value={e.id}>{e.event_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold mt-4 rounded-xl shadow-lg shadow-purple-900/20" disabled={loading}>
                                {loading ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Staff')}
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
                                <TableHead className="text-gray-400 font-medium">Name</TableHead>
                                <TableHead className="text-gray-400 font-medium">Email</TableHead>
                                <TableHead className="text-gray-400 font-medium">Role</TableHead>
                                <TableHead className="text-gray-400 font-medium">Assigned Event</TableHead>
                                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffList.map((s: any) => (
                                <TableRow key={s.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium text-white">{s.name}</TableCell>
                                    <TableCell className="text-gray-400">{s.email}</TableCell>
                                    <TableCell className="capitalize">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm 
                                            ${s.role === 'admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                                                s.role === 'event_manager' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                                                    'bg-gray-500/10 text-gray-300 border-gray-500/20'}`}>
                                            {s.role.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-400">{s.events?.event_name || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.name)} className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
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
