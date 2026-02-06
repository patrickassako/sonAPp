-- Migration: Add custom_style_text column to projects table
-- Allows users to describe a custom musical style instead of picking a preset

ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_style_text TEXT;
