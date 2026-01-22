'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';
import { RegistrationForm, FormField } from '@/lib/types/registration';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Plus, Calendar, Pencil, Copy, Check, ExternalLink, Upload, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FieldList from './components/FieldList';
import FieldConfigDrawer from './components/FieldConfigDrawer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RegistrationFormPage() {
    const { organization, loading: orgLoading, refresh } = useOrganization();
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState<RegistrationForm | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingField, setEditingField] = useState<Partial<FormField> | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Header Edit State
    const [isHeaderDialogOpen, setIsHeaderDialogOpen] = useState(false);
    const [headerForm, setHeaderForm] = useState({ name: '', description: '', logoUrl: '' });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Local display state for header logo (prevents reload requirement)
    const [displayLogo, setDisplayLogo] = useState<string | null>(null);

    useEffect(() => {
        if (organization?.logo_url) {
            setDisplayLogo(organization.logo_url);
        }
    }, [organization?.logo_url]);

    useEffect(() => {
        if (organization) {
            fetchForm();
        }
    }, [organization]);

    const fetchForm = async () => {
        if (!organization) return;
        setLoading(true);

        // 1. Get Active Form
        const { data: formData, error: formError } = await supabase
            .from('registration_forms')
            .select('*')
            .eq('organization_id', organization.id)
            .eq('is_active', true)
            .single();

        if (formError || !formData) {
            // Trigger creation logic if missing (via API or manual Insert)
            // But our DB trigger should have handled this!
            // Let's assume it exists or display empty state.
            // For robustness, try to create one if missing?
            // Rely on trigger for now.
            toast.error("Form not found. Please contact support.");
            setLoading(false);
            return;
        }

        setForm(formData);

        // 2. Get Fields
        const { data: fieldsData, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', formData.id)
            .order('display_order');

        if (fieldsData) {
            setFields(fieldsData as unknown as FormField[]); // Cast for safety if JSON types mismatch
        }

        setLoading(false);
    };

    const handleAddField = () => {
        setEditingField(null);
        setIsDrawerOpen(true);
    };

    const handleAddEventField = () => {
        // Find existing event fields to determine next number
        const eventFields = fields.filter(f => f.field_name.startsWith('event_'));
        let nextNum = 1;

        const usedNums = eventFields.map(f => {
            const match = f.field_name.match(/event_(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });

        if (usedNums.length > 0) {
            nextNum = Math.max(...usedNums) + 1;
        }

        setEditingField({
            field_label: `Event Preference ${nextNum}`,
            field_name: `event_${nextNum}`,
            field_type: 'select',
            is_required: true,
            placeholder: 'Select Event',
            field_options: ['-- Dynamic --']
        });
        setIsDrawerOpen(true);
    };

    const handleEditField = (field: FormField) => {
        setEditingField(field);
        setIsDrawerOpen(true);
    };

    const handleSaveField = async (fieldData: Partial<FormField>) => {
        if (!form) return;

        const isNew = !fieldData.id;

        // Optimistic Update (optional) or just wait for DB
        // Let's wait for DB for integrity

        if (isNew) {
            // Determine order: last + 1
            const maxOrder = fields.length > 0 ? Math.max(...fields.map(f => f.display_order)) : 0;
            const newOrder = maxOrder + 1;

            const { data, error } = await supabase
                .from('form_fields')
                .insert({
                    form_id: form.id,
                    field_name: fieldData.field_name,
                    field_label: fieldData.field_label,
                    field_type: fieldData.field_type,
                    field_options: fieldData.field_options,
                    is_required: fieldData.is_required,
                    placeholder: fieldData.placeholder,
                    help_text: fieldData.help_text,
                    display_order: newOrder,
                    is_core_field: false,
                    is_locked: false
                })
                .select()
                .single();

            if (error) {
                toast.error("Failed to add field: " + error.message);
            } else {
                setFields([...fields, data as unknown as FormField]);
                toast.success("Field added successfully");
            }
        } else {
            // Update
            const { error } = await supabase
                .from('form_fields')
                .update({
                    field_label: fieldData.field_label,
                    field_options: fieldData.field_options,
                    is_required: fieldData.is_required,
                    placeholder: fieldData.placeholder,
                    help_text: fieldData.help_text,
                    // Typically field_type/name shouldn't change for existing fields to preserve data integrity, 
                    // but we allow it for now except locked ones.
                    // field_type: fieldData.field_type 
                })
                .eq('id', fieldData.id!);

            if (error) {
                toast.error("Failed to update field: " + error.message);
            } else {
                setFields(fields.map(f => f.id === fieldData.id ? { ...f, ...fieldData } as FormField : f));
                toast.success("Field updated");
            }
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null); // Close dialog immediately or wait? Better close first to feel responsive.

        const { error } = await supabase.from('form_fields').delete().eq('id', id);

        if (error) {
            toast.error("Failed to delete: " + error.message);
        } else {
            setFields(fields.filter(f => f.id !== id));
            toast.success("Field deleted");
        }
    };


    const handleMoveField = async (id: string, direction: 'up' | 'down') => {
        const index = fields.findIndex(f => f.id === id);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= fields.length) return;

        const currentField = fields[index];
        const targetField = fields[targetIndex];

        // Swap orders locally
        const updatedFields = [...fields];
        updatedFields[index] = { ...targetField, display_order: currentField.display_order };
        updatedFields[targetIndex] = { ...currentField, display_order: targetField.display_order };

        // Sort for UI state
        updatedFields.sort((a, b) => a.display_order - b.display_order);
        setFields(updatedFields);

        // Update DB
        // Batch update is tricky in Supabase JS without RPC, so we do two updates. 
        // Ideally use RPC for atomicity.
        await supabase.from('form_fields').update({ display_order: targetField.display_order }).eq('id', currentField.id);
        await supabase.from('form_fields').update({ display_order: currentField.display_order }).eq('id', targetField.id);
    };

    const handleEditHeader = () => {
        if (!form) return;
        setHeaderForm({
            name: form.name,
            description: form.description || '',
            logoUrl: organization?.logo_url || ''
        });
        setLogoFile(null);
        setIsHeaderDialogOpen(true);
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Simple validation
            if (file.size > 2 * 1024 * 1024) {
                toast.error("File size must be less than 2MB");
                return;
            }
            setLogoFile(file);
            // Preview
            const reader = new FileReader();
            reader.onload = (ev) => {
                setHeaderForm(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDirectLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !organization) return;
        const file = e.target.files[0];

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        const toastId = toast.loading("Uploading logo...");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${organization.id}/logo-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('organization-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('organization-assets')
                .getPublicUrl(fileName);

            // Update Org
            const { error: updateError } = await supabase
                .from('organizations')
                .update({ logo_url: publicUrl })
                .eq('id', organization.id);

            if (updateError) throw updateError;

            toast.success("Logo uploaded!", { id: toastId });
            // Update local state instantly 
            setDisplayLogo(publicUrl);
            // Sync global context
            await refresh();
            // Soft refresh for server components
            router.refresh();

        } catch (error: any) {
            console.error(error);
            toast.error("Upload failed: " + error.message, { id: toastId });
        }
    };

    const handleSaveHeader = async () => {
        if (!form || !organization) return;

        let finalLogoUrl = headerForm.logoUrl;

        // 1. Upload Logo if changed
        if (logoFile) {
            setUploadingLogo(true);
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${organization.id}/logo-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('organization-assets')
                .upload(fileName, logoFile, { upsert: true });

            if (uploadError) {
                toast.error("Failed to upload logo: " + uploadError.message);
                setUploadingLogo(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('organization-assets')
                .getPublicUrl(fileName);

            finalLogoUrl = publicUrl;

            // Update Org
            await supabase
                .from('organizations')
                .update({ logo_url: finalLogoUrl })
                .eq('id', organization.id);

            setUploadingLogo(false);
        }

        // 2. Update Form Details
        const { error } = await supabase
            .from('registration_forms')
            .update({
                name: headerForm.name,
                description: headerForm.description
            })
            .eq('id', form.id);

        if (error) {
            toast.error("Failed to update header: " + error.message);
        } else {
            setForm({ ...form, name: headerForm.name, description: headerForm.description });
            await refresh();
            toast.success("Header & Logo updated successfully");
            setIsHeaderDialogOpen(false);
        }
    };

    if (orgLoading || loading) return <div className="min-h-screen text-white flex items-center justify-center">Loading Editor...</div>;
    if (!form) return <div className="min-h-screen text-white flex items-center justify-center">Form initialization failed. Check DB triggers.</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-purple-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-8">

                {/* Header & Actions */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">

                        {/* Logo & Info Section */}
                        <div className="flex-1 flex items-start gap-6">
                            {/* Logo Uploader Direct Access */}
                            <div className="relative group shrink-0">
                                <Label htmlFor="direct-logo-upload" className="cursor-pointer block">
                                    {displayLogo ? (
                                        <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-white/10 bg-black/20 group-hover:border-purple-500/50 transition-all">
                                            <img src={displayLogo} alt="Logo" className="h-full w-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Upload className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    ) : (<div className="h-24 w-24 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-purple-400 group-hover:border-purple-500/50 transition-all">
                                        <Upload className="w-8 h-8" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Add Logo</span>
                                    </div>
                                    )}
                                </Label>
                                <Input
                                    id="direct-logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleDirectLogoUpload}
                                />
                            </div>

                            {/* Title & Description (Editable) */}
                            <div className="flex-1 space-y-2">
                                <div
                                    onClick={handleEditHeader}
                                    className="group inline-flex items-center gap-3 cursor-pointer select-none"
                                >
                                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 hover:from-purple-300 hover:to-cyan-300 transition-colors">
                                        {form?.name || 'Registration Form'}
                                    </h1>
                                    <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                                        <Pencil className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                                <p className="text-gray-400 max-w-2xl leading-relaxed">
                                    {form?.description || 'Customize the fields students see during registration.'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0 pt-2">
                            <Button
                                onClick={handleAddField}
                                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Custom Field
                            </Button>
                            <Button
                                onClick={handleAddEventField}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Add Event Choice
                            </Button>
                        </div>
                    </div>

                    {/* Registration Status Toggle */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    Registration Status
                                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${organization?.registration_open ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {organization?.registration_open ? '● OPEN' : '● CLOSED'}
                                    </span>
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    {organization?.registration_open
                                        ? 'Students can currently register for events'
                                        : 'Registration is closed. Students will see a message to contact organisers.'}
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!organization) return;
                                    const newStatus = !organization.registration_open;

                                    const { error } = await supabase
                                        .from('organizations')
                                        .update({ registration_open: newStatus })
                                        .eq('id', organization.id);

                                    if (error) {
                                        toast.error('Failed to update registration status');
                                    } else {
                                        toast.success(`Registration ${newStatus ? 'opened' : 'closed'}`);
                                        await refresh();
                                    }
                                }}
                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${organization?.registration_open ? 'bg-green-500' : 'bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${organization?.registration_open ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Share URL Section */}
                <div className="bg-[#13131a]/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Share Registration Form</h3>
                            <p className="text-gray-400 text-sm mt-1">Share this unique link with students to gather registrations.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-black/40 px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-300 font-mono">
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/${organization?.org_code}/register` : '...'}
                                </span>
                            </div>
                            <Button
                                size="icon"
                                className="bg-white/10 hover:bg-white/20 text-white shrink-0 border border-white/20"
                                onClick={() => {
                                    const url = `${window.location.origin}/${organization?.org_code}/register`;
                                    navigator.clipboard.writeText(url);
                                    toast.success("Link copied to clipboard");
                                }}
                                title="Copy Link"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="bg-white/10 hover:bg-white/20 text-white shrink-0 border border-white/20"
                                onClick={() => {
                                    const url = `${window.location.origin}/${organization?.org_code}/register`;
                                    window.open(url, '_blank');
                                }}
                                title="Open Form"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Field List */}
                <div className="bg-[#13131a]/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <FieldList
                        fields={fields}
                        onEdit={handleEditField}
                        onDelete={handleDeleteClick}
                        onMove={handleMoveField}
                    />
                </div>

                <FieldConfigDrawer
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    field={editingField}
                    onSave={handleSaveField}
                />

                <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Field?</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Are you sure you want to delete this field? All student data associated with this field might be lost permanently.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 justify-end mt-4">
                            <Button
                                onClick={() => setDeleteId(null)}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Delete Field
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Header Edit Dialog */}
                <Dialog open={isHeaderDialogOpen} onOpenChange={setIsHeaderDialogOpen}>
                    <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Form Header</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Customize the title and description visible to students.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="form-name">Form Title</Label>
                                <Input
                                    id="form-name"
                                    value={headerForm.name}
                                    onChange={(e) => setHeaderForm({ ...headerForm, name: e.target.value })}
                                    className="bg-[#0a0a0f] border-white/10 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Organization Logo</Label>
                                <div className="flex items-center gap-4">
                                    {headerForm.logoUrl ? (
                                        <div className="relative group">
                                            <img src={headerForm.logoUrl} alt="Logo Preview" className="h-16 w-16 object-contain bg-white/5 rounded-lg border border-white/10" />
                                            <button
                                                onClick={() => {
                                                    setHeaderForm(prev => ({ ...prev, logoUrl: '' }));
                                                    setLogoFile(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-gray-500">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Label htmlFor="logo-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-md transition-colors text-sm text-gray-300">
                                                <Upload className="w-4 h-4" />
                                                Choose Logo File
                                            </div>
                                            <Input
                                                id="logo-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoSelect}
                                            />
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">Recommended: PNG or JPG, max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="form-description">Description / Subtitle</Label>
                                <Textarea
                                    id="form-description"
                                    value={headerForm.description}
                                    onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
                                    className="bg-[#0a0a0f] border-white/10 text-white min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsHeaderDialogOpen(false)} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors">
                                Cancel
                            </Button>
                            <Button onClick={handleSaveHeader} disabled={uploadingLogo} className="bg-purple-600 hover:bg-purple-700">
                                {uploadingLogo ? 'Uploading...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >
        </div >
    );
}
