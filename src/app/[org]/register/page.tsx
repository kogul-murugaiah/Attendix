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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FormField } from '@/lib/types/registration';

export default function RegistrationPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [participantCode, setParticipantCode] = useState('');

    const [formId, setFormId] = useState<string | null>(null);
    const [formDetails, setFormDetails] = useState<{ name: string, description: string | null } | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    // Form Data State
    // Core fields + Custom Data
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (organization) {
            initRegistration();
        }
    }, [organization]);

    const initRegistration = async () => {
        if (!organization) return;
        setLoading(true);

        try {
            // 1. Fetch Active Form
            const { data: form, error: formError } = await supabase
                .from('registration_forms')
                .select('id, name, description')
                .eq('organization_id', organization.id)
                .eq('is_active', true)
                .single();

            if (formError || !form) {
                // Fallback or Error? 
                // Should we show a default form if none found? 
                // The DB trigger ensures a default form exists. 
                // If it's missing, it's a critical setup issue (or the trigger failed).
                console.error("Form fetch error", formError);
                toast.error("Registration form not found.");
                setLoading(false);
                return;
            }

            setFormId(form.id);
            setFormDetails({ name: form.name, description: form.description });

            // 1b. Fetch latest Org Logo (Context might be stale)
            const { data: orgData } = await supabase
                .from('organizations')
                .select('logo_url')
                .eq('id', organization.id)
                .single();

            if (orgData?.logo_url) {
                setLogoUrl(orgData.logo_url);
            } else if (organization.logo_url) {
                setLogoUrl(organization.logo_url);
            }

            // 2. Fetch Fields
            const { data: fieldsData } = await supabase
                .from('form_fields')
                .select('*')
                .eq('form_id', form.id)
                .order('display_order');

            if (fieldsData) {
                setFields(fieldsData as unknown as FormField[]);
            }

            // 3. Fetch Events (if needed for selection - old logic kept just in case, but fields might replace it?)
            // The prompt implies we fetch events. But if the form is dynamic, maybe "Event Selection" is just another field?
            // Or we keep the explicit event selection at the bottom?
            // The prompt says "Student Registration", and `student_registrations` has `event_id`.
            // Let's assume (based on prompt "event_id... REFERENCES events") that user registers for A SPECIFIC EVENT or just the ORG in general?
            // The previous logic allowed selecting 3 events. The new table has `event_id`.
            // Multi-event selection might be tricky with single `event_id`.
            // I will keep Event Selection as a separate section if logically required, or as a custom field "select".
            // However, usually "Registration" is for the whole symposium (Org).
            // Let's fetch active events to populate a dynamic "Select Event" field if we want to add one, 
            // OR we can hardcode the Event Selection section like before if the user strictly wants that.
            // **Decision**: I'll render the dynamic fields. If there's no "Event" field, I won't force it 
            // BUT `student_registrations` has `event_id` FK. 
            // I'll add a "Select Primary Event" logic if not present in custom fields.
            // Actually, let's keep it simple: Dynamic Form FIRST. 

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

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization || !formId) return;
        setSubmitting(true);

        try {
            // Validate Required Fields locally
            for (const field of fields) {
                if (field.is_required && !formData[field.field_name]) {
                    toast.error(`${field.field_label} is required`);
                    setSubmitting(false);
                    return;
                }
            }

            // Separate Core Data from Custom Data
            const coreData: any = {
                organization_id: organization.id,
                form_id: formId,
                status: 'pending',
                custom_data: {}
            };

            const selectedEvents: string[] = [];

            // Map fields
            fields.forEach(field => {
                const value = formData[field.field_name];

                // Check for Event Fields (Dynamic or Explicit)
                if (field.field_name.startsWith('event_') || field.field_name.includes('event')) {
                    if (value && typeof value === 'string' && value.length > 20) {
                        selectedEvents.push(value);
                    }
                }
                // Core Explicit Columns (New Schema)
                else if ([
                    'full_name', 'email', 'phone',
                    'college', 'department', 'year_of_study', 'register_number'
                ].includes(field.field_name)) {
                    coreData[field.field_name] = value;
                }
                // Handle variations
                else if (field.field_name === 'year') coreData.year_of_study = value;
                else if (field.field_name === 'dept') coreData.department = value;
                else if (field.field_name === 'college_name') coreData.college = value;

                // All other fields go to custom_data
                else {
                    coreData.custom_data[field.field_name] = value;
                }
            });

            // Ensure mandatory core fields 
            if (!coreData.full_name) coreData.full_name = formData['full_name'] || '-';

            const { data: insertedData, error } = await supabase
                .from('student_registrations')
                .insert(coreData)
                .select('id, qr_code')
                .single();

            if (error) {
                if (error.code === '23505') throw new Error("This email is already registered.");
                throw error;
            }

            setParticipantCode(insertedData.qr_code);

            // 2. Insert Event Registrations (Many-to-Many) with Participant Limit Check
            if (selectedEvents.length > 0) {
                // De-duplicate events
                const uniqueEvents = Array.from(new Set(selectedEvents));

                // Check participant limits for each event
                const maxParticipants = organization.max_participants_per_event || 100;

                for (const eventId of uniqueEvents) {
                    // Count existing registrations for this event
                    const { count } = await supabase
                        .from('event_registrations')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', eventId);

                    if (count !== null && count >= maxParticipants) {
                        // Get event name for better error message
                        const event = events.find(e => e.id === eventId);
                        toast.error(`Event "${event?.event_name || 'Selected event'}" has reached capacity (${maxParticipants} participants).`);
                        setSubmitting(false);
                        return;
                    }
                }

                const eventInserts = uniqueEvents.map(eid => ({
                    participant_id: insertedData.id,
                    event_id: eid,
                    attendance_status: false
                }));

                const { error: eventError } = await supabase
                    .from('event_registrations')
                    .insert(eventInserts);

                if (eventError) console.error("Event Registration Error:", eventError);
            }

            // 3. Broadcast Global Event for Real-time Dashboards
            // This ensures Admin, Reception, and Event Managers see the new student INSTANTLY 
            // without waiting for Postgres Replication lag.
            const channel = supabase.channel('app-global')
            await channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.send({
                        type: 'broadcast',
                        event: 'new-registration',
                        payload: {
                            organization_id: organization.id,
                            student_id: insertedData.id,
                            name: coreData.full_name
                        },
                    })
                    supabase.removeChannel(channel)
                }
            })

            setSuccess(true);
            toast.success("Registration Successful!");

        } catch (err: any) {
            toast.error(err.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Render Helper
    const renderField = (field: FormField) => {
        const commonProps = {
            id: field.field_name,
            disabled: submitting,
            value: formData[field.field_name] || '', // Controlled input needs default
            required: field.is_required,
        };

        // If field.field_options is string[]
        const options = Array.isArray(field.field_options) ? field.field_options : [];

        // Dynamic Event Handling
        if (field.field_name.startsWith('event_')) {
            // Get all other selected event IDs
            const otherSelectedEventIds = Object.entries(formData)
                .filter(([name, value]) => name.startsWith('event_') && name !== field.field_name && value && value !== 'none')
                .map(([_, value]) => value);

            const availableEvents = events.filter(e => !otherSelectedEventIds.includes(e.id));

            return (
                <Select onValueChange={v => handleInputChange(field.field_name, v)} value={formData[field.field_name]}>
                    <SelectTrigger className="bg-gray-900 border-gray-600">
                        <SelectValue placeholder={field.placeholder || "Select Event"} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="none">-- None --</SelectItem>
                        {availableEvents.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.event_name}</SelectItem>
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
                        onChange={e => handleInputChange(field.field_name, e.target.value)}
                        className="bg-gray-900 border-gray-600"
                    />
                );
            case 'select':
                return (
                    <Select onValueChange={v => handleInputChange(field.field_name, v)} value={formData[field.field_name]}>
                        <SelectTrigger className="bg-gray-900 border-gray-600">
                            <SelectValue placeholder={field.placeholder || "Select option"} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            {options.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'checkbox':
                // Multi-select Checkbox (if options exist)
                if (options.length > 0) {
                    return (
                        <div className="flex flex-col space-y-2">
                            {options.map((opt: string) => (
                                <div key={opt} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${field.field_name}-${opt}`}
                                        checked={(Array.isArray(formData[field.field_name]) ? formData[field.field_name] : []).includes(opt)}
                                        onCheckedChange={(checked) => {
                                            const currentRefs = Array.isArray(formData[field.field_name]) ? [...formData[field.field_name]] : [];
                                            if (checked) {
                                                handleInputChange(field.field_name, [...currentRefs, opt]);
                                            } else {
                                                handleInputChange(field.field_name, currentRefs.filter(v => v !== opt));
                                            }
                                        }}
                                        className="border-gray-500"
                                    />
                                    <label
                                        htmlFor={`${field.field_name}-${opt}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {opt}
                                    </label>
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    // Single boolean checkbox
                    return (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={field.field_name}
                                checked={!!formData[field.field_name]}
                                onCheckedChange={c => handleInputChange(field.field_name, c)}
                                className="border-gray-500"
                            />
                            <label
                                htmlFor={field.field_name}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {field.placeholder || "Yes"}
                            </label>
                        </div>
                    );
                }

            case 'radio':
                return (
                    <RadioGroup
                        value={formData[field.field_name] || ''}
                        onValueChange={v => handleInputChange(field.field_name, v)}
                        className="flex flex-col space-y-2"
                    >
                        {options.map((opt: string) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${field.field_name}-${opt}`} className="border-gray-500 text-purple-500" />
                                <Label htmlFor={`${field.field_name}-${opt}`}>{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case 'date':
                return (
                    <Input
                        {...commonProps}
                        type="date"
                        onChange={e => handleInputChange(field.field_name, e.target.value)}
                        className="bg-gray-900 border-gray-600"
                    />
                );
            case 'number':
                return (
                    <Input
                        {...commonProps}
                        type="number"
                        placeholder={field.placeholder || ''}
                        onChange={e => handleInputChange(field.field_name, e.target.value)}
                        className="bg-gray-900 border-gray-600"
                    />
                );
            default: // text, email, tel
                return (
                    <Input
                        {...commonProps}
                        type={field.field_type}
                        placeholder={field.placeholder || ''}
                        onChange={e => handleInputChange(field.field_name, e.target.value)}
                        className="bg-gray-900 border-gray-600"
                    />
                );
        }
    };

    if (orgLoading || loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (!organization) return <div className="min-h-screen flex items-center justify-center text-white">Organization not found</div>;

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
                <Card className="w-full max-w-md bg-gray-800 border-gray-700">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <div className="w-8 h-8 text-green-500">✓</div>
                        </div>
                        <CardTitle className="text-2xl text-green-500">Registration Confirmed!</CardTitle>
                        <CardDescription className="text-gray-400">
                            Welcome to {organization.org_name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-400 mb-1">Your Code</p>
                            <p className="text-3xl font-mono font-bold text-white tracking-widest">{participantCode}</p>
                        </div>
                        <p className="text-sm text-gray-400">
                            Please save this code or take a screenshot.
                        </p>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Register Another Person
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 flex items-center justify-center">
            <Card className="w-full max-w-4xl bg-gray-800 border-gray-700 text-white overflow-hidden shadow-2xl">
                <CardHeader className="p-8 pb-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-8">
                        {(logoUrl || organization.logo_url) && (
                            <div className="shrink-0">
                                <img
                                    src={logoUrl || organization.logo_url || ''}
                                    alt={`${organization.org_name} Logo`}
                                    className="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                />
                            </div>
                        )}
                        <div className="flex-1 text-center sm:text-left">
                            <CardTitle className="text-2xl sm:text-4xl font-black tracking-tight leading-none whitespace-nowrap">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400">
                                    {formDetails?.name || `${organization.org_name} Registration`}
                                </span>
                            </CardTitle>
                            <CardDescription className="text-gray-400 mt-3 text-sm sm:text-base">
                                {formDetails?.description || "Please fill out the form below."}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {fields.map(field => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.field_name}>
                                        {field.field_label}
                                        {field.is_required && <span className="text-red-400 ml-1">*</span>}
                                    </Label>
                                    {renderField(field)}
                                    {field.help_text && <p className="text-xs text-gray-500">{field.help_text}</p>}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 font-bold h-12 text-lg mt-6"
                        >
                            {submitting ? 'Registering...' : 'Register Now'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
