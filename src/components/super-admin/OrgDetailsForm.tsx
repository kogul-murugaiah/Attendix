'use client'

import { useState, useEffect } from 'react'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { toast } from "sonner"

interface OrgDetailsFormProps {
    org: any
    updateOrgAction: (formData: FormData) => Promise<void>
    primaryAdmin?: { id: string; user_id: string; name: string; email: string } | null
    updateAdminEmailAction?: (formData: FormData) => Promise<void>
}

// Plan Limits Defaults
const PLAN_LIMITS = {
    free: { max_events: 3, max_participants: 100, max_staff: 5 },
    basic: { max_events: 10, max_participants: 500, max_staff: 10 },
    pro: { max_events: 50, max_participants: 2000, max_staff: 30 },
    enterprise: { max_events: 9999, max_participants: 10000, max_staff: 100 }
}

export function OrgDetailsForm({ org, updateOrgAction, primaryAdmin, updateAdminEmailAction }: OrgDetailsFormProps) {
    const [plan, setPlan] = useState(org.subscription_plan || 'free')
    const [limits, setLimits] = useState({
        max_events: org.max_events,
        max_participants: org.max_participants_per_event,
        max_staff: org.max_staff
    })
    const [loading, setLoading] = useState(false)
    const [adminEmail, setAdminEmail] = useState(primaryAdmin?.email || '')
    const [adminLoading, setAdminLoading] = useState(false)

    // Handle Plan Change
    const handlePlanChange = (newPlan: string) => {
        setPlan(newPlan)
        // Auto-update limits based on plan defaults
        // @ts-ignore
        const defaults = PLAN_LIMITS[newPlan]
        if (defaults) {
            setLimits({
                max_events: defaults.max_events,
                max_participants: defaults.max_participants,
                max_staff: defaults.max_staff
            })
        }
    }

    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            await updateOrgAction(formData)
            toast.success("Changes saved successfully")
            router.push('/super-admin')
        } catch (error) {
            toast.error("Failed to save changes")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdminEmailUpdate = async () => {
        if (!primaryAdmin || !updateAdminEmailAction) return
        setAdminLoading(true)
        try {
            const formData = new FormData()
            formData.append('admin_email', adminEmail)
            formData.append('admin_user_id', primaryAdmin.user_id)
            await updateAdminEmailAction(formData)
            toast.success("Admin email updated successfully")
        } catch (error) {
            toast.error("Failed to update admin email")
            console.error(error)
        } finally {
            setAdminLoading(false)
        }
    }

    return (
        <form action={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Subscription Settings */}
                <Card className="bg-[#13131a] border-white/10 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white">Subscription Management</CardTitle>
                        <CardDescription className="text-gray-400">Manage plan tier and status</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Plan Tier</Label>
                            <Select name="plan" value={plan} onValueChange={handlePlanChange}>
                                <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Status</Label>
                            <Select name="status" defaultValue={org.subscription_status || 'trial'}>
                                <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a24] border-white/10 text-white">
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Identity & Prefix */}
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Organization Identity</CardTitle>
                        <CardDescription className="text-gray-400">Manage the organization's unique code and registration prefix</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 pb-2">
                            <Label className="text-purple-400 text-xs uppercase tracking-wider font-bold">Code Prefix</Label>
                            <Input
                                name="org_code"
                                defaultValue={org.org_code}
                                className="bg-black/50 border-purple-500/20 text-white font-mono h-11 text-lg uppercase"
                            />
                            <p className="text-[11px] text-gray-400 italic mt-1">
                                This code is used for the organization's dashboard URL and as the prefix for all participant IDs.
                            </p>
                            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 mt-3">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500 uppercase font-medium">Dashboard URL Preview</span>
                                    <span className="text-purple-400 font-mono tracking-tight">/{org.org_code}/admin</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500 uppercase font-medium">Participant ID Preview</span>
                                    <span className="text-cyan-400 font-mono tracking-tight">{org.org_code.toUpperCase()}-001</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-red-400/80 italic mt-3">WARNING: Changing this will break existing registration links and dashboard access URLs.</p>
                        </div>
                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <Label className="text-gray-400">Max Events</Label>
                            <Input
                                name="max_events"
                                type="number"
                                value={limits.max_events}
                                onChange={(e) => setLimits({ ...limits, max_events: parseInt(e.target.value) })}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Max Participants (per event)</Label>
                            <Input
                                name="max_participants"
                                type="number"
                                value={limits.max_participants}
                                onChange={(e) => setLimits({ ...limits, max_participants: parseInt(e.target.value) })}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Max Staff</Label>
                            <Input
                                name="max_staff"
                                type="number"
                                value={limits.max_staff}
                                onChange={(e) => setLimits({ ...limits, max_staff: parseInt(e.target.value) })}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Meta */}
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Contact Information</CardTitle>
                        <CardDescription className="text-gray-400">Organization contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Contact Person</Label>
                            <Input
                                name="contact_person"
                                defaultValue={org.contact_person || ''}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Contact Email</Label>
                            <Input
                                name="contact_email"
                                defaultValue={org.contact_email || ''}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Billing Email</Label>
                            <Input
                                name="billing_email"
                                defaultValue={org.billing_email || ''}
                                className="bg-black/50 border-white/10 text-white"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Primary Admin User */}
            {primaryAdmin && (
                <Card className="bg-[#13131a] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Primary Admin User</CardTitle>
                        <CardDescription className="text-gray-400">Manage the login credentials for the organization's primary admin</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Admin Name</Label>
                            <Input
                                disabled
                                value={primaryAdmin.name || 'N/A'}
                                className="bg-black/50 border-white/10 text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Login Email</Label>
                            <div className="flex space-x-2">
                                <Input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    className="bg-black/50 border-white/10 text-white flex-1"
                                />
                                <Button
                                    type="button"
                                    onClick={handleAdminEmailUpdate}
                                    disabled={adminLoading || adminEmail === primaryAdmin.email}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {adminLoading ? 'Updating...' : 'Update Email'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">This changes the email used to log into Attendix.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end pt-6">
                <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
