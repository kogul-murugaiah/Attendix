'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/context/organization-context'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { Mail, RefreshCw, Save, Info } from 'lucide-react'

const DEFAULT_EMAIL_TEMPLATE = `Dear {name},
Thank you for registering with {org_name}!
{event_details}
Your unique participant code is:
{code_box}
Please find your QR code ticket attached. Present it at the venue for entry.
See you at the event!`;

export default function EmailSettings() {
    const { organization, refresh } = useOrganization()
    const supabase = createClient()
    const [template, setTemplate] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (organization) {
            setTemplate(organization.email_template || DEFAULT_EMAIL_TEMPLATE)
        }
    }, [organization])

    const handleSave = async () => {
        if (!organization) return
        setIsSaving(true)

        const { error } = await supabase
            .from('organizations')
            .update({ email_template: template })
            .eq('id', organization.id)

        if (error) {
            toast.error('Failed to save template: ' + error.message)
        } else {
            toast.success('Email template updated successfully')
            await refresh()
        }
        setIsSaving(false)
    }

    const handleReset = () => {
        setTemplate(DEFAULT_EMAIL_TEMPLATE)
        toast.info('Template reset to default (save to apply changes)')
    }

    if (!organization) return null

    return (
        <div className="space-y-8 font-sans text-left">
            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30">
                <div className="relative bg-[#13131a]/90 backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Mail className="w-6 h-6 text-purple-400" />
                                Ticket Email Template
                            </h2>
                            <p className="text-sm text-gray-400">Customize the message body sent to participants upon successful registration.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl h-11 transition-all"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset to Default
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0 rounded-xl h-11 px-6 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all font-semibold"
                            >
                                {isSaving ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Template
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Editor Section */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-300 block">Email Body Message</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl pointer-events-none group-focus-within:opacity-100 opacity-0 transition-opacity"></div>
                                <Textarea
                                    value={template}
                                    onChange={(e) => setTemplate(e.target.value)}
                                    className="min-h-[400px] bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl p-4 font-mono text-sm resize-none leading-relaxed transition-all"
                                    placeholder="Enter your email template here..."
                                />
                            </div>

                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex gap-3 items-start text-left">
                                <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-1">Available Variables</h4>
                                    <p className="text-xs text-purple-300/60 leading-relaxed mb-2">Use these placeholders to dynamically insert participant and event details.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                        <code className="bg-black/40 px-2 py-1 rounded text-purple-400 text-xs border border-purple-500/10 text-center">{"{name}"}</code>
                                        <code className="bg-black/40 px-2 py-1 rounded text-purple-400 text-xs border border-purple-500/10 text-center">{"{code}"}</code>
                                        <code className="bg-black/40 px-2 py-1 rounded text-purple-400 text-xs border border-purple-500/10 text-center">{"{org_name}"}</code>
                                        <code className="bg-black/40 px-2 py-1 rounded text-cyan-400 text-xs border border-cyan-500/10 font-bold text-center">{"{event_details}"}</code>
                                        <code className="bg-black/40 px-2 py-1 rounded text-cyan-400 text-xs border border-cyan-500/10 font-bold text-center">{"{code_box}"}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-gray-300 block">Live Preview (Demo Data)</label>
                            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
                                {/* Email Mockup Header */}
                                <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center">
                                            <Mail className="w-3 h-3 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold text-white">Your Ticket for {organization.org_name}</div>
                                            <div className="text-[8px] text-gray-500">From: teamattendix@gmail.com</div>
                                        </div>
                                    </div>
                                    <div className="text-[8px] text-gray-600 font-mono">Just now</div>
                                </div>

                                {/* Email Mockup Content */}
                                <div className="p-4 bg-white/5 flex-1 overflow-y-auto">
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-black/5 text-left">
                                        <div className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed mb-8">
                                            {(() => {
                                                const ticketBoxPreview = (
                                                    <div key="ticket-box-preview" className="my-4 text-center">
                                                        <div className="p-3 bg-[#1a1a24] rounded-lg border border-purple-500/20 inline-block text-center shadow-lg">
                                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Ticket Code</p>
                                                            <p className="text-lg font-mono font-bold text-purple-400 tracking-wider">XPL-042</p>
                                                        </div>
                                                    </div>
                                                );

                                                const eventDetailsPreview = (
                                                    <div key="event-details-preview" style={{ margin: '15px 0' }}>
                                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase' }}>Registered Events</p>
                                                        <ul style={{ margin: '0', padding: '0', listStyleType: 'none' }}>
                                                            <li style={{ marginBottom: '2px', color: '#111827', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' }}><span style={{ color: '#7c3aed', marginRight: '6px' }}>•</span> Workshop on AI</li>
                                                            <li style={{ color: '#111827', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center' }}><span style={{ color: '#7c3aed', marginRight: '6px' }}>•</span> Hackathon 2026</li>
                                                        </ul>
                                                        <div style={{ marginTop: '10px' }}>
                                                            <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>📍 <strong>Venue:</strong> Main Auditorium</p>
                                                            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#374151' }}>🕒 <strong>Time:</strong> Monday, Feb 2nd, 10:00 AM</p>
                                                        </div>
                                                    </div>
                                                );

                                                let renderedText = template
                                                    .replace(/\{name\}/g, 'John Doe')
                                                    .replace(/\{code\}/g, 'XPL-042')
                                                    .replace(/\{org_name\}/g, organization.org_name);

                                                const parts = renderedText.split(/(\{event_details\}|\{code_box\})/g);
                                                const result: React.ReactNode[] = [];

                                                parts.forEach((part, i) => {
                                                    if (part === '{event_details}') {
                                                        result.push(eventDetailsPreview);
                                                    } else if (part === '{code_box}') {
                                                        result.push(ticketBoxPreview);
                                                    } else {
                                                        result.push(<span key={i}>{part}</span>);
                                                    }
                                                });

                                                if (!renderedText.includes('{code_box}')) {
                                                    result.push(ticketBoxPreview);
                                                }

                                                return result;
                                            })()}
                                        </div>

                                        {/* Preview Closing */}
                                        <div className="border-t border-gray-100 pt-4 text-left">
                                            <p className="text-[12px] font-semibold text-gray-500 m-0">Best regards,</p>
                                            <p className="text-sm font-bold text-purple-600 m-0">{organization.org_name} Team</p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-50 border-l-4 border-purple-400 bg-gray-50/50 p-2.5 italic text-[10px] text-gray-500">
                                            <strong>Note:</strong> Your unique QR ticket is attached. Please keep it ready for scanning at the entrance.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
