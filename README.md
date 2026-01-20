# Attendix - Symposium Attendance & Event Management System

**Attendix** is a modern, real-time, multi-tenant web application designed to streamline the management of symposiums, college events, and conferences. It handles the entire lifecycle of an event: from public student registration and QR code generation to gate check-ins and real-time event attendance tracking.

Built with **Next.js 16**, **Supabase**, and **Tailwind CSS**.

## 🚀 Key Features

### 🏢 Multi-Tenancy & Organization Management
*   **Organization Isolation**: Support for multiple organizations (colleges/companies) within a single instance. Data is strictly isolated via Row Level Security (RLS).
*   **Role-Based Access Control (RBAC)**:
    *   **Super Admin**: Manage platform-wide settings and organizations.
    *   **Org Admin**: Full control over a specific organization's events, staff, and data.
    *   **Staff**: specialized access for gatekeeping and event scanning.

### 📝 Smart Registration System
*   **Public Registration Portal**: Customizable public-facing pages for student registration (`/[org]/register`).
*   **Dynamic Forms**: Support for collecting student details (College, Dept, Year) and Event Preferences.
*   **Instant QR Generation**: Automatically generates a unique, signed QR code for every participant upon registration.
*   **Sequential ID Assignment**: Smart trigger-based generation of participant IDs (e.g., `XPL-001`, `XPL-002`) based on organization prefixes.

### ⚡ Real-Time Dashboards (WebSockets)
*   **Global Broadcast System**: A custom architecture using Supabase Channels to ensure **instant** data synchronization across all devices.
*   **Reception Console**: Real-time view of total registrations, gate check-in counts, and pending arrivals. Updates instantly when a student registers or enters.
*   **Admin Dashboard**: Live feed of participants, improved real-time "Attendance" & "Participants" tabs that reflect changes without refreshing.

### 📱 QR Scanning & Attendance
*   **Gate Management**: Dedicated "Reception Console" for scanning tickets at the main entrance. Validates entry status and timestamps.
*   **Event-Specific Attendance**: "Event Scanner" mode allows staff to track attendance for individual workshops or events using the same student QR code.
*   **Anti-Duplication**: Prevents double check-ins and warns staff instantly.

### 📊 Data & Reporting
*   **CSV Exports**: Export participant lists and attendance logs for external processing.
*   **Live Stats**: Visual counters for turnout percentage and event popularity.

## 🛠️ Technology Stack
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
*   **Language**: TypeScript
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Auth**: Supabase Auth (SSR, Middleware protection)
*   **Realtime**: Supabase Realtime (Postgres Changes + Broadcast Channels)
*   **Styling**: Tailwind CSS + Shadcn/UI (Radix Primitives)
*   **Icons**: Lucide React

## 🏗️ Architecture Highlights
*   **Hybrid Real-time Strategy**: Uses a combination of Database Replication (for reliability) and Global Broadcasts (for speed) to ensure the UI never feels stale.
*   **RLS-First Security**: All database queries are protected by Row Level Security policies, ensuring users can only access data belonging to their organization.

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or bun

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/attendix.git
    cd attendix
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Environment Variables (`.env.local`):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📜 License
This project is proprietary software custom-built for symposium management.
