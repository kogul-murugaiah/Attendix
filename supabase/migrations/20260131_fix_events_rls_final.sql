-- Allow organization admins to view their own records in organization_admins table
-- This is essential because the RLS policy for 'events' subqueries this table.
-- Without this, the subquery returns no rows for regular admins, causing an RLS violation on insert.
DROP POLICY IF EXISTS "Admins can view own org admin record" ON organization_admins;

CREATE POLICY "Admins can view own org admin record" ON organization_admins
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Re-verify and ensure events policy is robust
-- This policy allows full access (Select, Insert, Update, Delete) for Organization Admins.
DROP POLICY IF EXISTS "Org admins can manage events" ON "public"."events";

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

-- Ensure Staff (Event Managers) can also manage events they are assigned to or if they are admins
DROP POLICY IF EXISTS "Staff admins can manage events" ON "public"."events";

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
