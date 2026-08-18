-- ==============================================================================
-- StrideMate Phase 6 + Phase 7 Migration Script
-- PHASE 6: Environment Intelligence
-- PHASE 7: Safety & Multichannel SOS Emergency Events
-- Execute this entire script in the Supabase PostgreSQL SQL Editor.
-- Safe to re-run (idempotent, does not delete existing data).
-- ==============================================================================

-- 1. Emergency Events Table
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

-- Indexes for efficient lookups & isolation
CREATE INDEX IF NOT EXISTS idx_emergency_events_user_id ON public.emergency_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_triggered_at ON public.emergency_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_events_status ON public.emergency_events(status);

-- ==============================================================================
-- 2. VERIFICATION QUERIES
-- ==============================================================================
-- Check emergency_events table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emergency_events';

-- Check columns on emergency_events:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'emergency_events' ORDER BY ordinal_position;
