
-- Add audio_url column to projects table to support voice-to-music feature
ALTER TABLE projects ADD COLUMN audio_url TEXT;

-- Verify
-- SELECT * FROM projects LIMIT 1;
