-- Enable RLS
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be conflicting or insufficient
DROP POLICY IF EXISTS "Org admins can manage events" ON "public"."events";
DROP POLICY IF EXISTS "Staff admins can manage events" ON "public"."events";
DROP POLICY IF EXISTS "Org admins can insert events" ON "public"."events";

-- Re-create comprehensive policy for Organization Admins
CREATE POLICY "Org admins can manage events" ON "public"."events"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_admins
            WHERE organization_admins.organization_id = events.organization_id
            AND organization_admins.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_admins
            WHERE organization_admins.organization_id = events.organization_id
            AND organization_admins.user_id = auth.uid()
        )
    );

-- Re-create comprehensive policy for Staff Admins/Managers
CREATE POLICY "Staff admins can manage events" ON "public"."events"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.organization_id = events.organization_id
            AND staff.user_id = auth.uid()
            AND staff.role IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.organization_id = events.organization_id
            AND staff.user_id = auth.uid()
            AND staff.role IN ('admin', 'event_manager')
        )
    );

-- Grant specific permissions just in case
GRANT ALL ON TABLE "public"."events" TO authenticated;
GRANT ALL ON TABLE "public"."events" TO service_role;
