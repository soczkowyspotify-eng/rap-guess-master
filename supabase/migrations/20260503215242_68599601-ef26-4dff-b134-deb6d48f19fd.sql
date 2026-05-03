
CREATE TABLE public.yt_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  artist text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yt_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read yt_tracks"
  ON public.yt_tracks FOR SELECT
  USING (true);
