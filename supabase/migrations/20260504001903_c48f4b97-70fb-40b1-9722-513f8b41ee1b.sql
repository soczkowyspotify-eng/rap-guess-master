CREATE TABLE public.track_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.track_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read track_suggestions"
ON public.track_suggestions FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert track_suggestions"
ON public.track_suggestions FOR INSERT
WITH CHECK (
  length(artist) between 1 and 200
  and length(title) between 1 and 200
  and (link is null or length(link) <= 500)
);