
-- Restrict SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Tighten presence update policy: only allow updating recently-active rows (anti-griefing on old rows)
DROP POLICY "Public can update presence" ON public.presence_pings;
CREATE POLICY "Public can update recent presence" ON public.presence_pings
  FOR UPDATE USING (last_seen > now() - interval '10 minutes')
  WITH CHECK (length(nick) BETWEEN 1 AND 50);
