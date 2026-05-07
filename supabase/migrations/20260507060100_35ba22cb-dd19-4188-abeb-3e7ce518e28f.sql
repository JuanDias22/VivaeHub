
-- Plan enum
DO $$ BEGIN
  CREATE TYPE public.clinic_plan AS ENUM ('trial', 'basic', 'pro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS plan public.clinic_plan NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days');

-- Backfill existing clinics that may have older defaults
UPDATE public.clinics
  SET trial_ends_at = COALESCE(trial_ends_at, now() + interval '14 days')
  WHERE trial_ends_at IS NULL;

-- Update handle_new_user to also stamp trial info on new clinics
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_clinic_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
  clinic_name TEXT;
BEGIN
  clinic_name := COALESCE(NEW.raw_user_meta_data->>'clinic_name', split_part(NEW.email, '@', 1));
  base_slug := lower(regexp_replace(extensions.unaccent(clinic_name), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'clinica'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.clinics WHERE slug = final_slug) LOOP
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  END LOOP;

  INSERT INTO public.clinics (name, slug, owner_email, plan, trial_ends_at)
    VALUES (clinic_name, final_slug, NEW.email, 'trial', now() + interval '14 days')
    RETURNING id INTO new_clinic_id;

  INSERT INTO public.profiles (id, clinic_id, email, display_name)
    VALUES (NEW.id, new_clinic_id, NEW.email, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.user_roles (user_id, clinic_id, role)
    VALUES (NEW.id, new_clinic_id, 'admin');

  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Nutrição',   'nutricao',   'oklch(0.66 0.15 155)'),
    (new_clinic_id, 'Enfermagem', 'enfermagem', 'oklch(0.62 0.16 250)'),
    (new_clinic_id, 'Psicologia', 'psicologia', 'oklch(0.6 0.18 285)'),
    (new_clinic_id, 'Podologia',  'podologia',  'oklch(0.65 0.14 220)');

  RETURN NEW;
END $function$;

-- Restrict updates to clinic plan: only admins of the clinic can change plan/trial fields.
-- The existing clinics_update_own already lets the owner update, so we tighten via a trigger
-- that prevents non-admins from changing plan or trial_ends_at.
CREATE OR REPLACE FUNCTION public.guard_clinic_plan_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.plan IS DISTINCT FROM OLD.plan)
     OR (NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at) THEN
    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change clinic plan';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS clinics_guard_plan ON public.clinics;
CREATE TRIGGER clinics_guard_plan
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.guard_clinic_plan_update();
