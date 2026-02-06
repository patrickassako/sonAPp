-- Migration: Add 'push' to notification_preferences channel constraint
-- Run this on existing databases that already have the notification_preferences table

ALTER TABLE notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_channel_check;

ALTER TABLE notification_preferences
  ADD CONSTRAINT notification_preferences_channel_check
  CHECK (channel IN ('whatsapp', 'email', 'push'));
