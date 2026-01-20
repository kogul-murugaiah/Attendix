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
                <Card key={field.id} className="p-4 bg-[#13131a]/50 border-white/5 hover:border-purple-500/20 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1 text-gray-500">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-white hover:bg-white/10 disabled:opacity-20"
                                onClick={() => onMove(field.id, 'up')}
                                disabled={index === 0}
                            >
                                <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-white hover:bg-white/10 disabled:opacity-20"
                                onClick={() => onMove(field.id, 'down')}
                                disabled={index === sortedFields.length - 1}
                            >
                                <ArrowDown className="w-3 h-3" />
                            </Button>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{field.field_label}</span>
                                {field.is_required && <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30 px-1 py-0">Required</Badge>}
                                {field.is_locked && <Lock className="w-3 h-3 text-cyan-500/70" />}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-2">
                                <span className="uppercase">{field.field_type}</span>
                                <span className="opacity-50">•</span>
                                <span className="font-mono opacity-70">{field.field_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(field)}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                        </Button>

                        {!field.is_locked && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(field.id)}
                                className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </Card>
            ))}

            {fields.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl text-gray-500">
                    No fields configured yet.
                </div>
            )}
        </div>
    );
}
