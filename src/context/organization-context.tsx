'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { Organization } from '@/lib/types';

interface OrgContextType {
    organization: Organization | null;
    loading: boolean;
    hasFeature: (feature: string) => boolean;
}

const OrgContext = createContext<OrgContextType>({
    organization: null,
    loading: true,
    hasFeature: () => false
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const params = useParams();
    const orgSlug = params?.org as string;

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgSlug) {
            setLoading(false);
            return;
        }

        // Only fetch if orgSlug is present and different or initially
        const fetchOrg = async () => {
            try {
                const { data } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('org_code', orgSlug)
                    .single();

                if (data) {
                    // Need to cast the JSON type correctly if TS complains, but for now simple assignment
                    setOrganization(data as Organization);
                } else {
                    console.error('Organization not found');
                    setOrganization(null);
                }
            } catch (error) {
                console.error('Error fetching org:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrg();
    }, [orgSlug, supabase]);

    const hasFeature = (feature: string) => {
        return organization?.features?.[feature] === true;
    };

    return (
        <OrgContext.Provider value={{ organization, loading, hasFeature }}>
            {children}
        </OrgContext.Provider>
    );
}

export const useOrganization = () => useContext(OrgContext);
