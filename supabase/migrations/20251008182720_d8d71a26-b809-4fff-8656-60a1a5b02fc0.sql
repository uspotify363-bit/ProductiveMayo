-- Add points and streak columns to user_stats
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_user_stats_date ON public.user_stats(user_id, date DESC);