-- Add 'plus' tier to clinic_plan enum
ALTER TYPE public.clinic_plan ADD VALUE IF NOT EXISTS 'plus';
