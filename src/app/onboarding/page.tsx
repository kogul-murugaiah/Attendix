'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const formSchema = z.object({
    org_name: z.string().min(3, 'Organization name must be at least 3 characters'),
    code_prefix: z.string().min(2, 'Prefix must be at least 2 characters').max(10, 'Prefix too long').regex(/^[A-Z0-9]+$/, 'only uppercase letters and numbers').optional().or(z.literal('')),
    org_type: z.enum(['college', 'corporate', 'conference', 'club']),
    institution_name: z.string().optional(),
    contact_phone: z.string().min(10, 'Phone number needed'),
});

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            org_type: 'college',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            const res = await fetch('/api/organizations/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create organization');
            }

            toast.success('Organization created successfully!');
            router.push(`/${data.org_code}/admin/dashboard`);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
            {/* Subtle Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-purple-900/10 to-transparent"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Header Section */}
                    <div className="text-center mb-6 space-y-3">
                        <div className="flex items-center justify-center gap-0 mb-4">
                            <div className="relative w-32 h-32">
                                <Image
                                    src="/logo.png"
                                    alt="Attendix"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 pb-1 -ml-6">
                                Attendix
                            </h1>
                        </div>
                    </div>

                    {/* Form Card with Glassmorphism */}
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        {/* Main Card */}
                        <Card className="relative bg-[#13131a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                            <CardHeader className="p-6 pb-2 border-b border-white/5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl font-semibold mb-2">
                                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-cyan-200">
                                                Create Your Organisation
                                            </span>
                                        </CardTitle>
                                        <CardDescription className="text-gray-400 text-sm">
                                            Configure your workspace for event management
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-6">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Organization Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="org_name" className="text-gray-300 text-sm font-medium">
                                            Organization Name <span className="text-red-400">*</span>
                                        </Label>
                                        <Input
                                            id="org_name"
                                            placeholder="e.g., Tech Club, Annual Symposium"
                                            {...form.register('org_name')}
                                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-11"
                                        />
                                        {form.formState.errors.org_name && (
                                            <p className="text-sm text-red-400">
                                                {form.formState.errors.org_name.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Code Prefix */}
                                    <div className="space-y-2">
                                        <Label htmlFor="code_prefix" className="text-gray-300 text-sm font-medium">
                                            Code Prefix
                                        </Label>
                                        <Input
                                            id="code_prefix"
                                            placeholder="e.g., XPLOITS"
                                            {...form.register('code_prefix')}
                                            style={{ textTransform: 'uppercase' }}
                                            maxLength={8}
                                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-11 font-mono"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Used for participant IDs (e.g., XPLOITS-001)
                                        </p>
                                    </div>

                                    {/* Grid for Type and Institution */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Organization Type */}
                                        <div className="space-y-2">
                                            <Label htmlFor="org_type" className="text-gray-300 text-sm font-medium">
                                                Type <span className="text-red-400">*</span>
                                            </Label>
                                            <Select
                                                onValueChange={(val) => form.setValue('org_type', val as any)}
                                                defaultValue={form.getValues('org_type')}
                                            >
                                                <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-lg focus:border-purple-500/50 focus:ring-purple-500/20 h-11">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#13131a] border-white/10 text-white rounded-lg">
                                                    <SelectItem value="college" className="focus:bg-white/10">College</SelectItem>
                                                    <SelectItem value="corporate" className="focus:bg-white/10">Corporate</SelectItem>
                                                    <SelectItem value="conference" className="focus:bg-white/10">Conference</SelectItem>
                                                    <SelectItem value="club" className="focus:bg-white/10">Club</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Contact Phone */}
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_phone" className="text-gray-300 text-sm font-medium">
                                                Contact Phone <span className="text-red-400">*</span>
                                            </Label>
                                            <Input
                                                id="contact_phone"
                                                placeholder="+91 98765 43210"
                                                {...form.register('contact_phone')}
                                                className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-11"
                                            />
                                            {form.formState.errors.contact_phone && (
                                                <p className="text-sm text-red-400">
                                                    {form.formState.errors.contact_phone.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Institution Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="institution_name" className="text-gray-300 text-sm font-medium">
                                            Institution Name <span className="text-gray-500">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="institution_name"
                                            placeholder="University or Company Name"
                                            {...form.register('institution_name')}
                                            className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 rounded-lg focus:border-purple-500/50 focus:ring-purple-500/20 transition-all h-11"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all duration-300 hover:scale-[1.02] mt-8"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Creating Organization...
                                            </span>
                                        ) : (
                                            'Get Started'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-sm mt-6 pb-8">
                        By creating an organization, you agree to our Terms of Service
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
