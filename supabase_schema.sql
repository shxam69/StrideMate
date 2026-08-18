-- ==============================================================================
-- StrideMate Complete PostgreSQL Schema Migration (Phase 3 + Phase 4 + Phase 5)
-- Safe, Idempotent, and Non-Destructive
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- SECTION A: CORE USERS & EMERGENCY CONTACTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(255) UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    date_of_birth DATE,
    gender VARCHAR(50),
    profile_photo VARCHAR(1024),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- ==============================================================================
-- SECTION B: PHASE 3 LIVE TRACKING TELEMETRY (ACTIVITIES TABLE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sport VARCHAR(50) NOT NULL,
    distance_km DOUBLE PRECISION,
    duration_minutes INTEGER,
    duration_seconds INTEGER,
    steps INTEGER,
    total_duration_seconds INTEGER,
    walking_duration_seconds INTEGER,
    jogging_duration_seconds INTEGER,
    running_duration_seconds INTEGER,
    cycling_duration_seconds INTEGER,
    calories INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    points INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure all Phase 3 telemetry columns exist incrementally without data loss
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS walking_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS jogging_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS running_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS cycling_duration_seconds INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_recorded_at ON public.activities(recorded_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_recorded ON public.activities(user_id, recorded_at DESC);

-- ==============================================================================
-- SECTION C: PHASE 4 & PHASE 5 GAMIFICATION ENGINE
-- ==============================================================================

-- 1. User Progress (XP, Level, Streaks)
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

-- 2. Achievements Catalog
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

-- 3. User Unlocked Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_code VARCHAR(100) NOT NULL REFERENCES public.achievements(code) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_code)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- 4. Daily Quests
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
-- SECTION D: AUTHENTICATION TOKENS (OTPs & PASSWORD RESETS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    phone_number VARCHAR(255),
    otp_hash VARCHAR(255) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON public.otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_created_at ON public.otps(created_at);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
