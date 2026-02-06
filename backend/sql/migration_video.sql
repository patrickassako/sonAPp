-- Migration: Add video generation support
-- Run this on Supabase SQL editor

-- Store the Suno audio ID for each track (needed to request video generation)
ALTER TABLE audio_files ADD COLUMN IF NOT EXISTS provider_audio_id TEXT;

-- Store the generated video URL
ALTER TABLE audio_files ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Flag on projects to indicate user wants a video clip
ALTER TABLE projects ADD COLUMN IF NOT EXISTS generate_video BOOLEAN DEFAULT FALSE;
