'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';
import { RegistrationForm, FormField } from '@/lib/types/registration';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import FieldList from './components/FieldList';
import FieldConfigDrawer from './components/FieldConfigDrawer';

export default function RegistrationFormPage() {
    const { organization, loading: orgLoading } = useOrganization();
    const supabase = createClient();

    const [form, setForm] = useState<RegistrationForm | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingField, setEditingField] = useState<Partial<FormField> | null>(null);

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

    const handleDeleteField = async (id: string) => {
        if (!confirm("Are you sure? All student data associated with this field might be lost!")) return;

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

    if (orgLoading || loading) return <div className="min-h-screen text-white flex items-center justify-center">Loading Editor...</div>;
    if (!form) return <div className="min-h-screen text-white flex items-center justify-center">Form initialization failed. Check DB triggers.</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                            Registration Form
                        </h1>
                        <p className="text-gray-400 mt-1">Customize the fields students see during registration.</p>
                    </div>
                    <Button
                        onClick={handleAddField}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Field
                    </Button>
                </div>

                {/* Field List */}
                <div className="bg-[#13131a]/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <FieldList
                        fields={fields}
                        onEdit={handleEditField}
                        onDelete={handleDeleteField}
                        onMove={handleMoveField}
                    />
                </div>
            </div>

            <FieldConfigDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                field={editingField}
                onSave={handleSaveField}
            />
        </div>
    );
}
