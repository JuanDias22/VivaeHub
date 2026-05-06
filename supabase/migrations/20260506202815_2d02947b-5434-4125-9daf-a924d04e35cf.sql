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

  INSERT INTO public.clinics (name, slug, owner_email)
    VALUES (clinic_name, final_slug, NEW.email)
    RETURNING id INTO new_clinic_id;

  INSERT INTO public.profiles (id, clinic_id, email, display_name)
    VALUES (NEW.id, new_clinic_id, NEW.email, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Nutrição',   'nutricao',   'oklch(0.66 0.15 155)'),
    (new_clinic_id, 'Enfermagem', 'enfermagem', 'oklch(0.62 0.16 250)'),
    (new_clinic_id, 'Psicologia', 'psicologia', 'oklch(0.6 0.18 285)'),
    (new_clinic_id, 'Podologia',  'podologia',  'oklch(0.65 0.14 220)');

  RETURN NEW;
END $function$;

-- Ensure trigger exists on auth.users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;