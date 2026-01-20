-- Trigger Function to sync Organization Admin to Staff
CREATE OR REPLACE FUNCTION public.sync_org_admin_to_staff()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a staff record already exists for this user in this organization
    IF NOT EXISTS (
        SELECT 1 FROM public.staff 
        WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id
    ) THEN
        -- Insert new staff record
        INSERT INTO public.staff (
            user_id,
            organization_id,
            name,
            email,
            role,
            is_active
        ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            NEW.name,
            NEW.email,
            'admin', -- Default role for synced admins
            true
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_org_admin_created ON public.organization_admins;
CREATE TRIGGER on_org_admin_created
AFTER INSERT ON public.organization_admins
FOR EACH ROW
EXECUTE FUNCTION public.sync_org_admin_to_staff();

-- Backfill existing admins who are missing from staff
INSERT INTO public.staff (user_id, organization_id, name, email, role, is_active)
SELECT 
    oa.user_id, 
    oa.organization_id, 
    oa.name, 
    oa.email, 
    'admin', 
    true
FROM public.organization_admins oa
WHERE NOT EXISTS (
    SELECT 1 FROM public.staff s 
    WHERE s.user_id = oa.user_id AND s.organization_id = oa.organization_id
);
