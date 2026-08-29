-- ===========================================================================
-- RADVAULT AUTOMATIC CONSULTATION TO ENCOUNTER PROPAGATION TRIGGER
-- ===========================================================================

BEGIN;

-- 1. Create the propagation function
CREATE OR REPLACE FUNCTION public.propagate_consultation_to_encounter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.encounters
  SET 
    follow_up_date = NEW.follow_up_recommended_date,
    follow_up_reason = 'Diagnosis: ' || COALESCE(NEW.diagnosis, 'Referral followup') || '. Plan: ' || COALESCE(NEW.treatment_advice, 'Consultation signed.'),
    follow_up_completed = false
  WHERE referral_id = NEW.referral_id;

  RETURN NEW;
END;
$$;

-- 2. Drop the trigger if it already exists
DROP TRIGGER IF EXISTS trg_propagate_consultation_to_encounter ON public.consultations;

-- 3. Create the trigger on public.consultations
CREATE TRIGGER trg_propagate_consultation_to_encounter
  AFTER INSERT ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_consultation_to_encounter();

COMMIT;
