
-- ============================================================================
-- CREDIT PACKAGES TABLE
-- ============================================================================
-- Store credit packages for dynamic pricing

CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);

-- Enable RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active packages
CREATE POLICY "Public can view active packages" ON credit_packages
  FOR SELECT USING (is_active = TRUE);

-- Initial Data
INSERT INTO credit_packages (name, credits, price, currency, features, is_popular) VALUES
('Starter', 10, 1500, 'XAF', '["10 song generations", "MP3 download", "Email support"]', FALSE),
('Popular', 50, 5000, 'XAF', '["50 song generations", "Priority queue", "WAV + MP3", "Discord access"]', TRUE),
('Pro', 150, 20000, 'XAF', '["150 song generations", "Fastest queue", "Commercial rights", "24/7 support"]', FALSE)
ON CONFLICT DO NOTHING;
