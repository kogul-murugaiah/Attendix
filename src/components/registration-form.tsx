'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import QRCode from 'qrcode'
import { Event } from "@/lib/types"

export default function RegistrationForm() {
    const [loading, setLoading] = useState(false)
    const [events, setEvents] = useState<Event[]>([])

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        department: '',
        year_of_study: '',
        event1_id: '',
        event2_id: '',
        event3_id: '',
    })

    // Success State
    const [successData, setSuccessData] = useState<{
        participantCode: string;
        qrImage: string;
    } | null>(null)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_name')

        if (error) {
            console.error('Error fetching events:', error)
            toast.error('Failed to load events')
        } else {
            setEvents(data || [])
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const generateParticipantCode = async () => {
        // Generate code: SYM2024-XXXX (Random for now since we can't easily rely on DB sequence in client without RPC/Edge Function being perfect. 
        // Ideally use Supabase RPC `generate_participant_code`.
        // I will try to use the RPC if it exists, or fall back to client side generation for demo.)
        const { data, error } = await supabase.rpc('generate_participant_code')
        if (error || !data) {
            // Fallback
            const random = Math.floor(1000 + Math.random() * 9000)
            return `SYM2024-${random}`
        }
        return data
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validation
        if (!formData.event1_id || !formData.event2_id || !formData.event3_id) {
            toast.error('Please select 3 events')
            setLoading(false)
            return
        }

        // Check duplicates
        if (
            formData.event1_id === formData.event2_id ||
            formData.event1_id === formData.event3_id ||
            formData.event2_id === formData.event3_id
        ) {
            toast.error('Please select 3 different events')
            setLoading(false)
            return
        }

        try {
            const code = await generateParticipantCode()

            // Generate QR
            const qrDataUrl = await QRCode.toDataURL(code, { width: 300, margin: 2 })

            // Insert
            const { data, error } = await supabase
                .from('participants')
                .insert({
                    participant_code: code,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    college: formData.college,
                    department: formData.department,
                    year_of_study: formData.year_of_study,
                    qr_code_data: code, // Storing code as data, or I could store dataUrl if needed. Schema says "qr_code_data TEXT". Prompt says "stores the participant_code".
                    event1_id: formData.event1_id,
                    event2_id: formData.event2_id,
                    event3_id: formData.event3_id,
                })

            if (error) {
                throw error
            }

            // Success
            setSuccessData({
                participantCode: code,
                qrImage: qrDataUrl
            })
            toast.success('Registration successful!')

            // Trigger Email
            try {
                const event1Name = events.find(e => e.id === formData.event1_id)?.event_name || 'N/A';
                const event2Name = events.find(e => e.id === formData.event2_id)?.event_name || 'N/A';
                const event3Name = events.find(e => e.id === formData.event3_id)?.event_name || 'N/A';

                await fetch('/api/send-email', {
                    method: 'POST',
                    body: JSON.stringify({
                        to: formData.email,
                        subject: 'Registration Confirmed - Symposium 2024',
                        html: `
                <h1>Registration Confirmed</h1>
                <p>Hi ${formData.name},</p>
                <p>Your participant code is: <strong>${code}</strong></p>
                <p>Events registered: ${event1Name}, ${event2Name}, ${event3Name}</p>
                <p>Please present the attached QR code at the entrance.</p>
              `,
                        attachments: [
                            {
                                filename: 'qr-code.png',
                                content: qrDataUrl.split(',')[1], // remove data:image/png;base64,
                                content_type: 'image/png'
                            }
                        ]
                    })
                })
            } catch (emailErr) {
                console.error('Email failed', emailErr)
                toast.error('Registration successful but email failed to send')
            }

        } catch (error: any) {
            console.error('Registration Error:', error)
            console.error('Error Details:', JSON.stringify(error, null, 2))
            toast.error(error.message || error.error_description || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    if (successData) {
        return (
            <Card className="bg-[#13131a]/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none"></div>
                <CardHeader>
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <CardTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">Registration Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6 relative z-10">
                    <p className="text-lg text-gray-300">Welcome, <span className="text-white font-semibold">{formData.name}</span></p>
                    <div className="relative p-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-lg">
                        <div className="bg-white p-4 rounded-lg">
                            <img src={successData.qrImage} alt="QR Code" className="w-64 h-64 mix-blend-multiply" />
                        </div>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Participant Code</p>
                        <p className="font-mono text-3xl font-bold text-white tracking-wider text-shadow-glow">{successData.participantCode}</p>
                    </div>
                    <p className="text-center text-gray-400 text-sm max-w-xs">
                        Show this QR code at the entrance.<br />
                        A copy has been sent to <span className="text-green-400">{formData.email}</span>.
                    </p>
                </CardContent>
                <CardFooter className="flex gap-4 relative z-10">
                    <Button onClick={() => window.location.reload()} className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm rounded-xl h-12 transition-all">
                        Register Another
                    </Button>
                    <Button onClick={() => {
                        // Download logic
                        const link = document.createElement('a');
                        link.href = successData.qrImage;
                        link.download = `QR-${successData.participantCode}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20 rounded-xl h-12 transition-all hover:scale-105">
                        Download QR
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="bg-[#13131a]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5 pb-8 pt-8">
                <CardTitle className="text-3xl font-bold text-white flex items-center justify-between">
                    <span>Participant Details</span>
                    <span className="text-sm font-normal text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5 font-mono">STEP 1/2</span>
                </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-8 p-8">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white placeholder:text-gray-600"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                                className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white placeholder:text-gray-600"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                required
                                value={formData.phone}
                                onChange={e => handleChange('phone', e.target.value)}
                                className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white placeholder:text-gray-600"
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="college" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                College / Institution
                            </Label>
                            <Input
                                id="college"
                                required
                                value={formData.college}
                                onChange={e => handleChange('college', e.target.value)}
                                className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white placeholder:text-gray-600"
                                placeholder="University Name"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="department" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                Department
                            </Label>
                            <Input
                                id="department"
                                required
                                value={formData.department}
                                onChange={e => handleChange('department', e.target.value)}
                                className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white placeholder:text-gray-600"
                                placeholder="Computer Science"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="year" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">
                                Year of Study
                            </Label>
                            <Select onValueChange={v => handleChange('year_of_study', v)}>
                                <SelectTrigger className="h-12 bg-black/50 border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all font-medium text-white">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#13131a] border-white/10 text-white">
                                    <SelectItem value="1">1st Year</SelectItem>
                                    <SelectItem value="2">2nd Year</SelectItem>
                                    <SelectItem value="3">3rd Year</SelectItem>
                                    <SelectItem value="4">4th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#13131a] px-4 text-gray-500 font-bold tracking-widest border border-white/5 rounded-full py-1">
                                Event Selection
                            </span>
                        </div>
                    </div>

                    {/* Event Selection */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map((num, i) => (
                                <div key={`event${num}`} className="space-y-2 p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group">
                                    <Label className="text-sm font-semibold flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-400 text-xs font-bold border border-white/10 group-hover:border-cyan-500/50 shadow-inner">
                                            {num}
                                        </span>
                                        Select Event Preference {num}
                                    </Label>
                                    <Select onValueChange={v => handleChange(`event${num}_id`, v)}>
                                        <SelectTrigger className="h-12 bg-black/50 border-white/10 text-white focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl mt-2">
                                            <SelectValue placeholder="Choose an interesting event..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#13131a] border-white/10 text-white max-h-[300px]">
                                            {events.length === 0 && <SelectItem value="dummy" disabled>No events available</SelectItem>}
                                            {events.map(event => (
                                                <SelectItem key={event.id} value={event.id} className="focus:bg-purple-500/20 focus:text-white cursor-pointer">{event.event_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="bg-white/5 p-8 border-t border-white/5">
                    <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-xl shadow-purple-900/20 rounded-xl hover:scale-[1.01] hover:shadow-cyan-500/20 transition-all duration-300"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                PROCESSING REGISTRATION...
                            </span>
                        ) : 'CONFIRM REGISTRATION & GET QR'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
