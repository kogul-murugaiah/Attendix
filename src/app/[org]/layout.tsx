'use client';

import { OrganizationProvider } from '@/context/organization-context';
import { Toaster } from 'sonner';

export default function OrgLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            {children}
            <Toaster />
        </OrganizationProvider>
    );
}
