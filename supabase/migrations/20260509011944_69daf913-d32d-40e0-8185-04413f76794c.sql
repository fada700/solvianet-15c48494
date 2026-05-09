ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles(discord_id);