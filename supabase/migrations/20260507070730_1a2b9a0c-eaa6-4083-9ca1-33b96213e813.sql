-- Enforce plan-based limit on professionals count per clinic
CREATE OR REPLACE FUNCTION public.enforce_professionals_plan_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_plan clinic_plan;
  current_count int;
  plan_limit int;
BEGIN
  SELECT plan INTO current_plan FROM public.clinics WHERE id = NEW.clinic_id;
  IF current_plan IS NULL THEN
    RETURN NEW;
  END IF;

  plan_limit := CASE current_plan
    WHEN 'trial' THEN 5
    WHEN 'basic' THEN 5
    WHEN 'plus'  THEN 10
    WHEN 'pro'   THEN 2147483647
    ELSE 5
  END;

  SELECT count(*) INTO current_count
  FROM public.professionals
  WHERE clinic_id = NEW.clinic_id;

  IF current_count >= plan_limit THEN
    RAISE EXCEPTION 'Limite de profissionais do plano % atingido (%).', current_plan, plan_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_professionals_plan_limit ON public.professionals;
CREATE TRIGGER trg_enforce_professionals_plan_limit
BEFORE INSERT ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_professionals_plan_limit();