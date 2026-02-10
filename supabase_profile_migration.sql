-- =====================================================
-- MIGRATION: Add Profile Fields
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS activity_level text,
ADD COLUMN IF NOT EXISTS goal text;

-- Step 2: Ensure updated_at column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Step 3: Create or update your profile record
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- You can find it by running: SELECT id, email FROM auth.users;

-- Example (uncomment and replace with your actual user ID):
-- INSERT INTO public.profiles (id, email, full_name, updated_at)
-- VALUES (
--   'YOUR_USER_ID',
--   'your-email@example.com',
--   'Your Name',
--   now()
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   email = EXCLUDED.email,
--   updated_at = now();

-- =====================================================
-- VERIFICATION: Check if columns were added
-- =====================================================
-- Run this to verify:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;
