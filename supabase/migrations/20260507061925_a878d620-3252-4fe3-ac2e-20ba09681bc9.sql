CREATE OR REPLACE FUNCTION public.guard_clinic_plan_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text;
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan)
     OR (NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at) THEN
    BEGIN
      jwt_role := current_setting('request.jwt.claim.role', true);
    EXCEPTION WHEN OTHERS THEN
      jwt_role := NULL;
    END;
    -- Allow service_role (webhooks via supabaseAdmin) to update plan freely.
    IF jwt_role = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins or service role can change clinic plan';
    END IF;
  END IF;
  RETURN NEW;
END $function$;