-- Remove the broken recursive policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Create the correct policy using is_admin() function
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

-- Also make sure is_admin() function exists and is correct
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;