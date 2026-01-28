'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        }>
            <SignUpForm />
        </Suspense>
    )
}

function SignUpForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next');

    useEffect(() => {
        const checkSession = async () => {
            // ... existing logic (restored)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace(next || '/onboarding');
            }
        }
        checkSession();
    }, [router]);



    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            if (data?.user) {
                toast.success('Account created! Redirecting...');
                // If auto-confirm is on (dev), we can login directly. 
                // If not, they need to check email. 
                // For dev environment usually auto-confirm is enabled or we can just redirect to login/onboarding.

                // Try to sign in immediately to capture session
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!signInError) {
                    router.push(next || '/onboarding');
                } else {
                    router.push(`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`);
                }
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex items-center justify-center p-4 font-sans selection:bg-purple-500/30 selection:text-white">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Grid Overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none"></div>

            <Card className="w-full max-w-md bg-[#13131a]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 opacity-50"></div>
                <CardHeader className="space-y-1 text-center pb-2 pt-4">
                    <div className="flex justify-center mb-2">
                        <div className="relative w-32 h-32">
                            <Image
                                src="/logo.png"
                                alt="Attendix"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
                    <CardDescription className="text-gray-400">Join Attendix to manage your events.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4 px-8">
                        <div className="space-y-2 group">
                            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-black/50 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-cyan-400 transition-colors">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 bg-black/50 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-4 flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full h-11 font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-900/20 rounded-xl transition-all hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                        <div className="text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                                Log in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
