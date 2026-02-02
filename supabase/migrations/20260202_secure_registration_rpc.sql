-- 1. Secure RPC for Registration
-- This function runs with SECURITY DEFINER, allowing anonymous users to register
-- without needing wide-open SELECT permissions on the student_registrations table.
CREATE OR REPLACE FUNCTION public.register_participant(
    p_organization_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_college TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_year_of_study TEXT DEFAULT NULL,
    p_event_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_team_name TEXT DEFAULT NULL,
    p_registration_group_id UUID DEFAULT NULL,
    p_custom_data JSONB DEFAULT '{}'::jsonb,
    p_form_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, qr_code TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public -- Best practice for security definer functions
AS $$
DECLARE
    v_participant_id UUID;
    v_qr_code TEXT;
    v_eid UUID;
BEGIN
    -- Insert student registration
    INSERT INTO public.student_registrations (
        organization_id, 
        form_id,
        full_name, 
        email, 
        phone, 
        college, 
        department, 
        year_of_study, 
        status, 
        team_name, 
        registration_group_id,
        custom_data
    ) VALUES (
        p_organization_id, 
        p_form_id,
        p_full_name, 
        p_email, 
        p_phone, 
        p_college, 
        p_department, 
        p_year_of_study, 
        'pending', 
        p_team_name, 
        p_registration_group_id,
        p_custom_data
    )
    RETURNING student_registrations.id, student_registrations.qr_code INTO v_participant_id, v_qr_code;

    -- Insert event registrations if any
    IF p_event_ids IS NOT NULL AND array_length(p_event_ids, 1) > 0 THEN
        -- Ensure unique IDs and non-null values
        FOR v_eid IN SELECT DISTINCT val FROM unnest(p_event_ids) AS val WHERE val IS NOT NULL
        LOOP
            INSERT INTO public.event_registrations (participant_id, event_id)
            VALUES (v_participant_id, v_eid);
        END LOOP;
    END IF;

    RETURN QUERY SELECT v_participant_id, v_qr_code;
END;
$$;

-- 2. Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.register_participant TO anon, authenticated;

-- 3. Ensure the events table allows public viewing of open events (so it shows in the form)
-- Drop existing policy if it might conflict, but usually we just add/refine.
DROP POLICY IF EXISTS "Allow public view open events" ON public.events;
CREATE POLICY "Allow public view open events" ON public.events
FOR SELECT TO anon, authenticated
USING (is_registration_open = true);

-- 4. Clean up any existing INSERT policy that might be too permissive or redundant
-- We keep the existing "Allow public insert" policy on student_registrations 
-- to allow direct inserts if needed, but our RPC is the preferred way.
-- However, we definitely DO NOT add a SELECT policy for anon on student_registrations.
