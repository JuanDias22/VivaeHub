
-- 1. Enum de papéis
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'recepcao', 'profissional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, clinic_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
    AND clinic_id = public.current_clinic_id()
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'recepcao' THEN 2
    WHEN 'profissional' THEN 3
  END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_professional_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT professional_id FROM public.user_roles
  WHERE user_id = auth.uid()
    AND clinic_id = public.current_clinic_id()
    AND role = 'profissional'
  LIMIT 1
$$;

-- 4. Policies para user_roles
DROP POLICY IF EXISTS user_roles_select_self ON public.user_roles;
CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (clinic_id = public.current_clinic_id() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (clinic_id = public.current_clinic_id() AND public.has_role(auth.uid(), 'admin'));

-- 5. Trigger de signup: novo dono = admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
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

  INSERT INTO public.user_roles (user_id, clinic_id, role)
    VALUES (NEW.id, new_clinic_id, 'admin');

  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Nutrição',   'nutricao',   'oklch(0.66 0.15 155)'),
    (new_clinic_id, 'Enfermagem', 'enfermagem', 'oklch(0.62 0.16 250)'),
    (new_clinic_id, 'Psicologia', 'psicologia', 'oklch(0.6 0.18 285)'),
    (new_clinic_id, 'Podologia',  'podologia',  'oklch(0.65 0.14 220)');

  RETURN NEW;
END $function$;

-- Garantir que o trigger exista
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill: cada profile existente vira admin da sua clínica
INSERT INTO public.user_roles (user_id, clinic_id, role)
SELECT p.id, p.clinic_id, 'admin'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.clinic_id = p.clinic_id
)
ON CONFLICT DO NOTHING;

-- 7. Tighten RLS: profissional só vê o que é dele
DROP POLICY IF EXISTS appointments_select_clinic ON public.appointments;
CREATE POLICY appointments_select_clinic ON public.appointments
  FOR SELECT TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND (
      public.current_user_role() <> 'profissional'
      OR professional_id = public.current_user_professional_id()
    )
  );

DROP POLICY IF EXISTS appointments_update_clinic ON public.appointments;
CREATE POLICY appointments_update_clinic ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND (
      public.current_user_role() <> 'profissional'
      OR professional_id = public.current_user_professional_id()
    )
  );

DROP POLICY IF EXISTS appointments_delete_clinic ON public.appointments;
CREATE POLICY appointments_delete_clinic ON public.appointments
  FOR DELETE TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND public.current_user_role() IN ('admin', 'recepcao')
  );

DROP POLICY IF EXISTS patients_select_clinic ON public.patients;
CREATE POLICY patients_select_clinic ON public.patients
  FOR SELECT TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND (
      public.current_user_role() <> 'profissional'
      OR professional_id = public.current_user_professional_id()
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = patients.id
          AND a.professional_id = public.current_user_professional_id()
      )
    )
  );

DROP POLICY IF EXISTS patients_delete_clinic ON public.patients;
CREATE POLICY patients_delete_clinic ON public.patients
  FOR DELETE TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND public.current_user_role() IN ('admin', 'recepcao')
  );

DROP POLICY IF EXISTS professionals_delete_clinic ON public.professionals;
CREATE POLICY professionals_delete_clinic ON public.professionals
  FOR DELETE TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS finance_entries_select_clinic ON public.finance_entries;
CREATE POLICY finance_entries_select_clinic ON public.finance_entries
  FOR SELECT TO authenticated
  USING (
    clinic_id = public.current_clinic_id()
    AND public.current_user_role() IN ('admin', 'recepcao')
  );
