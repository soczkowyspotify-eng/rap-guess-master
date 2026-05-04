
-- Tabela meczów Versus 1v1
CREATE TABLE public.versus_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_player_id text NOT NULL,
  host_nick text NOT NULL,
  guest_player_id text,
  guest_nick text,
  status text NOT NULL DEFAULT 'lobby',
  current_round int NOT NULL DEFAULT 0,
  host_score numeric(3,1) NOT NULL DEFAULT 0,
  guest_score numeric(3,1) NOT NULL DEFAULT 0,
  track_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT versus_matches_status_chk CHECK (status IN ('lobby','playing','finished')),
  CONSTRAINT versus_matches_host_nick_len CHECK (char_length(host_nick) BETWEEN 1 AND 24),
  CONSTRAINT versus_matches_guest_nick_len CHECK (guest_nick IS NULL OR char_length(guest_nick) BETWEEN 1 AND 24)
);

ALTER TABLE public.versus_matches ENABLE ROW LEVEL SECURITY;

-- Publiczny widok bez track_ids (anty-cheat)
CREATE VIEW public.versus_matches_public AS
SELECT
  id, host_player_id, host_nick, guest_player_id, guest_nick,
  status, current_round, host_score, guest_score,
  created_at, updated_at
FROM public.versus_matches;

-- Brak polityk INSERT/UPDATE/DELETE → tylko service_role (backend) może pisać.
-- Publiczny SELECT umożliwiamy przez widok publiczny zamiast tabeli.
-- Dla realtime potrzebujemy też SELECT na tabeli (postgres_changes nie używa view) — ograniczamy w warstwie aplikacji.
CREATE POLICY "Public can read matches"
ON public.versus_matches FOR SELECT
USING (true);

-- Tabela wyników rund
CREATE TABLE public.versus_round_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.versus_matches(id) ON DELETE CASCADE,
  round_idx int NOT NULL,
  player_id text NOT NULL,
  attempts_used int NOT NULL,
  correct boolean NOT NULL,
  finished_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT versus_round_results_attempts_chk CHECK (attempts_used BETWEEN 0 AND 6),
  CONSTRAINT versus_round_results_round_chk CHECK (round_idx BETWEEN 1 AND 6),
  UNIQUE (match_id, round_idx, player_id)
);

ALTER TABLE public.versus_round_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read round results"
ON public.versus_round_results FOR SELECT
USING (true);

-- Indeksy
CREATE INDEX idx_versus_round_results_match ON public.versus_round_results(match_id, round_idx);
CREATE INDEX idx_versus_matches_status_created ON public.versus_matches(status, created_at DESC);

-- Trigger updated_at (reuse jeśli istnieje)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_versus_matches_updated_at
BEFORE UPDATE ON public.versus_matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.versus_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.versus_round_results;
