'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create your Organization</CardTitle>
                    <CardDescription>
                        Set up your organization to start managing events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="org_name">Organization Name</Label>
                            <Input
                                id="org_name"
                                placeholder="Types of Club / Event Name"
                                {...form.register('org_name')}
                            />
                            {form.formState.errors.org_name && (
                                <p className="text-sm text-red-500">{form.formState.errors.org_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code_prefix">Code Prefix</Label>
                            <Input
                                id="code_prefix"
                                placeholder="e.g. XPLOITS (Used for ID: XPLOITS-001)"
                                {...form.register('code_prefix')}
                                style={{ textTransform: 'uppercase' }}
                                maxLength={8}
                            />
                            <p className="text-xs text-gray-500">Prefix for participant codes (Max 8 chars).</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="org_type">Type</Label>
                            <Select
                                onValueChange={(val) => form.setValue('org_type', val as any)}
                                defaultValue={form.getValues('org_type')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="college">College</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="conference">Conference</SelectItem>
                                    <SelectItem value="club">Club</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="institution_name">Institution Name (Optional)</Label>
                            <Input
                                id="institution_name"
                                placeholder="University or Company Name"
                                {...form.register('institution_name')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Contact Phone</Label>
                            <Input
                                id="contact_phone"
                                placeholder="+91..."
                                {...form.register('contact_phone')}
                            />
                            {form.formState.errors.contact_phone && (
                                <p className="text-sm text-red-500">{form.formState.errors.contact_phone.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating...' : 'Get Started'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
