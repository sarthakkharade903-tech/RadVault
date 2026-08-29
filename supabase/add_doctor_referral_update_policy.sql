-- ===========================================================================
-- RADVAULT ADD DOCTOR UPDATE POLICY ON REFERRALS
-- ===========================================================================

BEGIN;

DROP POLICY IF EXISTS "Doctors update scoped referrals" ON public.referrals;

CREATE POLICY "Doctors update scoped referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.facility_id = referrals.destination_facility_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.user_id = auth.uid()
        AND d.facility_id = referrals.destination_facility_id
    )
  );

COMMIT;
