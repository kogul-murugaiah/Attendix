'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            const { user } = data;
            if (!user) {
                toast.error('Login successful, but user data not found. Please try again.')
                await supabase.auth.signOut()
                return
            }

            // Check staff role
            console.log('Auth User ID:', user.id)

            // Fetch as list to debug count (single() can error if 0 or >1)
            const { data: staffList, error: staffError } = await supabase
                .from('staff')
                .select('*')
                .eq('user_id', user.id)

            if (staffError) {
                console.error('Staff Query Error Object:', staffError)
                console.error('Staff Query Error JSON:', JSON.stringify(staffError, null, 2))
                toast.error(`Database error: ${staffError.message || 'Unknown'}`)
                await supabase.auth.signOut()
                return
            }

            console.log('Staff Records Found:', staffList?.length)

            if (!staffList || staffList.length === 0) {
                console.error('No staff record found for user_id:', user.id)
                console.warn('Please verify this UUID exists in the staff table.')
                toast.error('Staff record not found. Please contact admin.')
                await supabase.auth.signOut()
                return
            }

            // Take the first matching record
            const staffData = staffList[0]

            toast.success('Login successful')

            // Redirect based on role
            switch (staffData.role) {
                case 'gate_volunteer':
                    router.push('/reception')
                    break
                case 'event_manager':
                    router.push('/event-scanner')
                    break
                case 'admin':
                    router.push('/admin')
                    break
                default:
                    router.push('/')
            }

        } catch (err) {
            toast.error('An unexpected error occurred')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex items-center justify-center p-4 font-sans selection:bg-purple-500/30 selection:text-white">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Grid Overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none"></div>

            <Card className="w-full max-w-md bg-[#13131a]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
                <CardHeader className="space-y-1 text-center pb-8 pt-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Staff Portal</CardTitle>
                    <CardDescription className="text-gray-400">Enter your credentials to access the system.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 px-8">
                        <div className="space-y-2 group">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="staff@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-black/50 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 bg-black/50 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full h-11 font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-900/20 rounded-xl transition-all hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Access Dashboard'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
