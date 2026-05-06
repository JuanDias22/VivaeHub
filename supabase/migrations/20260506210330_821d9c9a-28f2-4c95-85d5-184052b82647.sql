-- Enable realtime for appointment-related tables so changes from anonymous
-- portal bookings are immediately visible in authenticated /app screens.
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER TABLE public.schedule_blocks REPLICA IDENTITY FULL;
ALTER TABLE public.professionals REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;     EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_blocks; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.professionals; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;