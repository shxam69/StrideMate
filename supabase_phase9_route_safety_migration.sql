-- ============================================================================
-- STRIDEMATE PHASE 9 MIGRATION: GPS ROUTE POINTS & SAFETY SOS
-- Idempotent schema definition for Supabase PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Activity Route Points Table (GPS Breadcrumbs for Outdoor Tracking & Replay)
CREATE TABLE IF NOT EXISTS public.activity_route_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast route fetching and ordering
CREATE INDEX IF NOT EXISTS idx_route_points_activity_id ON public.activity_route_points(activity_id);
CREATE INDEX IF NOT EXISTS idx_route_points_recorded_at ON public.activity_route_points(recorded_at ASC);

-- 2. Emergency Contacts Table (Idempotent check)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- 3. Emergency Events / SOS Table (Idempotent check)
CREATE TABLE IF NOT EXISTS public.emergency_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy_meters DOUBLE PRECISION,
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'TRIGGERED',
    sms_status VARCHAR(50),
    whatsapp_status VARCHAR(50),
    call_status VARCHAR(50),
    message TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_events_user_id ON public.emergency_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_triggered_at ON public.emergency_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON public.emergency_events(status);
