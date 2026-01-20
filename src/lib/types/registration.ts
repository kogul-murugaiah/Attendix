export type FieldType = 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio';

export interface RegistrationForm {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FormField {
    id: string;
    form_id: string;
    field_name: string;
    field_label: string;
    field_type: FieldType;
    field_options: string[] | null; // Stored as JSONB in DB, parsed as string[] here
    is_required: boolean;
    is_core_field: boolean;
    is_locked: boolean;
    placeholder: string | null;
    help_text: string | null;
    validation_rules: any | null;
    display_order: number;
}

export interface StudentRegistration {
    id: string;
    organization_id: string;
    form_id: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    custom_data: Record<string, any>;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    qr_code: string | null;
    created_at: string;
}
