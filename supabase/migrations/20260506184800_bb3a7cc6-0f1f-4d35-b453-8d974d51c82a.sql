-- Allow anonymous (portal público) read of clinic basics by slug
CREATE POLICY "clinics_public_read" ON public.clinics
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "areas_public_read" ON public.areas
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "professionals_public_read" ON public.professionals
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow anonymous portal submissions
CREATE POLICY "patients_public_insert" ON public.patients
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "appointments_public_insert" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "schedule_blocks_public_read" ON public.schedule_blocks
  FOR SELECT TO anon, authenticated
  USING (true);
