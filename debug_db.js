const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
    const envPath = path.resolve('.env.local');
    if (!fs.existsSync(envPath)) {
        console.error(".env.local not found!");
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '');
            env[key] = value;
        }
    });

    console.log("URL:", env.NEXT_PUBLIC_SUPABASE_URL ? "Found" : "Missing");
    console.log("Key:", env.SUPABASE_SERVICE_ROLE_KEY ? "Found" : "Missing");

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing keys in .env.local");
        process.exit(1);
    }

    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    async function run() {
        console.log("\n--- Organizations ---");
        const { data: orgs, error: orgError } = await supabase.from('organizations').select('id, org_name, org_code');
        if (orgError) console.error(orgError);
        else {
            orgs.forEach(o => console.log("ORG_CODE:", o.org_code));
        }

        console.log("\n--- Organization Admins ---");
        const { data: admins, error } = await supabase.from('organization_admins').select('*');
        if (error) console.error(error);
        else {
            console.log(`Count: ${admins.length}`);
            // console.table(admins); // Conserve space
        }

        console.log("\n--- Events ---");
        const { data: events, error: eError } = await supabase.from('events').select('id, event_name, organization_id');
        if (eError) console.error(eError);
        else {
            console.log(`Count: ${events.length}`);
            console.table(events);
        }
    }

    run();

} catch (e) {
    console.error(e);
}
