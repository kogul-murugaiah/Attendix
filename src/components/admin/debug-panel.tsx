'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganization } from '@/context/organization-context';

export default function DebugPanel() {
    const { organization } = useOrganization();
    const supabase = createClient();
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (organization) runDiagnostics();
    }, [organization]);

    const runDiagnostics = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Check Admin Record
        const { data: admin, error: adminError } = await supabase
            .from('organization_admins')
            .select('*')
            .eq('organization_id', organization?.id)
            .eq('user_id', user?.id);

        // 2. Check Events Raw
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('organization_id', organization?.id);

        // 3. Check Policy Existence (via rpc if possible, else infer)
        // We can't check policies directly from client easily without getting meta info which is restricted.

        setDebugInfo({
            user_id: user?.id,
            org_id: organization?.id,
            admin_check: { data: admin, error: adminError },
            events_check: { data: events, error: eventsError, count: events?.length },
            timestamp: new Date().toISOString()
        });
    };

    if (!visible) return (
        <button
            onClick={() => setVisible(true)}
            className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs opacity-50 hover:opacity-100 z-50"
        >
            Debug
        </button>
    );

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-[500px] overflow-auto bg-black/90 text-green-400 p-4 rounded-xl border border-green-500/30 text-xs font-mono z-50 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">Diagnostics</h3>
                <div className="flex gap-2">
                    <button onClick={runDiagnostics} className="px-2 py-1 bg-white/10 rounded hover:bg-white/20">Refresh</button>
                    <button onClick={() => setVisible(false)} className="text-gray-500 hover:text-white">Close</button>
                </div>
            </div>
            <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(debugInfo, null, 2)}
            </pre>
        </div>
    );
}
