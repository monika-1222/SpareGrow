-- Run these commands in your Supabase SQL Editor

-- 1. Create Goals Table
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL NOT NULL,
  saved_amount DECIMAL DEFAULT 0,
  icon TEXT DEFAULT 'potted_plant',
  expected_harvest_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals."
  ON goals FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own goals."
  ON goals FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own goals."
  ON goals FOR UPDATE
  USING ( auth.uid() = user_id );


-- 2. Create Transactions Table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT,
  amount DECIMAL NOT NULL,
  round_up_amount DECIMAL DEFAULT 0,
  type TEXT CHECK (type IN ('expense', 'investment', 'deposit')),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions."
  ON transactions FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own transactions."
  ON transactions FOR INSERT
  WITH CHECK ( auth.uid() = user_id );


-- 3. Profiles Table (Optional, for extended user data)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  growth_tier TEXT DEFAULT 'Seedling',
  updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile."
  ON profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );
