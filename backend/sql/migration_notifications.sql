-- Migration: Add notification_preferences table
-- Allows users to opt-in for WhatsApp/Email notifications when generation completes

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES generation_jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  destination TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_pref_job ON notification_preferences(job_id);
