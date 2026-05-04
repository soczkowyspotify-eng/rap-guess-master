
DROP VIEW IF EXISTS public.versus_matches_public;

REVOKE SELECT (track_ids) ON public.versus_matches FROM anon, authenticated;
