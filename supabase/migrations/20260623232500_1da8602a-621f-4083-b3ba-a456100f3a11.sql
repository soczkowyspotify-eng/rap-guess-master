
-- 1. ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nick)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nick', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. USER STATS
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily JSONB NOT NULL DEFAULT '[]'::jsonb,
  endless JSONB NOT NULL DEFAULT '{}'::jsonb,
  versus JSONB NOT NULL DEFAULT '{}'::jsonb,
  lyrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stats" ON public.user_stats FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. USER SETTINGS
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_album_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.user_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. PRESENCE
CREATE TABLE public.presence_pings (
  player_id TEXT PRIMARY KEY,
  nick TEXT NOT NULL,
  current_view TEXT NOT NULL DEFAULT 'home',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.presence_pings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.presence_pings TO anon, authenticated;
GRANT ALL ON public.presence_pings TO service_role;
ALTER TABLE public.presence_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read presence" ON public.presence_pings FOR SELECT USING (true);
CREATE POLICY "Public can upsert presence" ON public.presence_pings FOR INSERT WITH CHECK (length(player_id) BETWEEN 4 AND 100 AND length(nick) BETWEEN 1 AND 50);
CREATE POLICY "Public can update presence" ON public.presence_pings FOR UPDATE USING (true);

-- 6. LYRIC SNIPPETS
CREATE TABLE public.lyric_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id TEXT NOT NULL,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  lines TEXT[] NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'normal',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lyric_snippets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lyric_snippets TO authenticated;
GRANT ALL ON public.lyric_snippets TO service_role;
ALTER TABLE public.lyric_snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active snippets" ON public.lyric_snippets FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert snippets" ON public.lyric_snippets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update snippets" ON public.lyric_snippets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete snippets" ON public.lyric_snippets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 7. ANNOUNCEMENTS — admin write
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER lyric_snippets_updated_at BEFORE UPDATE ON public.lyric_snippets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
