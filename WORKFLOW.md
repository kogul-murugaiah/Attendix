# Attendix Application Workflow

This document outlines the core workflows of the Attendix system, covering the Participant, Admin, and Event Staff journeys.

## 1. Registration Process (Public)
**Actors**: Students/Participants
**Goal**: Register for events and obtain a QR code.

```mermaid
graph TD
    A[User visits /register] --> B{Selects Events}
    B -->|Registration Open| C[Fill Personal Details]
    B -->|Registration Closed| D[Button Disabled]
    C --> E[Submit Form]
    E --> F[Generate Unique Participant Code]
    F --> G[Generate QR Code]
    G --> H[Save to Database]
    H --> I[Show Success Page with QR]
    H --> J[Send Email with QR]
```

**Key Features**:
- **Event Validation**: Users cannot register for closed events.
- **Duplicate Check**: Prevents selecting the same event multiple times.
- **Real-time Feedback**: Immediate QR code generation.

---

## 2. Event Management (Admin)
**Actors**: Administrators
**Goal**: Manage event details and control registration access.

```mermaid
graph LR
    A[Admin Login] --> B[Dashboard]
    B --> C[Events Tab]
    C --> D[Add New Event]
    C --> E[Edit Existing Event]
    D --> F[Set Date, Venue, Capacity]
    E --> G[Toggle 'Registration Open']
    G -->|Set to False| H[Registration Form Updates Instantly]
```

**Key Features**:
- **Registration Control**: Open/Close registrations with a toggle.
- **Capacity Tracking**: Monitor current vs. max capacity.

---

## 3. Event Day Operations (Staff/Scanner)
**Actors**: Gate Volunteers, Event Managers
**Goal**: Verify participants and track attendance.

```mermaid
graph TD
    A[Staff Login] --> B[Select Role]
    B -->|Gate Volunteer| C[Gate Entry Scanner]
    B -->|Event Manager| D[Event Attendance Scanner]
    
    C --> E{Scan QR Code}
    D --> E
    
    E --> F{Validate Participant}
    F -->|Valid| G[Mark Status: Success]
    F -->|Already Scanned| H[Mark Status: Duplicate Warning]
    F -->|Not Registered| I[Mark Status: Error]
    
    G --> J[Log to 'scan_logs']
    J --> K[Update Admin Dashboard (Real-time)]
    J --> L[Increment Event Attendance Count]
```

**Key Features**:
- **Real-time Logs**: Admin dashboard updates instantly when a scan occurs (`supabase_realtime`).
- **Validation Logic**: Checks if the participant is registered for the specific event being scanned.
- **Flow Control**: Gate entry is recorded separately from specific event attendance.

---

## 4. Real-time Monitoring (Admin)
**Actors**: Administrators
**Goal**: Monitor ongoing event activity.

1.  **View Logs**: The "Logs" tab shows a live feed of all successful and failed scans.
2.  **Live Stats**: Event cards show real-time attendance progress bars.

```mermaid
sequenceDiagram
    participant Scanner Device
    participant Database
    participant Admin Dashboard
    
    Scanner Device->>Database: Insert Scan Log
    Database->>Admin Dashboard: Realtime Event (INSERT)
    Admin Dashboard->>Admin Dashboard: Prepend new log to list
```
