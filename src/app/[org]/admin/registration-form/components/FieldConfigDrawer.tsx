'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FieldType } from '@/lib/types/registration';
import { toast } from 'sonner';

interface FieldConfigDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    field: Partial<FormField> | null;
    onSave: (field: Partial<FormField>) => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email Address' },
    { value: 'tel', label: 'Phone Number' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Dropdown Selection' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date Picker' },
    { value: 'file', label: 'File Upload' },
];

export default function FieldConfigDrawer({
    open,
    onOpenChange,
    field,
    onSave
}: FieldConfigDrawerProps) {
    const [formData, setFormData] = useState<Partial<FormField>>({
        field_label: '',
        field_type: 'text',
        is_required: false,
        placeholder: '',
        help_text: '',
        field_options: [],
        field_name: ''
    });

    const [optionsString, setOptionsString] = useState('');

    useEffect(() => {
        if (open) {
            if (field) {
                // Editing existing field
                setFormData({ ...field });
                // Convert options array to comma-separated string for editing
                if (field.field_options && Array.isArray(field.field_options)) {
                    setOptionsString(field.field_options.join(', '));
                } else {
                    setOptionsString('');
                }
            } else {
                // New field default
                setFormData({
                    field_label: '',
                    field_type: 'text',
                    is_required: false,
                    placeholder: '',
                    help_text: '',
                    field_options: []
                });
                setOptionsString('');
            }
        }
    }, [open, field]);

    const handleSave = () => {
        if (!formData.field_label) {
            toast.error("Label is required");
            return;
        }

        // Process options
        let processedOptions: string[] = [];
        if (['select', 'radio', 'checkbox'].includes(formData.field_type as string)) {
            processedOptions = optionsString.split(',').map(s => s.trim()).filter(Boolean);
            if (processedOptions.length === 0) {
                toast.error("Please add at least one option (comma separated)");
                return;
            }
        }

        const finalData = {
            ...formData,
            field_options: processedOptions.length > 0 ? processedOptions : null,
            // Generate field_name (key) from label if not present (only for new fields)
            field_name: field?.field_name || formData.field_label?.toLowerCase().replace(/[^a-z0-9]/g, '_')
        };

        onSave(finalData);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-[#18181b]/95 backdrop-blur-xl border-l border-white/10 text-white sm:max-w-[500px] flex flex-col h-full w-full shadow-2xl shadow-black/50">
                <SheetHeader className="flex-none pb-6 border-b border-white/5">
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        {field ? 'Edit Field' : 'Add Custom Field'}
                    </SheetTitle>
                    <SheetDescription className="text-gray-400 text-sm">
                        Configure the properties for this registration field.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-6">
                    {/* Label */}
                    <div className="space-y-2">
                        <Label htmlFor="label" className="text-gray-300 font-medium">Field Label <span className="text-purple-400">*</span></Label>
                        <Input
                            id="label"
                            value={formData.field_label}
                            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                            placeholder="e.g. T-Shirt Size"
                            className="bg-black/40 border-white/10 text-white focus:border-purple-500/50 h-11"
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-gray-300 font-medium">Field Type</Label>
                        <Select
                            value={formData.field_type}
                            onValueChange={(val) => setFormData({ ...formData, field_type: val as FieldType })}
                            disabled={field?.is_locked}
                        >
                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181b] border-white/10 text-white">
                                {FIELD_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Options (Conditional) */}
                    {['select', 'radio', 'checkbox'].includes(formData.field_type as string) && (!formData.field_name?.startsWith('event_') && !field?.field_name?.startsWith('event_')) && (
                        <div className="space-y-2 bg-gradient-to-b from-white/5 to-transparent p-4 rounded-xl border border-white/10">
                            <Label htmlFor="options" className="text-gray-300 font-medium">Options (Comma Separated)</Label>
                            <Textarea
                                id="options"
                                value={optionsString}
                                onChange={(e) => setOptionsString(e.target.value)}
                                placeholder="Small, Medium, Large, XL"
                                className="bg-black/40 border-white/10 text-white focus:border-purple-500/50 min-h-[100px] font-mono text-sm leading-relaxed"
                            />
                            <p className="text-xs text-gray-500 font-medium">Enter options separated by commas.</p>
                        </div>
                    )}

                    {/* Dynamic Event Options Message */}
                    {(formData.field_name?.startsWith('event_') || field?.field_name?.startsWith('event_')) && (
                        <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl flex gap-3 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                            <p className="text-sm text-purple-200">
                                <strong>Dynamic Event Field:</strong> The options for this dropdown are automatically populated with your active events.
                            </p>
                        </div>
                    )}

                    {/* Checkbox Props */}
                    <div className="flex items-center space-x-3 p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                        <Checkbox
                            id="required"
                            checked={formData.is_required}
                            onCheckedChange={(c) => setFormData({ ...formData, is_required: c as boolean })}
                            className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 w-5 h-5 rounded-md"
                        />
                        <div className="space-y-0.5">
                            <Label htmlFor="required" className="text-gray-200 font-medium cursor-pointer text-base">Required Field</Label>
                            <p className="text-xs text-gray-500">Student must fill this before submitting.</p>
                        </div>
                    </div>

                    {/* Placeholder & Help Text */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="placeholder" className="text-gray-300 font-medium">Placeholder Text</Label>
                            <Input
                                id="placeholder"
                                value={formData.placeholder || ''}
                                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                                placeholder="e.g. Select your size..."
                                className="bg-black/40 border-white/10 text-white h-10 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="help" className="text-gray-300 font-medium">Help / Query Text</Label>
                            <Input
                                id="help"
                                value={formData.help_text || ''}
                                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                                placeholder="Detailed instructions for the user"
                                className="bg-black/40 border-white/10 text-white h-10 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-none pt-6 border-t border-white/10 mt-auto grid grid-cols-2 gap-4">
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full bg-transparent hover:bg-white/5 text-gray-300 border-white/10 h-11">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 h-11 border-0 shadow-lg shadow-purple-900/20">
                        {field ? 'Save Changes' : 'Add Field'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
