
-- Fix: search_path explicit + restrict execution
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.current_clinic_id() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.current_clinic_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_clinic_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Move unaccent extension out of public
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Update handle_new_user to use qualified unaccent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  new_clinic_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
  clinic_name TEXT;
  ar_nut UUID; ar_enf UUID; ar_psi UUID; ar_pod UUID;
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

  INSERT INTO public.clinics (name, slug, owner_email)
    VALUES (clinic_name, final_slug, NEW.email)
    RETURNING id INTO new_clinic_id;

  INSERT INTO public.profiles (id, clinic_id, email, display_name)
    VALUES (NEW.id, new_clinic_id, NEW.email, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Nutrição',   'nutricao',   'oklch(0.66 0.15 155)') RETURNING id INTO ar_nut;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Enfermagem', 'enfermagem', 'oklch(0.62 0.16 250)') RETURNING id INTO ar_enf;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Psicologia', 'psicologia', 'oklch(0.6 0.18 285)')  RETURNING id INTO ar_psi;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Podologia',  'podologia',  'oklch(0.65 0.14 220)') RETURNING id INTO ar_pod;

  INSERT INTO public.professionals (clinic_id, area_id, name, specialty, slug, color) VALUES
    (new_clinic_id, ar_nut, 'Dra. Marina Costa',  'Nutricionista', 'marina-costa',  'oklch(0.66 0.15 155)'),
    (new_clinic_id, ar_enf, 'Enf. André Mello',   'Enfermeiro',    'andre-mello',   'oklch(0.62 0.16 250)'),
    (new_clinic_id, ar_psi, 'Dra. Lívia Souza',   'Psicóloga',     'livia-souza',   'oklch(0.6 0.18 285)');

  RETURN NEW;
END $$;
