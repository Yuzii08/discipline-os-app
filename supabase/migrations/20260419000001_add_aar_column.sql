/* Migration: Add AAR Verdict column to mission completions */

ALTER TABLE public.mission_completions 
ADD COLUMN IF NOT EXISTS aar_verdict TEXT;

COMMENT ON COLUMN public.mission_completions.aar_verdict IS 'The clinical forensic verdict from the Cold Judge AI after a mission audit.';
