-- ============================================================
-- SpareGrow Supabase Database Schema & Security Configuration
-- Run these commands in your Supabase Project SQL Editor
-- ============================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  growth_tier TEXT DEFAULT 'Seedling',
  mpin TEXT,
  is_gold_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Auto-create profile on Supabase auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, growth_tier, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'SpareGrow Saver'),
    new.raw_user_meta_data->>'phone',
    'Seedling',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL NOT NULL,
  saved_amount DECIMAL DEFAULT 0,
  icon TEXT DEFAULT 'potted_plant',
  expected_harvest_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals."
  ON public.goals FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own goals."
  ON public.goals FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own goals."
  ON public.goals FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own goals."
  ON public.goals FOR DELETE
  USING ( auth.uid() = user_id );


-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT DEFAULT 'Expense',
  amount DECIMAL NOT NULL,
  round_up_amount DECIMAL DEFAULT 0,
  type TEXT CHECK (type IN ('expense', 'investment', 'deposit', 'withdrawal')),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions."
  ON public.transactions FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own transactions."
  ON public.transactions FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own transactions."
  ON public.transactions FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own transactions."
  ON public.transactions FOR DELETE
  USING ( auth.uid() = user_id );


-- 4. Enable Supabase Realtime for live UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

