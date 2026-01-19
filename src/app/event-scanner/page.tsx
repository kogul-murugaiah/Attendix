'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRScanner from '@/components/qr-scanner'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Participant, Event } from '@/lib/types'
import {
    QrCode,
    LogOut,
    Search,
    Users,
    CheckCircle,
    XCircle,
    UserCheck,
    Clock,
    MapPin,
    Calendar,
    Filter,
    Camera,
    X
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function EventScannerPage() {
    const router = useRouter()

    // --- State ---
    const [view, setView] = useState<'dashboard' | 'scanner'>('dashboard')
    const [assignedEvent, setAssignedEvent] = useState<Event | null>(null)
    const [stats, setStats] = useState({
        registered: 0,
        attended: 0,
        pending: 0
    })
    const [participants, setParticipants] = useState<Participant[]>([])
    // Added to prevent stale closure issues in calculateStats initial call
    const [participantsLoaded, setParticipantsLoaded] = useState(false)
    const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all')

    // Scanner State
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error', message: string, participant?: Participant } | null>(null)
    const [processing, setProcessing] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [manualCode, setManualCode] = useState('')


    // --- Effects ---
    useEffect(() => {
        loadEventData()
    }, [])

    useEffect(() => {
        filterParticipants()
    }, [participants, searchQuery, statusFilter])

    // --- Real-time Subscription ---
    // --- Real-time Subscription ---
    useEffect(() => {
        if (!assignedEvent) return

        const channel = supabase
            .channel('event-participants-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'participants'
                },
                (payload) => {
                    const updatedParticipant = payload.new as Participant
                    // Update if the participant is in our list
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
    }, [assignedEvent])


    // --- Data Loading ---
    const loadEventData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data: staff, error } = await supabase
            .from('staff')
            .select('*, events(*)')
            .eq('user_id', user.id)
            .single()

        if (error || !staff || !staff.assigned_event_id) {
            toast.error('No event assigned to your account')
            return
        }

        const eventId = staff.assigned_event_id
        const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single()
        if (eventData) setAssignedEvent(eventData)

        fetchParticipants(eventId)
    }

    const fetchParticipants = async (eventId: string) => {
        // Fetch all participants registered for this event
        const { data: allParticipants } = await supabase
            .from('participants')
            .select('*')
            .or(`event1_id.eq.${eventId},event2_id.eq.${eventId},event3_id.eq.${eventId}`)

        if (allParticipants) {
            setParticipants(allParticipants as Participant[])
            // calculateStats called in useEffect now
        }
    }

    // Recalculate stats whenever participants list changes
    useEffect(() => {
        if (assignedEvent && participants.length > 0) {
            calculateStats(participants, assignedEvent.id)
        }
    }, [participants, assignedEvent])

    const calculateStats = (participantList: Participant[], eventId: string) => {
        let attendedCount = 0
        participantList.forEach(p => {
            if (p.event1_id === eventId && p.event1_attendance) attendedCount++
            else if (p.event2_id === eventId && p.event2_attendance) attendedCount++
            else if (p.event3_id === eventId && p.event3_attendance) attendedCount++
        })

        setStats({
            registered: participantList.length,
            attended: attendedCount,
            pending: participantList.length - attendedCount
        })
    }

    // --- Actions ---
    const filterParticipants = () => {
        let filtered = participants

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.participant_code.toLowerCase().includes(query) ||
                p.college?.toLowerCase().includes(query)
            )
        }

        if (statusFilter !== 'all' && assignedEvent) {
            filtered = filtered.filter(p => {
                const isPresent = checkAttendanceStatus(p, assignedEvent.id)
                return statusFilter === 'present' ? isPresent : !isPresent
            })
        }

        setFilteredParticipants(filtered)
    }

    const checkAttendanceStatus = (p: Participant, eventId: string) => {
        if (p.event1_id === eventId) return p.event1_attendance
        if (p.event2_id === eventId) return p.event2_attendance
        if (p.event3_id === eventId) return p.event3_attendance
        return false
    }

    const handleMarkAttendance = async (participantId: string) => {
        if (!assignedEvent) return
        // Fetch fresh status to ensure we have the latest Gate Check-in info
        const { data: freshParticipant, error: fetchError } = await supabase
            .from('participants')
            .select('*')
            .eq('id', participantId)
            .single()

        if (fetchError || !freshParticipant) {
            toast.error('Failed to verify participant status')
            return
        }

        if (!freshParticipant.gate_entry_status) {
            toast.error('Participant has not checked in at Reception yet.')
            // Update local state to reflect reality if it was wrong
            setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, gate_entry_status: false } : p))
            return
        }

        // Use the fresh participant data for the rest of the logic
        const participant = freshParticipant as Participant


        let attendanceField = ''
        let timestampField = ''
        if (participant.event1_id === assignedEvent.id) {
            attendanceField = 'event1_attendance'
            timestampField = 'event1_timestamp'
        } else if (participant.event2_id === assignedEvent.id) {
            attendanceField = 'event2_attendance'
            timestampField = 'event2_timestamp'
        } else {
            attendanceField = 'event3_attendance'
            timestampField = 'event3_timestamp'
        }

        setProcessing(true)
        try {
            const { error } = await supabase
                .from('participants')
                .update({
                    [attendanceField]: true,
                    [timestampField]: new Date().toISOString()
                })
                .eq('id', participantId)

            if (error) throw error

            await supabase.rpc('increment_event_attendance', { event_id: assignedEvent.id })
            await logScan(participantId, 'success', 'event_attendance') // Fixed scan_type

            toast.success(`Marked Present: ${participant.name}`)
            fetchParticipants(assignedEvent.id) // Refresh data
            setScanResult({ status: 'success', message: 'Marked Present', participant })
        } catch (err) {
            console.error(err)
            toast.error('Failed to update attendance')
        } finally {
            setProcessing(false)
        }
    }

    const handleMarkAbsent = async (participantId: string) => {
        if (!assignedEvent) return
        const participant = participants.find(p => p.id === participantId)
        if (!participant) return

        // REMOVED CONFIRMATION DIALOG AS REQUESTED

        let attendanceField = ''
        let timestampField = ''
        if (participant.event1_id === assignedEvent.id) {
            attendanceField = 'event1_attendance'
            timestampField = 'event1_timestamp'
        } else if (participant.event2_id === assignedEvent.id) {
            attendanceField = 'event2_attendance'
            timestampField = 'event2_timestamp'
        } else {
            attendanceField = 'event3_attendance'
            timestampField = 'event3_timestamp'
        }

        setProcessing(true)
        try {
            const { error } = await supabase
                .from('participants')
                .update({
                    [attendanceField]: false,
                    [timestampField]: null
                })
                .eq('id', participantId)

            if (error) throw error

            // Note: We are not decrementing the events.current_attendance count in DB 
            // because we lack a decrement RPC and direct update might be blocked.
            // The dashboard stats are calculated locally so UI will be correct.

            await logScan(participantId, 'removed', 'manual_remove')

            toast.success(`Marked Absent: ${participant.name}`)
            fetchParticipants(assignedEvent.id) // Refresh data

        } catch (err) {
            console.error(err)
            toast.error('Failed to update attendance')
        } finally {
            setProcessing(false)
        }
    }

    const handleScan = async (code: string) => {
        if (processing || !assignedEvent) return
        setProcessing(true)
        setScanResult(null)

        try {
            const { data: userData, error } = await supabase
                .from('participants')
                .select('*')
                .eq('participant_code', code)
                .single()

            if (error || !userData) {
                setScanResult({ status: 'error', message: 'Invalid QR Code' })
                return
            }

            const participant = userData as Participant

            // Check Registration
            const isRegistered =
                participant.event1_id === assignedEvent.id ||
                participant.event2_id === assignedEvent.id ||
                participant.event3_id === assignedEvent.id

            if (!isRegistered) {
                setScanResult({ status: 'error', message: 'Not Registered for this Event', participant })
                await logScan(participant.id, 'not_eligible')
                return
            }

            // Check Reception Entry
            if (!participant.gate_entry_status) {
                setScanResult({ status: 'error', message: 'Use Reception Gate First', participant })
                await logScan(participant.id, 'entry_not_confirmed')
                return
            }

            // Check if already attended
            if (checkAttendanceStatus(participant, assignedEvent.id)) {
                setScanResult({ status: 'error', message: 'Already Marked Present', participant })
                await logScan(participant.id, 'already_scanned')
                return
            }

            // Mark Attendance
            await handleMarkAttendance(participant.id)

        } catch (err) {
            setScanResult({ status: 'error', message: 'Unexpected Error' })
        } finally {
            setProcessing(false)
        }
    }

    const logScan = async (participantId: string, status: string, type: string = 'event_attendance') => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !assignedEvent) return
        const { data: staff } = await supabase.from('staff').select('id').eq('user_id', user.id).single()
        if (staff) {
            const { error } = await supabase.from('scan_logs').insert({
                participant_id: participantId,
                scanned_by: staff.id,
                scan_type: type,
                event_id: assignedEvent.id,
                status: status
            })
            if (error) console.error("Log Insert Error:", error)
        }
    }


    if (!assignedEvent) return (
        <div className="min-h-screen grid place-items-center bg-[#0a0a0f] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="text-gray-400">Loading Dashboard...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-purple-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 container mx-auto p-6 space-y-8">

                {/* --- 1. Header --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13131a]/60 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
                            {assignedEvent.event_name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {assignedEvent.event_name}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Manager Dashboard</span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {assignedEvent.venue}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowScanner(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 h-12 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            Scan QR
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                supabase.auth.signOut()
                                router.push('/login')
                            }}
                            className="border-white/10 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl h-12"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Logout
                        </Button>
                    </div>
                </header>

                {/* --- 2. Stats Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Registered"
                        value={stats.registered}
                        icon={<Users className="w-5 h-5 text-blue-400" />}
                        subtext={`Cap: ${assignedEvent.max_capacity}`}
                        color="blue"
                    />
                    <StatCard
                        title="Attended"
                        value={stats.attended}
                        icon={<UserCheck className="w-5 h-5 text-green-400" />}
                        subtext={`${((stats.attended / (stats.registered || 1)) * 100).toFixed(1)}% Turnout`}
                        color="green"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.pending}
                        icon={<Clock className="w-5 h-5 text-amber-400" />}
                        subtext="Expected Arrivals"
                        color="amber"
                    />
                    <StatCard
                        title="Event Date"
                        value={new Date(assignedEvent.event_datetime).toLocaleDateString()}
                        icon={<Calendar className="w-5 h-5 text-purple-400" />}
                        subtext={new Date(assignedEvent.event_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        color="purple"
                    />
                </div>

                {/* --- 3. Participants Table Section --- */}
                <div className="bg-[#13131a]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            Participants
                            <Badge variant="secondary" className="ml-2 bg-white/5 text-gray-400 hover:bg-white/10">
                                {filteredParticipants.length}
                            </Badge>
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search name, code..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-black/40 border-white/10 text-white w-full sm:w-[250px] rounded-xl focus:ring-purple-500/50"
                                />
                            </div>
                            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                                <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
                                <FilterButton active={statusFilter === 'present'} onClick={() => setStatusFilter('present')} label="Present" />
                                <FilterButton active={statusFilter === 'absent'} onClick={() => setStatusFilter('absent')} label="Absent" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400">Participant</TableHead>
                                    <TableHead className="text-gray-400">Code</TableHead>
                                    <TableHead className="text-gray-400">College</TableHead>
                                    <TableHead className="text-gray-400">Mobile</TableHead>
                                    <TableHead className="text-gray-400">Status</TableHead>
                                    <TableHead className="text-right text-gray-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredParticipants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No participants found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredParticipants.map((p) => {
                                        const isPresent = checkAttendanceStatus(p, assignedEvent.id)
                                        return (
                                            <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <TableCell>
                                                    <div className="font-medium text-white">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.email}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded w-fit h-fit">
                                                    {p.participant_code}
                                                </TableCell>
                                                <TableCell className="text-gray-400">{p.college}</TableCell>
                                                <TableCell className="text-gray-400 text-xs font-mono">{p.phone}</TableCell>
                                                <TableCell>
                                                    {isPresent ? (
                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Present
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-gray-700 text-gray-500">
                                                            <Clock className="w-3 h-3 mr-1" /> Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!isPresent ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMarkAttendance(p.id)}
                                                            disabled={processing}
                                                            className="h-8 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                                        >
                                                            Mark Present
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleMarkAbsent(p.id)}
                                                            disabled={processing}
                                                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        >
                                                            Undo
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>

            {/* --- 4. QR Scanner Modal --- */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#13131a] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>

                        <div className="p-4 flex justify-between items-center border-b border-white/5">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Camera className="w-5 h-5 text-purple-400" /> Scan QR Code
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowScanner(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-inner bg-black aspect-square mb-6">
                                <QRScanner onScan={handleScan} />
                                {/* Overlay Styling */}
                                <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-48 h-48 border-2 border-purple-500/50 rounded-lg relative">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Scan Result/Status */}
                            {scanResult && (
                                <div className={`p-4 rounded-xl mb-4 border ${scanResult.status === 'success'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        {scanResult.status === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                        <div>
                                            <p className="font-bold text-lg">{scanResult.message}</p>
                                            {scanResult.participant && (
                                                <div className="text-sm opacity-80 mt-1">
                                                    {scanResult.participant.name} ({scanResult.participant.participant_code})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#13131a] px-2 text-gray-500">Or enter manually</span>
                                </div>
                            </div>

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleScan(manualCode); }}
                                className="mt-4 flex gap-2"
                            >
                                <Input
                                    placeholder="Enter Code..."
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                                <Button type="submit" className="bg-white/10 hover:bg-white/20 text-white">Check</Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value, icon, subtext, color }: any) {
    const colorClasses: any = {
        blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-500",
        green: "from-green-500/10 to-transparent border-green-500/20 text-green-500",
        amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-500",
        purple: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-500",
    }

    return (
        <Card className={`bg-[#13131a]/60 backdrop-blur-md border border-white/5 overflow-hidden relative group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-white">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${colorClasses[color].split(' ')[3]}`}>
                        {icon}
                    </div>
                </div>
                <p className="text-xs text-gray-500 font-medium">{subtext}</p>
            </CardContent>
        </Card>
    )
}

function FilterButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${active
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    )
}
