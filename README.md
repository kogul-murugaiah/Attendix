# Attendix - Symposium Attendance System 🚀

**Attendix** is a modern, full-stack attendance and event management system designed for college symposiums. Built with **Next.js 14**, **Supabase**, and **Tailwind CSS**, it streamlines the entire process from participant registration to real-time event tracking.

## ✨ Features

- **📱 Public Registration**: Seamless registration flow with email notifications and automated QR code generation.
- **🔐 Role-Based Access**: Secure login for different staff roles:
  - **Receptionist**: Manages main gate entry.
  - **Event Manager**: Tracks attendance for specific events.
  - **Admin**: Full control over users, events, and data.
- **⚡ Real-Time Updates**: Instant synchronization across all dashboards using Supabase Realtime.
- **📸 Integrated Scanning**: Built-in QR code scanner for rapid check-ins (works on mobile and desktop).
- **📊 Comprehensive Dashboards**:
  - **Admin Console**: Analytics, logs, and management of participants/staff.
  - **Reception Console**: Track total footfall and gate entries.
  - **Event Dashboard**: Manage event-specific attendance and capacity.
- **🎨 Modern UI/UX**: "Gen-Z Professional" dark theme with glassmorphism and smooth animations.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **QR Tools**: `qrcode` (Generation) & `html5-qrcode` (Scanning)
- **Icons**: `lucide-react`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kogul-murugaiah/Attendix.git
    cd Attendix
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Database Setup**
    Run the SQL scripts provided in the `supabase/` folder in your Supabase SQL Editor to set up the schema and security policies.
    - Start with `supabase/schema.sql`

5.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

| Role | Access | Description |
| :--- | :--- | :--- |
| **Participant** | `/register` | Register for the symposium and get a unique QR code. |
| **Staff** | `/login` | Access the staff portal. Redirects based on role. |
| **Reception** | `/reception` | Scan participants at the main gate. Verify registration. |
| **Event Manager** | `/event-scanner` | Scan participants for specific events. Mark attendance. |
| **Admin** | `/admin` | Overview stats, manage database, view logs, create staff. |

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
