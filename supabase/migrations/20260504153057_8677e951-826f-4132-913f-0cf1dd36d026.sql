-- Hide upcoming track list from clients to prevent cheating in versus matches.
-- Server functions use the service role and bypass this restriction.
REVOKE SELECT (track_ids) ON public.versus_matches FROM anon, authenticated;