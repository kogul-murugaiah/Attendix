'use client';

import { FormField } from '@/lib/types/registration';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from "@/components/ui/card";

interface FieldListProps {
    fields: FormField[];
    onEdit: (field: FormField) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
}

export default function FieldList({ fields, onEdit, onDelete, onMove }: FieldListProps) {
    // Sort by display_order
    const sortedFields = [...fields].sort((a, b) => a.display_order - b.display_order);

    return (
        <div className="space-y-3">
            {sortedFields.map((field, index) => (
                <div key={field.id} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                    <Card className="relative p-5 bg-[#18181b]/80 backdrop-blur-md border-white/5 group-hover:border-white/10 transition-all flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-5">
                            <div className="flex flex-col gap-1 text-gray-600 group-hover:text-gray-400 transition-colors">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:text-white hover:bg-white/10 disabled:opacity-10"
                                    onClick={() => onMove(field.id, 'up')}
                                    disabled={index === 0}
                                >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg hover:text-white hover:bg-white/10 disabled:opacity-10"
                                    onClick={() => onMove(field.id, 'down')}
                                    disabled={index === sortedFields.length - 1}
                                >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-white text-lg tracking-tight">{field.field_label}</span>
                                    {field.is_required && (
                                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20 px-2 py-0.5 rounded-full font-medium">
                                            Required
                                        </Badge>
                                    )}
                                    {field.is_locked && <Lock className="w-3.5 h-3.5 text-cyan-400/50" />}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 font-medium">
                                    <span className="uppercase tracking-wider text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">{field.field_type}</span>
                                    <span className="text-gray-700 mx-1">•</span>
                                    <span className="font-mono opacity-50 text-[10px]">{field.field_name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-x-2 sm:translate-x-4 sm:group-hover:translate-x-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(field)}
                                className="h-9 px-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>

                            {!field.is_locked && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(field.id)}
                                    className="h-9 w-9 p-0 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg hover:border-red-500/20 border border-transparent"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            ))}

            {fields.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                    No fields configured yet.
                </div>
            )}
        </div>
    );
}
