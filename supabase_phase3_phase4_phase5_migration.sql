-- ==============================================================================
-- StrideMate Phase 3 + Phase 4 + Phase 5 Dedicated Migration Script
-- Execute this entire script in the Supabase SQL Editor.
-- Safe to re-run (idempotent, does not delete existing data).
-- ==============================================================================

-- 1. Phase 3 Columns on activities table (if not already added)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS walking_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS jogging_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS running_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS cycling_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_activities_user_recorded ON public.activities(user_id, recorded_at DESC);

-- 2. Phase 4 & Phase 5: User Progress (Level, XP, Streaks)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

-- 3. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    code VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    requirement_description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed Default Achievements
INSERT INTO public.achievements (code, name, description, icon, reward_xp, requirement_description) VALUES
('FIRST_ACTIVITY', 'First Steps', 'Log your first fitness activity in StrideMate', 'Footprints', 50, 'Complete 1 activity'),
('FIRST_100_XP', 'Century Mover', 'Earn your first 100 XP from training', 'Zap', 100, 'Earn 100 Total XP'),
('THREE_DAY_STREAK', 'Consistency Starter', 'Maintain an active streak for 3 consecutive days', 'Flame', 150, 'Reach 3-Day Streak'),
('SEVEN_DAY_STREAK', 'Weekly Champion', 'Maintain an active streak for 7 consecutive days', 'Flame', 300, 'Reach 7-Day Streak'),
('TEN_KM_TOTAL', 'Distance Pioneer', 'Accumulate 10 total kilometers across outdoor activities', 'MapPin', 200, 'Cover 10 km total distance'),
('ONE_THOUSAND_XP', 'Stride Master', 'Reach a grand total of 1,000 XP in StrideMate', 'Trophy', 500, 'Reach 1,000 Total XP'),
('THIRTY_DAY_STREAK', 'Iron Will', 'Maintain an active streak for 30 consecutive days', 'Crown', 1000, 'Reach 30-Day Streak'),
('TEN_KM_RUNNING', 'Speed Demon', 'Accumulate 10 kilometers of dedicated running distance', 'Flame', 350, 'Cover 10 km running distance')
ON CONFLICT (code) DO NOTHING;

-- 4. User Achievements Unlocks
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_code VARCHAR(100) NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_code)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- 5. Daily Quests
CREATE TABLE IF NOT EXISTS public.daily_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL,
    quest_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_progress INTEGER NOT NULL DEFAULT 0,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests(user_id, quest_date);

-- ==============================================================================
-- 6. VERIFICATION QUERIES (Run these to confirm complete installation)
-- ==============================================================================
-- Check activities Phase 3 columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activities' AND column_name IN ('total_duration_seconds', 'walking_duration_seconds', 'jogging_duration_seconds', 'running_duration_seconds', 'cycling_duration_seconds', 'calories', 'started_at', 'ended_at');

-- Check new tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_progress', 'achievements', 'user_achievements', 'daily_quests');

-- Check seeded achievements:
-- SELECT code, name, reward_xp FROM public.achievements ORDER BY reward_xp ASC;

