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
import { Participant } from '@/lib/types'
import {
    LogOut,
    Search,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Camera,
    X,
    MapPin,
    Upload
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Html5Qrcode } from 'html5-qrcode'

export default function ReceptionDashboard() {
    const router = useRouter()

    // --- State ---
    const [organization, setOrganization] = useState<{ name: string } | null>(null)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [stats, setStats] = useState({
        registered: 0,
        entered: 0,
        pending: 0
    })
    const [participants, setParticipants] = useState<Participant[]>([])
    const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'entered' | 'pending'>('all')

    // Scanner State
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error', message: string, participant?: Participant } | null>(null)
    const [processing, setProcessing] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [manualCode, setManualCode] = useState('')

    // --- Effects ---
    useEffect(() => {
        checkAuthAndFetch()
    }, [])

    useEffect(() => {
        filterParticipants()
    }, [participants, searchQuery, statusFilter])

    // --- Real-time Subscription ---
    useEffect(() => {
        if (!organizationId) return

        const channel = supabase
            .channel('reception-participants-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'student_registrations',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    // Start simple: For any change, we re-fetch to ensure list is perfectly in sync
                    // This handles New Registrations, Check-ins, Removals, everything.
                    if (organizationId) fetchData(organizationId)
                }

            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organizationId])

    // Separate effect for Global Broadcast (Direct Line)
    useEffect(() => {
        if (!organizationId) return

        const globalChannel = supabase
            .channel('app-global')
            .on(
                'broadcast',
                { event: 'new-registration' },
                (payload) => {
                    if (payload.payload.organization_id === organizationId) {
                        fetchData(organizationId)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(globalChannel)
        }
    }, [organizationId])

    // --- Data Loading ---
    const checkAuthAndFetch = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        // Get Organization ID from Staff or Org Admin
        // Get Organization ID from Staff or Org Admin
        // Try Staff first
        const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).maybeSingle()
        let orgId = staff?.organization_id

        if (!orgId) {
            // Try Organization Admin
            const { data: admin } = await supabase.from('organization_admins').select('organization_id').eq('user_id', user.id).maybeSingle()
            orgId = admin?.organization_id
        }

        if (orgId) {
            setOrganizationId(orgId)
            fetchData(orgId)

            // Fetch Organization details for Branding
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', orgId)
                .single()
            if (orgData) setOrganization(orgData)
        } else {
            toast.error("No linked organization found for this user.")
        }
    }

    const fetchData = async (orgId: string) => {
        const { data: allData, error } = await supabase
            .from('student_registrations')
            .select('*')
            .eq('organization_id', orgId)
            .order('full_name')

        if (error) {
            console.error("Fetch Error:", error)
            toast.error('Failed to fetch participants')
            return
        }

        if (allData) {
            const mapped: Participant[] = allData.map((r: any) => ({
                id: r.id,
                name: r.full_name,
                full_name: r.full_name,
                email: r.email,
                phone: r.phone,
                participant_code: r.qr_code,
                register_number: r.register_number,
                organization_id: r.organization_id,
                gate_entry_status: r.checked_in,
                gate_entry_timestamp: r.checked_in_at,
                college: r.college,
                department: r.department,
                created_at: r.created_at,
                team_name: r.team_name,
                // - [/] Update Admin Form Preview to show team-specific fields when enabled
                events: [] // Default to empty array as reception view doesn't render event specific details yet
            }))
            setParticipants(mapped)
        }
    }

    // Recalculate stats whenever participants list changes
    useEffect(() => {
        if (participants) {
            calculateStats(participants)
        }
    }, [participants])

    const calculateStats = (list: Participant[]) => {
        const entered = list.filter(p => p.gate_entry_status).length
        setStats({
            registered: list.length,
            entered: entered,
            pending: list.length - entered
        })
    }

    // --- Actions ---
    const filterParticipants = () => {
        let filtered = participants
        if (!filtered) return

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.participant_code?.toLowerCase().includes(query) ||
                p.college?.toLowerCase().includes(query) ||
                p.team_name?.toLowerCase().includes(query) ||
                p.phone?.includes(query)
            )
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => {
                return statusFilter === 'entered' ? p.gate_entry_status : !p.gate_entry_status
            })
        }

        setFilteredParticipants(filtered)
    }

    const handleCheckIn = async (participantId: string) => {
        console.log("Reception: Attempting Check-in for", participantId)
        const participant = participants.find(p => p.id === participantId)
        if (!participant) {
            console.error("Reception: Participant not found in local state")
            return
        }

        if (participant.gate_entry_status) {
            console.log("Reception: Already checked in")
            toast.error('Already Checked In')
            return
        }

        setProcessing(true)
        try {
            console.log("Reception: Optimistic update...")
            // Optimistic Update
            setParticipants(prev => prev.map(p =>
                p.id === participantId
                    ? { ...p, gate_entry_status: true, gate_entry_timestamp: new Date().toISOString() }
                    : p
            ))

            console.log("Reception: Sending DB update...")
            const { error } = await supabase
                .from('student_registrations')
                .update({
                    checked_in: true,
                    checked_in_at: new Date().toISOString()
                })
                .eq('id', participantId)

            if (error) {
                console.error("Reception: DB Update Error", error)
                // Revert on error
                if (organizationId) fetchData(organizationId)
                throw error
            }

            console.log("Reception: DB Update Success")

            await logScan(participantId, 'gate_entry', 'success')
            toast.success(`Checked In: ${participant.name}`)

        } catch (err: any) {
            console.error("CheckIn Error:", err)
            toast.error(`Failed: ${err.message || 'Update failed'}`)
            if (organizationId) fetchData(organizationId)
        } finally {
            setProcessing(false)
        }
    }

    const handleScan = async (code: string) => {
        if (processing || !organizationId) return
        setProcessing(true)
        setScanResult(null)

        try {
            const cleanCode = code.trim()

            const { data: userData, error } = await supabase
                .from('student_registrations')
                .select('*')
                .eq('organization_id', organizationId)
                .ilike('qr_code', cleanCode)
                .maybeSingle()

            if (error || !userData) {
                setScanResult({ status: 'error', message: 'Invalid QR Code' })
                return
            }

            // Map manually since we didn't use the common mapper
            const participant: Participant = {
                id: userData.id,
                name: userData.full_name,
                full_name: userData.full_name,
                email: userData.email,
                participant_code: userData.qr_code,
                gate_entry_status: userData.checked_in,
                organization_id: userData.organization_id,
                created_at: userData.created_at,
                team_name: userData.team_name,
                events: []
            }

            if (participant.gate_entry_status) {
                setScanResult({ status: 'error', message: 'Already Checked In', participant })
                await logScan(participant.id, 'gate_entry', 'already_scanned')
                return
            }

            await supabase
                .from('student_registrations')
                .update({
                    checked_in: true,
                    checked_in_at: new Date().toISOString()
                })
                .eq('id', participant.id)

            await logScan(participant.id, 'gate_entry', 'success')

            if (organizationId) fetchData(organizationId)
            setScanResult({ status: 'success', message: 'Access Granted', participant })

        } catch (err) {
            setScanResult({ status: 'error', message: 'System Error' })
        } finally {
            setProcessing(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !organizationId) return

        setProcessing(true)
        try {
            const html5QrCode = new Html5Qrcode("reader-placeholder") // Dummy ID or create instance
            const result = await html5QrCode.scanFile(file, true)
            if (result) {
                await handleScan(result)
            }
        } catch (err) {
            console.error("File Scan Error:", err)
            toast.error("Could not find QR Code in image")
        } finally {
            setProcessing(false)
        }
    }

    const logScan = async (participantId: string, type: string, status: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !organizationId) return

        const { data: staff } = await supabase.from('staff').select('id, assigned_event_id').eq('user_id', user.id).single()

        // Log even if staff is missing (Admin override)
        await supabase.from('scan_logs').insert({
            organization_id: organizationId,
            participant_id: participantId,
            scanned_by: staff?.id || null,
            scan_type: type,
            status: status,
            event_id: staff?.assigned_event_id || null
        })
    }

    const handleUndoCheckIn = async (participantId: string) => {
        const participant = participants.find(p => p.id === participantId)
        if (!participant) return

        if (!participant.gate_entry_status) return

        setProcessing(true)
        try {
            // Optimistic Update
            setParticipants(prev => prev.map(p =>
                p.id === participantId
                    ? { ...p, gate_entry_status: false, gate_entry_timestamp: null }
                    : p
            ))

            const { error } = await supabase
                .from('student_registrations')
                .update({
                    checked_in: false,
                    checked_in_at: null
                })
                .eq('id', participantId)

            if (error) {
                if (organizationId) fetchData(organizationId)
                throw error
            }

            await logScan(participantId, 'gate_entry', 'removed')
            toast.success(`Removed Check-In: ${participant.name}`)

        } catch (err: any) {
            console.error("Undo Error:", err)
            toast.error(`Failed: ${err.message || 'Undo failed'}`)
            if (organizationId) fetchData(organizationId)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-purple-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]"></div>

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
                    <h1 className="text-[15vw] font-black uppercase tracking-tighter -rotate-12 whitespace-nowrap">
                        {organization?.name}
                    </h1>
                </div>
            </div>

            <div className="relative z-10 container mx-auto p-6 space-y-8">

                {/* --- 1. Header --- */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13131a]/60 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
                            R
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Reception Console
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Gate Management</span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Main Entrance</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Registered"
                        value={stats.registered}
                        icon={<Users className="w-5 h-5 text-blue-400" />}
                        subtext="All Participants"
                        color="blue"
                    />
                    <StatCard
                        title="Checked In"
                        value={stats.entered}
                        icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                        subtext={`${((stats.entered / (stats.registered || 1)) * 100).toFixed(1)}% Turnout`}
                        color="green"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.pending}
                        icon={<Clock className="w-5 h-5 text-amber-400" />}
                        subtext="Not yet arrived"
                        color="amber"
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
                                <FilterButton active={statusFilter === 'entered'} onClick={() => setStatusFilter('entered')} label="Entered" />
                                <FilterButton active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} label="Pending" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400">Participant</TableHead>
                                    <TableHead className="text-gray-400">Team</TableHead>
                                    <TableHead className="text-gray-400">Code</TableHead>
                                    <TableHead className="text-gray-400">College</TableHead>
                                    <TableHead className="text-gray-400">Mobile</TableHead>
                                    <TableHead className="text-gray-400">Gate Check</TableHead>
                                    <TableHead className="text-right text-gray-400">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredParticipants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                            No participants found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredParticipants.map((p) => (
                                        <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell>
                                                <div className="font-medium text-white">{p.name}</div>
                                                <div className="text-xs text-gray-500">{p.email}</div>
                                            </TableCell>
                                            <TableCell className="text-cyan-400 font-bold text-xs uppercase tabular-nums">
                                                {p.team_name || '-'}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded w-fit h-fit">
                                                {p.participant_code}
                                            </TableCell>
                                            <TableCell className="text-gray-400">{p.college}</TableCell>
                                            <TableCell className="text-gray-400 text-xs font-mono">{p.phone}</TableCell>
                                            <TableCell>
                                                {p.gate_entry_status ? (
                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Entered
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-gray-700 text-gray-500">
                                                        <Clock className="w-3 h-3 mr-1" /> Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!p.gate_entry_status ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleCheckIn(p.id)}
                                                        disabled={processing}
                                                        className="h-8 bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                                    >
                                                        Check In
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleUndoCheckIn(p.id)}
                                                        disabled={processing}
                                                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

            </div>

            {/* --- 4. QR Scanner Modal --- */}
            {
                showScanner && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#13131a] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>

                            <div className="p-4 flex justify-between items-center border-b border-white/5">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-purple-400" /> Scan Entry QR
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
                                                <p className="font-bold text-lg">{scanResult?.message}</p>
                                                {scanResult?.participant && (
                                                    <div className="text-sm opacity-80 mt-1">
                                                        {scanResult.participant.name} ({scanResult.participant.participant_code})
                                                        {scanResult.participant.team_name && (
                                                            <div className="text-cyan-400 font-bold uppercase text-[10px] mt-0.5">
                                                                Team: {scanResult.participant.team_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div id="reader-placeholder" className="hidden"></div>
                                <div className="space-y-4">
                                    <Button
                                        onClick={() => document.getElementById('qr-upload')?.click()}
                                        variant="outline"
                                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12 flex items-center justify-center gap-2"
                                        disabled={processing}
                                    >
                                        <Upload className="w-4 h-4 text-purple-400" />
                                        <span>Upload QR Image</span>
                                    </Button>
                                    <input
                                        id="qr-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
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
