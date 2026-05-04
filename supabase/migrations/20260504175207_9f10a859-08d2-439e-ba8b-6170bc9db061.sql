ALTER TABLE public.versus_matches
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS rematch_requested_by text,
  ADD COLUMN IF NOT EXISTS rematch_match_id uuid;

ALTER TABLE public.versus_matches DROP CONSTRAINT IF EXISTS versus_matches_mode_chk;
ALTER TABLE public.versus_matches ADD CONSTRAINT versus_matches_mode_chk CHECK (mode IN ('classic','blitz'));