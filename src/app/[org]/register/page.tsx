'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FormField } from '@/lib/types/registration';
import { Loader2, CheckCircle } from 'lucide-react';

export default function RegistrationPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [participantCode, setParticipantCode] = useState('');
    const [participantName, setParticipantName] = useState('');

    const [formId, setFormId] = useState<string | null>(null);
    const [formDetails, setFormDetails] = useState<{ name: string, description: string | null } | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState<{ id: string; data: Record<string, any> }[]>([
        { id: crypto.randomUUID(), data: {} }
    ]);
    const [registeredMembers, setRegisteredMembers] = useState<{ full_name: string; qr_code: string; email: string }[]>([]);

    useEffect(() => {
        if (organization) {
            initRegistration();
        }
    }, [organization]);

    const initRegistration = async () => {
        if (!organization) return;
        setLoading(true);

        try {
            // Check if registration is open
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('registration_open, logo_url')
                .eq('id', organization.id)
                .single();

            if (orgError) {
                console.error("Organization fetch error", orgError);
                toast.error("Failed to load organization details.");
                setLoading(false);
                return;
            }

            // If registration is closed, stop here
            if (!orgData.registration_open) {
                if (orgData.logo_url) {
                    setLogoUrl(orgData.logo_url);
                } else if (organization.logo_url) {
                    setLogoUrl(organization.logo_url);
                }
                setLoading(false);
                return;
            }

            const { data: form, error: formError } = await supabase
                .from('registration_forms')
                .select('id, name, description')
                .eq('organization_id', organization.id)
                .eq('is_active', true)
                .single();

            if (formError || !form) {
                console.error("Form fetch error", formError);
                toast.error("Registration form not found.");
                setLoading(false);
                return;
            }

            setFormId(form.id);
            setFormDetails({ name: form.name, description: form.description });

            if (orgData?.logo_url) {
                setLogoUrl(orgData.logo_url);
            } else if (organization.logo_url) {
                setLogoUrl(organization.logo_url);
            }

            const { data: fieldsData } = await supabase
                .from('form_fields')
                .select('*')
                .eq('form_id', form.id)
                .order('display_order');

            if (fieldsData) {
                setFields(fieldsData as unknown as FormField[]);
            }

            const { data: eventData } = await supabase
                .from('events')
                .select('id, event_name')
                .eq('organization_id', organization.id)
                .eq('is_registration_open', true);

            if (eventData) setEvents(eventData);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load registration form");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (fieldName: string, value: any, memberId?: string) => {
        if (memberId) {
            setMembers(prev => prev.map(m =>
                m.id === memberId ? { ...m, data: { ...m.data, [fieldName]: value } } : m
            ));
        } else {
            setFormData(prev => ({ ...prev, [fieldName]: value }));
        }
    };

    const addMember = () => {
        if (members.length >= (organization?.max_team_members || 5)) {
            toast.error(`Maximum ${organization?.max_team_members || 5} members allowed`);
            return;
        }
        setMembers([...members, { id: crypto.randomUUID(), data: {} }]);
    };

    const removeMember = (id: string) => {
        if (members.length <= 1) return;
        setMembers(members.filter(m => m.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization || !formId || submitting) return;
        setSubmitting(true);

        try {
            const teamMode = organization.team_events_enabled;
            const registrationGroupId = crypto.randomUUID();

            if (teamMode && !teamName) {
                toast.error("Team Name is required");
                setSubmitting(false);
                return;
            }

            // Create an array of registrations to process
            const toRegister = teamMode ? members : [{ id: 'single', data: formData }];

            // Validate all members
            for (const member of toRegister) {
                const memberIndex = toRegister.indexOf(member);
                for (const field of fields) {
                    // Skip validation for event fields if not the team lead in team mode
                    if (teamMode && memberIndex > 0 && (field.field_name.startsWith('event_') || field.field_name.includes('event'))) {
                        continue;
                    }

                    const value = member.data[field.field_name];
                    const isEmpty = !value || value === 'none';

                    if (field.is_required && isEmpty) {
                        toast.error(`${field.field_label} is required ${teamMode ? `for member ${memberIndex + 1}` : ''}`);
                        setSubmitting(false);
                        return;
                    }
                }
            }

            const results: any[] = [];

            // Extract Lead's event preferences if in team mode
            let leadEventIds: string[] = [];
            if (teamMode && members.length > 0) {
                const leadData = members[0].data;
                fields.forEach(field => {
                    if (field.field_name.startsWith('event_') || field.field_name.includes('event')) {
                        const value = leadData[field.field_name];
                        if (value && typeof value === 'string' && value.length > 20) {
                            leadEventIds.push(value);
                        }
                    }
                });
                leadEventIds = Array.from(new Set(leadEventIds));
            }

            for (const member of toRegister) {
                const memberData = member.data;
                const coreData: any = {
                    organization_id: organization.id,
                    form_id: formId,
                    status: 'pending',
                    custom_data: {},
                    team_name: teamMode ? teamName : null,
                    registration_group_id: teamMode ? registrationGroupId : null
                };

                const selectedEvents: string[] = [];
                const fileUploads: { fieldName: string, file: File }[] = [];

                fields.forEach(field => {
                    const value = memberData[field.field_name];

                    if (field.field_type === 'file' && value instanceof File) {
                        fileUploads.push({ fieldName: field.field_name, file: value });
                    }
                    else if (field.field_name.startsWith('event_') || field.field_name.includes('event')) {
                        // In team mode, event selection is handled by leadEventIds pre-calculated above
                        if (!teamMode && value && typeof value === 'string' && value.length > 20) {
                            selectedEvents.push(value);
                        }
                    }
                    else if ([
                        'full_name', 'email', 'phone',
                        'college', 'department', 'year_of_study', 'register_number'
                    ].includes(field.field_name)) {
                        coreData[field.field_name] = value;
                    }
                    else if (field.field_name === 'year') coreData.year_of_study = value;
                    else if (field.field_name === 'dept' || field.field_name === 'department') {
                        if (value === 'Other (Please specify)' && memberData['custom_department']) {
                            coreData.department = memberData['custom_department'];
                        } else {
                            coreData.department = value;
                        }
                    }
                    else if (field.field_name === 'college_name') coreData.college = value;
                    else {
                        coreData.custom_data[field.field_name] = value;
                    }
                });

                // Shared fields in Team Mode
                if (teamMode) {
                    // For team mode, shared fields like College or Event 1 are usually same
                    // But our structure allows individual. 
                    // Let's assume the FIRST member sets the tone for shared data if not filled for others?
                    // Or just let them be individual. 
                }

                if (fileUploads.length > 0) {
                    for (const upload of fileUploads) {
                        const fileExt = upload.file.name.split('.').pop();
                        const fileName = `${organization.id}/${crypto.randomUUID()}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage.from('registrations').upload(fileName, upload.file);
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage.from('registrations').getPublicUrl(fileName);
                        coreData.custom_data[upload.fieldName] = publicUrl;
                    }
                }

                if (!coreData.full_name) coreData.full_name = memberData['full_name'] || '-';

                const finalEvents = teamMode ? leadEventIds : Array.from(new Set(selectedEvents));

                const { data: insertedData, error } = await supabase.rpc('register_participant', {
                    p_organization_id: organization.id,
                    p_full_name: coreData.full_name,
                    p_email: coreData.email,
                    p_phone: coreData.phone,
                    p_college: coreData.college,
                    p_department: coreData.department,
                    p_year_of_study: coreData.year_of_study,
                    p_event_ids: finalEvents,
                    p_team_name: coreData.team_name,
                    p_registration_group_id: coreData.registration_group_id,
                    p_custom_data: coreData.custom_data,
                    p_form_id: formId
                }).single() as { data: { id: string, qr_code: string } | null, error: any };

                if (error) {
                    if (error.code === '23505') throw new Error(`Email ${coreData.email} is already registered.`);
                    throw error;
                }

                if (!insertedData) throw new Error("Registration failed to return data");

                results.push({ ...insertedData, full_name: coreData.full_name, email: coreData.email });

                // Trigger Email Sending (Individual)
                if (coreData.email) {
                    try {
                        fetch('/api/send-ticket', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                participantId: insertedData.id,
                                email: coreData.email,
                                name: coreData.full_name,
                                eventName: selectedEvents.join(', '),
                                participantCode: insertedData.qr_code,
                                organizationName: organization.org_name,
                                organizationId: organization.id,
                            })
                        });
                    } catch (e) { }
                }
            }

            setRegisteredMembers(results.map(r => ({
                full_name: r.full_name,
                qr_code: r.qr_code,
                email: r.email
            })));
            setParticipantName(teamMode ? teamName : results[0].full_name);
            setParticipantCode(teamMode ? teamName : results[0].qr_code);
            setSuccess(true);
            toast.success(teamMode ? "Team Registered Successfully!" : "Registration Successful!");

        } catch (err: any) {
            toast.error(err.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: FormField, memberId?: string) => {
        const currentData = memberId ? (members.find(m => m.id === memberId)?.data || {}) : formData;

        const inputClasses = "bg-[#1a0f2e]/50 border border-purple-500/20 text-white placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 rounded-lg transition-all duration-200 hover:bg-[#1a0f2e]/70 hover:border-purple-500/30 h-11 px-4";

        const commonProps = {
            id: memberId ? `${memberId}-${field.field_name}` : field.field_name,
            disabled: submitting,
            value: currentData[field.field_name] || '',
            required: field.is_required,
            className: inputClasses
        };

        const options = Array.isArray(field.field_options) ? field.field_options : [];

        if (field.field_name.startsWith('event_')) {
            const otherSelectedEventIds = Object.entries(currentData)
                .filter(([name, value]) => name.startsWith('event_') && name !== field.field_name && value && value !== 'none')
                .map(([_, value]) => value);

            const availableEvents = events.filter(e => !otherSelectedEventIds.includes(e.id));

            return (
                <Select onValueChange={v => handleInputChange(field.field_name, v, memberId)} value={currentData[field.field_name]}>
                    <SelectTrigger className={inputClasses}>
                        <SelectValue placeholder={field.placeholder || "Select Event"} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0f2e] border border-purple-500/30 text-white rounded-lg">
                        <SelectItem value="none" className="focus:bg-purple-500/20 rounded-md">-- None --</SelectItem>
                        {availableEvents.map(e => (
                            <SelectItem key={e.id} value={e.id} className="focus:bg-cyan-500/20 rounded-md cursor-pointer">{e.event_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        switch (field.field_type) {
            case 'textarea':
                return (
                    <Textarea
                        {...commonProps}
                        placeholder={field.placeholder || ''}
                        onChange={e => handleInputChange(field.field_name, e.target.value, memberId)}
                        className={`${inputClasses} min-h-[100px]`}
                    />
                );
            case 'select':
                return (
                    <div className="space-y-3">
                        <Select
                            onValueChange={v => {
                                handleInputChange(field.field_name, v, memberId);
                                // Reset custom other value if we switch away from Other
                                if (field.field_name === 'department' && v !== 'Other (Please specify)') {
                                    handleInputChange('custom_department', '', memberId);
                                }
                            }}
                            value={currentData[field.field_name]}
                        >
                            <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder={field.placeholder || "Select option"} />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a0f2e] border border-purple-500/30 text-white rounded-lg">
                                {options.map((opt: string) => (
                                    <SelectItem key={opt} value={opt} className="focus:bg-cyan-500/20 rounded-md cursor-pointer">{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Custom Input for "Other" Department */}
                        {field.field_name === 'department' && currentData[field.field_name] === 'Other (Please specify)' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <Input
                                    placeholder="Please specify your department"
                                    value={currentData['custom_department'] || ''}
                                    onChange={e => handleInputChange('custom_department', e.target.value, memberId)}
                                    className={`${inputClasses} border-cyan-400/30 bg-cyan-400/5`}
                                    required
                                />
                                <p className="text-[10px] text-cyan-400/70 mt-1 ml-1">Type your department name above</p>
                            </div>
                        )}
                    </div>
                );
            case 'checkbox':
                if (options.length > 0) {
                    return (
                        <div className="flex flex-col gap-2.5 bg-[#1a0f2e]/30 p-4 rounded-lg border border-purple-500/20">
                            {options.map((opt: string) => (
                                <div key={opt} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a0f2e]/50 transition-colors">
                                    <Checkbox
                                        id={memberId ? `${memberId}-${field.field_name}-${opt}` : `${field.field_name}-${opt}`}
                                        checked={(Array.isArray(currentData[field.field_name]) ? currentData[field.field_name] : []).includes(opt)}
                                        onCheckedChange={(checked) => {
                                            const currentRefs = Array.isArray(currentData[field.field_name]) ? [...currentData[field.field_name]] : [];
                                            if (checked) {
                                                handleInputChange(field.field_name, [...currentRefs, opt], memberId);
                                            } else {
                                                handleInputChange(field.field_name, currentRefs.filter(v => v !== opt), memberId);
                                            }
                                        }}
                                        className="border-purple-500/50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <label htmlFor={memberId ? `${memberId}-${field.field_name}-${opt}` : `${field.field_name}-${opt}`} className="text-sm text-gray-300 cursor-pointer">{opt}</label>
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center gap-3 bg-[#1a0f2e]/30 p-4 rounded-lg border border-purple-500/20 hover:bg-[#1a0f2e]/50 transition-colors">
                            <Checkbox
                                id={memberId ? `${memberId}-${field.field_name}` : field.field_name}
                                checked={!!currentData[field.field_name]}
                                onCheckedChange={c => handleInputChange(field.field_name, c, memberId)}
                                className="border-purple-500/50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <label htmlFor={memberId ? `${memberId}-${field.field_name}` : field.field_name} className="text-sm text-gray-300 cursor-pointer">{field.placeholder || "Yes"}</label>
                        </div>
                    );
                }
            case 'radio':
                return (
                    <RadioGroup
                        value={currentData[field.field_name] || ''}
                        onValueChange={v => handleInputChange(field.field_name, v, memberId)}
                        className="flex flex-col gap-2.5 bg-[#1a0f2e]/30 p-4 rounded-lg border border-purple-500/20"
                    >
                        {options.map((opt: string) => (
                            <div key={opt} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a0f2e]/50 transition-colors">
                                <RadioGroupItem value={opt} id={memberId ? `${memberId}-${field.field_name}-${opt}` : `${field.field_name}-${opt}`} className="border-purple-500/50 text-cyan-400" />
                                <Label htmlFor={memberId ? `${memberId}-${field.field_name}-${opt}` : `${field.field_name}-${opt}`} className="text-gray-300 cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case 'file':
                return (
                    <div className="flex flex-col gap-2">
                        <Input
                            type="file"
                            id={memberId ? `${memberId}-${field.field_name}` : field.field_name}
                            disabled={submitting}
                            required={field.is_required}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Limit file size (e.g., 5MB)
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error("File size must be less than 5MB");
                                        e.target.value = '';
                                        return;
                                    }
                                    handleInputChange(field.field_name, file, memberId);
                                }
                            }}
                            className={`${inputClasses} py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer`}
                        />
                        {currentData[field.field_name] instanceof File && (
                            <p className="text-xs text-cyan-400 font-medium">
                                Selected: {currentData[field.field_name].name}
                            </p>
                        )}
                    </div>
                );
            default:
                return (
                    <Input
                        {...commonProps}
                        type={field.field_type}
                        placeholder={field.placeholder || ''}
                        onChange={e => handleInputChange(field.field_name, e.target.value, memberId)}
                    />
                );
        }
    };

    if (orgLoading || loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0118]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                <p className="text-gray-400 font-medium">Loading registration form...</p>
            </div>
        </div>
    );

    if (!organization) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0118] text-white">
            <div className="text-center bg-[#1a0f2e]/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
                <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
                <p className="text-gray-400">Please check the URL and try again.</p>
            </div>
        </div>
    );

    // Check if registration is closed
    if (!loading && organization && !formId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0118] relative overflow-hidden">
                {/* Subtle background gradient */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]" />
                </div>

                <Card className="w-full max-w-md bg-[#1a0f2e]/80 backdrop-blur-xl border border-purple-500/30 relative z-10 shadow-2xl rounded-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />

                    <CardHeader className="text-center pb-4 pt-8">
                        {logoUrl && (
                            <div className="mx-auto mb-6">
                                <img src={logoUrl} alt="Logo" className="h-24 w-auto mx-auto object-contain" />
                            </div>
                        )}
                        <CardTitle className="text-2xl font-bold mb-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                                Registration Closed
                            </span>
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            {organization.org_name}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        <div className="relative bg-[#0a0118]/50 rounded-xl border border-red-500/30 p-6">
                            <p className="text-gray-300 text-center leading-relaxed">
                                Registration is currently closed. Please contact organisers for further updates.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0118] relative overflow-hidden">
                {/* Dynamic Background Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>

                <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                    {/* Main Ticket Card */}
                    <div className="relative bg-[#1a0f2e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                        {/* Decorative Top Bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-500" />

                        {/* Success Icon Badge */}
                        <div className="flex justify-center pt-10 pb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-600 blur-xl opacity-40 animate-pulse" />
                                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center px-8 pb-4">
                            <h2 className="text-3xl font-extrabold tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-cyan-300">
                                    {organization.team_events_enabled ? "Team Registered!" : "Registration Success!"}
                                </span>
                            </h2>
                            <p className="text-gray-400 mt-2 font-medium">
                                {organization.org_name}
                            </p>
                        </div>

                        {/* The "Ticket" Notched Section */}
                        <div className="relative px-6 py-8 mt-4">
                            {/* Notches */}
                            <div className="absolute top-0 left-[-12px] w-6 h-6 bg-[#0a0118] rounded-full border border-white/10 shadow-inner" />
                            <div className="absolute top-0 right-[-12px] w-6 h-6 bg-[#0a0118] rounded-full border border-white/10 shadow-inner" />

                            {/* Dotted Separator Line */}
                            <div className="absolute top-[11px] left-6 right-6 h-px border-t border-dashed border-white/20" />

                            <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 p-8 relative overflow-hidden group">
                                {/* Subtle scanline effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent bg-[length:100%_4px] animate-scan" />

                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] font-mono">
                                        {organization.team_events_enabled ? "OFFICIAL TEAM ACCESS" : "OFFICIAL ENTRY PASS"}
                                    </span>

                                    <h3 className="text-4xl font-black text-white tracking-widest font-mono group-hover:scale-105 transition-transform duration-500">
                                        {participantCode}
                                    </h3>

                                    <div className="flex flex-col items-center gap-1">
                                        <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                                            {participantName}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Members Secondary Section */}
                        {organization.team_events_enabled && registeredMembers.length > 0 && (
                            <div className="px-8 pb-8 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Roster</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div className="grid gap-2">
                                    {registeredMembers.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-purple-500/30 transition-all duration-300 group/item">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-200 group-hover/item:text-cyan-400 transition-colors">{member.full_name}</span>
                                                <span className="text-[10px] text-gray-500">{member.email}</span>
                                            </div>
                                            <div className="text-right">
                                                <code className="text-[11px] font-mono font-bold text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                                    {member.qr_code}
                                                </code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-8 pb-10 pt-4 flex flex-col gap-4">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-white text-black hover:bg-gray-200 h-14 rounded-2xl font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                            >
                                Register Another
                            </Button>
                            <p className="text-[11px] text-center text-gray-500 italic opacity-60">
                                Ticket details have been sent to registered email addresses
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4 bg-[#0a0118] flex items-center justify-center relative overflow-hidden">
            {/* Subtle ambient background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-3xl bg-[#1a0f2e]/80 backdrop-blur-xl border border-purple-500/30 text-white shadow-2xl relative z-10 rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-500" />

                <CardHeader className="p-8 sm:p-10 pb-6 bg-[#130d1e] rounded-t-2xl">
                    <div className="flex flex-row items-center gap-6">
                        {(logoUrl || organization.logo_url) && (
                            <img
                                src={logoUrl || organization.logo_url || ''}
                                alt={`${organization.org_name} Logo`}
                                className="h-28 w-28 object-contain shrink-0"
                            />
                        )}
                        <div className="text-left space-y-1">
                            <CardTitle className="text-2xl sm:text-3xl font-bold">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                                    {formDetails?.name || `${organization.org_name} Registration`}
                                </span>
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-base">
                                {formDetails?.description || "Please complete the registration form below"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 sm:p-10 pt-4 bg-[#130d1e] rounded-b-2xl">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {organization.team_events_enabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Label htmlFor="team_name" className="text-sm font-medium text-gray-300">
                                    Team Name <span className="text-fuchsia-400">*</span>
                                </Label>
                                <Input
                                    id="team_name"
                                    placeholder="Enter your team name (e.g. Code Wizards)"
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    className="bg-[#1a0f2e]/50 border border-purple-500/20 text-white placeholder:text-gray-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 rounded-lg transition-all duration-200 hover:bg-[#1a0f2e]/70 hover:border-purple-500/30 h-11 px-4"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-8">
                            {organization.team_events_enabled ? (
                                members.map((member, index) => (
                                    <div key={member.id} className="relative p-6 bg-[#1a0f2e]/30 border border-purple-500/20 rounded-xl space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-md font-bold text-purple-300 flex items-center gap-2">
                                                <span className="w-6 h-6 bg-purple-500 text-white text-[10px] rounded-full flex items-center justify-center">{index + 1}</span>
                                                Member Details {index === 0 && "(Lead)"}
                                            </h4>
                                            {index > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => removeMember(member.id)}
                                                    className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {fields
                                                .filter(field => {
                                                    // If team mode, hide event fields for non-lead members
                                                    if (index > 0 && (field.field_name.startsWith('event_') || field.field_name.includes('event'))) {
                                                        return false;
                                                    }
                                                    return true;
                                                })
                                                .map(field => (
                                                    <div key={`${member.id}-${field.id}`} className="space-y-2">
                                                        <Label htmlFor={`${member.id}-${field.field_name}`} className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                            {field.field_label}
                                                            {field.is_required && <span className="text-fuchsia-400 ml-1">*</span>}
                                                        </Label>
                                                        {renderField(field, member.id)}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                fields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.field_name} className="text-sm font-medium text-gray-300">
                                            {field.field_label}
                                            {field.is_required && <span className="text-fuchsia-400 ml-1">*</span>}
                                        </Label>
                                        {renderField(field)}
                                        {field.help_text && (
                                            <p className="text-xs text-gray-500 ml-1">{field.help_text}</p>
                                        )}
                                    </div>
                                ))
                            )}

                            {organization.team_events_enabled && (
                                <Button
                                    type="button"
                                    onClick={addMember}
                                    variant="outline"
                                    className="w-full border-dashed border-purple-500/30 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10 h-12"
                                >
                                    + Add Team Member
                                </Button>
                            )}
                        </div>

                        <div className="pt-6">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-500 text-white font-semibold h-12 rounded-lg shadow-lg shadow-purple-600/30 border-0 transition-all duration-200"
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Processing {members.length > 1 ? `${members.length} Registrations...` : 'Registration...'}</span>
                                    </div>
                                ) : (
                                    organization.team_events_enabled ? 'Submit Team Registration' : 'Submit Registration'
                                )}
                            </Button>
                            <p className="text-center text-xs text-gray-500 mt-4">
                                Every member will receive a unique ticket via email
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
