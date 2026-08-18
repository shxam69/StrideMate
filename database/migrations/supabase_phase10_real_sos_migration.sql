-- ============================================================================
-- STRIDEMATE PHASE 10 MIGRATION: REAL SOS NOTIFICATION TRACKING & SPRINGEDGE
-- Idempotent schema definition for Supabase PostgreSQL
-- ============================================================================

-- Add provider and DLR tracking columns to emergency_events safely
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'SPRINGEDGE';
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS sms_sid VARCHAR(100);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS whatsapp_sid VARCHAR(100);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS call_sid VARCHAR(100);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS sms_error_code VARCHAR(50);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS sms_error_message TEXT;
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS whatsapp_error_code VARCHAR(50);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS whatsapp_error_message TEXT;
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS call_error_code VARCHAR(50);
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS call_error_message TEXT;
ALTER TABLE public.emergency_events ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(100);

-- Indexes for lightning fast webhook callbacks and idempotency lookups
CREATE INDEX IF NOT EXISTS idx_emergency_events_sms_sid ON public.emergency_events(sms_sid);
CREATE INDEX IF NOT EXISTS idx_emergency_events_whatsapp_sid ON public.emergency_events(whatsapp_sid);
CREATE INDEX IF NOT EXISTS idx_emergency_events_call_sid ON public.emergency_events(call_sid);
CREATE INDEX IF NOT EXISTS idx_emergency_events_client_request_id ON public.emergency_events(client_request_id);
