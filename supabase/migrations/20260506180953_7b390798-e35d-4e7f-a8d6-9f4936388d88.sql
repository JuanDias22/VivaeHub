
-- =========================================================
-- Helper trigger function for updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- Clinics
-- =========================================================
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Profiles  (auth.users -> clinic)
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: get current user's clinic_id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.current_clinic_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =========================================================
-- Areas
-- =========================================================
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'oklch(0.62 0.16 250)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_areas_clinic ON public.areas(clinic_id);

-- =========================================================
-- Professionals
-- =========================================================
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'oklch(0.62 0.16 250)',
  anamnesis_template JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_professionals_clinic ON public.professionals(clinic_id);
CREATE TRIGGER trg_professionals_updated BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Patients
-- =========================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  birth_date DATE,
  is_contributor BOOLEAN NOT NULL DEFAULT false,
  contribution_amount NUMERIC(10,2),
  lgpt_consent BOOLEAN NOT NULL DEFAULT false,
  personal JSONB,
  health JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Appointments
-- =========================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 45,
  status TEXT NOT NULL DEFAULT 'pendente',
  modality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

-- =========================================================
-- Schedule blocks
-- =========================================================
CREATE TABLE public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_schedule_blocks_clinic ON public.schedule_blocks(clinic_id);

-- =========================================================
-- Patient notes
-- =========================================================
CREATE TABLE public.patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notes_patient ON public.patient_notes(patient_id);

-- =========================================================
-- Patient anamneses
-- =========================================================
CREATE TABLE public.patient_anamneses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  filled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_anamneses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_anamneses_patient ON public.patient_anamneses(patient_id);

-- =========================================================
-- Patient exams
-- =========================================================
CREATE TABLE public.patient_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_kb INTEGER,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_exams ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_exams_patient ON public.patient_exams(patient_id);

-- =========================================================
-- Contributions
-- =========================================================
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contributions_patient ON public.contributions(patient_id);

-- =========================================================
-- Finance entries
-- =========================================================
CREATE TABLE public.finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'outro',
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_finance_clinic ON public.finance_entries(clinic_id);

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- clinics: user can read their clinic via profile; signup trigger handles insert
CREATE POLICY "clinics_select_own" ON public.clinics FOR SELECT TO authenticated
  USING (id = public.current_clinic_id());
CREATE POLICY "clinics_update_own" ON public.clinics FOR UPDATE TO authenticated
  USING (id = public.current_clinic_id());

-- profiles: each user reads/updates their own
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Generic clinic-scoped policies for the rest
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'areas','professionals','patients','appointments','schedule_blocks',
    'patient_notes','patient_anamneses','patient_exams','contributions','finance_entries'
  ]) LOOP
    EXECUTE format($p$
      CREATE POLICY "%1$s_select_clinic" ON public.%1$s FOR SELECT TO authenticated
        USING (clinic_id = public.current_clinic_id());
      CREATE POLICY "%1$s_insert_clinic" ON public.%1$s FOR INSERT TO authenticated
        WITH CHECK (clinic_id = public.current_clinic_id());
      CREATE POLICY "%1$s_update_clinic" ON public.%1$s FOR UPDATE TO authenticated
        USING (clinic_id = public.current_clinic_id());
      CREATE POLICY "%1$s_delete_clinic" ON public.%1$s FOR DELETE TO authenticated
        USING (clinic_id = public.current_clinic_id());
    $p$, t);
  END LOOP;
END $$;

-- =========================================================
-- Signup trigger: create clinic + profile + seed areas/professionals
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_clinic_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  suffix INT := 0;
  clinic_name TEXT;
  ar_nut UUID; ar_enf UUID; ar_psi UUID; ar_pod UUID;
BEGIN
  clinic_name := COALESCE(NEW.raw_user_meta_data->>'clinic_name', split_part(NEW.email, '@', 1));
  base_slug := lower(regexp_replace(unaccent(clinic_name), '[^a-z0-9]+', '-', 'g'));
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

  -- Seed: areas
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Nutrição',   'nutricao',   'oklch(0.66 0.15 155)') RETURNING id INTO ar_nut;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Enfermagem', 'enfermagem', 'oklch(0.62 0.16 250)') RETURNING id INTO ar_enf;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Psicologia', 'psicologia', 'oklch(0.6 0.18 285)')  RETURNING id INTO ar_psi;
  INSERT INTO public.areas (clinic_id, name, key, color) VALUES
    (new_clinic_id, 'Podologia',  'podologia',  'oklch(0.65 0.14 220)') RETURNING id INTO ar_pod;

  -- Seed: professionals (one per area to start)
  INSERT INTO public.professionals (clinic_id, area_id, name, specialty, slug, color) VALUES
    (new_clinic_id, ar_nut, 'Dra. Marina Costa',  'Nutricionista', 'marina-costa',  'oklch(0.66 0.15 155)'),
    (new_clinic_id, ar_enf, 'Enf. André Mello',   'Enfermeiro',    'andre-mello',   'oklch(0.62 0.16 250)'),
    (new_clinic_id, ar_psi, 'Dra. Lívia Souza',   'Psicóloga',     'livia-souza',   'oklch(0.6 0.18 285)');

  RETURN NEW;
END $$;

-- unaccent is needed for slug; install if missing
CREATE EXTENSION IF NOT EXISTS unaccent;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
