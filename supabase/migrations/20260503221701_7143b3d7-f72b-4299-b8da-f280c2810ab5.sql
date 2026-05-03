-- Albumy YT zarządzane przez admina
CREATE TABLE public.yt_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_url text NOT NULL,
  artist text NOT NULL,
  title text NOT NULL,
  year integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.yt_album_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.yt_albums(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  artist text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX yt_album_tracks_album_idx ON public.yt_album_tracks(album_id, position);

ALTER TABLE public.yt_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yt_album_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read yt_albums"
  ON public.yt_albums FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can read yt_album_tracks"
  ON public.yt_album_tracks FOR SELECT TO public USING (true);
