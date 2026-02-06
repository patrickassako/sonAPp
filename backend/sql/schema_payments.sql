-- Create Credit Packages Table
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid not null default gen_random_uuid (),
  name text not null,
  credits integer not null,
  price numeric(10, 2) not null,
  currency text not null default 'XAF'::text,
  features jsonb null default '[]'::jsonb,
  is_active boolean null default true,
  is_popular boolean null default false,
  created_at timestamp with time zone not null default now(),
  constraint credit_packages_pkey primary key (id)
);

CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages USING btree (is_active);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  type text not null,
  amount integer not null,
  price numeric(10, 2) null,
  payment_provider text null,
  payment_id text null,
  status text not null default 'pending'::text,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint transactions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  ),
  constraint transactions_type_check check (
    (
      type = any (
        array[
          'purchase'::text,
          'reserve'::text,
          'debit'::text,
          'refund'::text
        ]
      )
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions USING btree (type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions USING btree (created_at desc);

-- Atomic credit increment function (prevents race conditions)
-- Uses row-level locking to ensure only one update at a time per user
CREATE OR REPLACE FUNCTION add_credits_atomic(
    p_user_id uuid,
    p_credits integer,
    p_money numeric
) RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET credits = credits + p_credits,
        total_spent_money = total_spent_money + p_money
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Seed Data (Example)
-- INSERT INTO credit_packages (name, credits, price, currency, features, is_popular) VALUES
-- ('Starter Pack', 10, 2000, 'XAF', '["Create 2 songs", "Standard quality", "MP3 Download"]'::jsonb, false),
-- ('Creator Bundle', 50, 8000, 'XAF', '["Create 10 songs", "High quality", "Commercial license", "Priority generation"]'::jsonb, true),
-- ('Pro Studio', 100, 15000, 'XAF', '["Create 20 songs", "Lossless WAV", "Stem separation", "API access"]'::jsonb, false);
