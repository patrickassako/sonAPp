-- Create Credit Packages Table
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES credit_packages(id),
  type TEXT DEFAULT 'purchase',
  amount INTEGER NOT NULL, -- credits amount
  price NUMERIC NOT NULL,
  payment_provider TEXT DEFAULT 'flutterwave',
  payment_id TEXT, -- provider transaction id
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Data: Credit Packages
INSERT INTO credit_packages (name, credits, price, currency, features, is_popular) VALUES
('Starter Pack', 10, 2000, 'XAF', ARRAY['Create 2 songs', 'Standard quality', 'MP3 Download'], false),
('Creator Bundle', 50, 8000, 'XAF', ARRAY['Create 10 songs', 'High quality', 'Commercial license', 'Priority generation'], true),
('Pro Studio', 100, 15000, 'XAF', ARRAY['Create 20 songs', 'Lossless WAV', 'Stem separation', 'API access'], false);
