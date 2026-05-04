CREATE TABLE public.legacy_song_overrides (
  song_id TEXT PRIMARY KEY,
  start_sec INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_song_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read legacy_song_overrides"
ON public.legacy_song_overrides FOR SELECT
USING (true);