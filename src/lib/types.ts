export type Organization = {
    id: string
    org_code: string
    org_name: string
    org_type: 'college' | 'corporate' | 'conference' | 'club'
    institution_name?: string | null
    department?: string | null
    contact_person?: string | null
    contact_email?: string | null
    contact_phone?: string | null
    logo_url?: string | null
    custom_domain?: string | null
    branding_colors?: { primary: string; secondary: string } | null
    subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise'
    subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled'
    max_events: number
    max_participants_per_event: number
    max_staff: number
    max_team_members?: number
    team_events_enabled: boolean
    registration_open: boolean
    email_template?: string | null
    features?: Record<string, boolean>
    created_at: string
}

export type OrganizationAdmin = {
    id: string
    user_id: string
    organization_id: string
    name: string
    email: string
    role: 'org_owner' | 'org_admin'
    permissions?: Record<string, boolean> | null
    created_at: string
}

export type SubscriptionPlan = {
    id: string
    plan_code: string
    plan_name: string
    price_monthly: number
    price_yearly: number
    max_events: number
    max_participants_per_event: number
    max_staff: number
    features: Record<string, boolean>
    is_active: boolean
}

export type Participant = {
    id: string
    organization_id: string
    participant_code?: string
    qr_code?: string
    name?: string
    full_name?: string
    register_number?: string
    email: string
    phone?: string | null
    college?: string
    college_name?: string | null
    department?: string
    year_of_study?: string
    team_name?: string | null
    registration_group_id?: string | null
    custom_data?: Record<string, any>
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
    qr_code_url?: string | null
    registration_datetime?: string
    qr_code_data?: string
    gate_entry_status?: boolean
    gate_entry_timestamp?: string | null
    gate_entry_scanned_by?: string | null
    // Normalized Event Data (Joined)
    events?: {
        event_id: string
        event_name?: string
        attendance_status: boolean
        scanned_at?: string | null
    }[]
    email_status?: 'pending' | 'sent' | 'failed'
    email_error?: string | null
    email_sent_at?: string | null
    created_at: string
}

export type Event = {
    id: string
    organization_id: string
    event_code: string
    event_name: string
    category: string
    venue: string
    event_datetime: string
    manager_name?: string | null
    manager_email?: string | null
    max_capacity?: number | null
    current_attendance: number
    is_registration_open: boolean
    created_at: string
}

export type Staff = {
    id: string
    organization_id: string
    user_id?: string | null
    name: string
    email: string
    role: 'gate_volunteer' | 'event_manager' | 'admin'
    assigned_event_id?: string | null
    is_active: boolean
    created_at: string
}

export type ScanLog = {
    id: string
    organization_id: string
    participant_id?: string | null
    scanned_by?: string | null
    scan_type: 'gate_entry' | 'event_attendance'
    event_id?: string | null
    scan_timestamp: string
    status: 'success' | 'already_scanned' | 'not_eligible' | 'entry_not_confirmed' | 'invalid_qr' | 'not_registered' | 'event_full' | 'wrong_event' | 'removed' | 'admin_update'
    error_message?: string | null
    device_info?: Record<string, any> | null
}
