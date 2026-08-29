-- ===========================================================================
-- RADVAULT RLS POLICY RECURSION REMEDIATION
-- ===========================================================================

BEGIN;

-- 1. Create a Security Definer function to check if a patient is referred to a user's facility.
-- This function runs with superuser privileges (SECURITY DEFINER) and bypasses RLS
-- checks on the referrals table, breaking the infinite recursion loop.
CREATE OR REPLACE FUNCTION public.check_patient_referred_to_staff(p_patient_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.referrals r
    LEFT JOIN public.hospital_staff hs ON hs.facility_id = r.destination_facility_id
    LEFT JOIN public.doctors d ON d.facility_id = r.destination_facility_id
    WHERE (hs.user_id = p_user_id OR d.user_id = p_user_id)
      AND r.patient_id = p_patient_id::text
  );
END;
$$;

-- 2. Drop the recursive policy from public.patients
DROP POLICY IF EXISTS "Facility staff select referred patients" ON public.patients;

-- 3. Re-create the policy using the security definer function
CREATE POLICY "Facility staff select referred patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.check_patient_referred_to_staff(id, auth.uid())
  );

COMMIT;
