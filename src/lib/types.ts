export type Participant = {
    id: string
    participant_code: string
    name: string
    email: string
    phone: string
    college: string
    department: string
    year_of_study: string
    registration_datetime: string
    qr_code_data: string
    gate_entry_status: boolean
    gate_entry_timestamp?: string | null
    event1_id?: string | null
    event1_attendance: boolean
    event1_timestamp?: string | null
    event2_id?: string | null
    event2_attendance: boolean
    event2_timestamp?: string | null
    event3_id?: string | null
    event3_attendance: boolean
    event3_timestamp?: string | null
    created_at: string
}

export type Event = {
    id: string
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
    user_id?: string | null
    name: string
    email: string
    role: 'gate_volunteer' | 'event_manager' | 'admin'
    assigned_event_id?: string | null
    created_at: string
}

export type ScanLog = {
    id: string
    participant_id?: string | null
    scanned_by?: string | null
    scan_type: 'gate_entry' | 'event_attendance'
    event_id?: string | null
    scan_timestamp: string
    status: 'success' | 'already_scanned' | 'not_eligible' | 'entry_not_confirmed' | 'invalid_qr'
    error_message?: string | null
}
