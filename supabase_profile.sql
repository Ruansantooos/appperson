-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text, -- 'Male', 'Female', 'Other'
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS height numeric, -- in cm
ADD COLUMN IF NOT EXISTS activity_level text, -- 'Sedentary', 'Lightly Active', etc.
ADD COLUMN IF NOT EXISTS goal text; -- 'Lose Weight', 'Gain Muscle', etc.

-- Ensure gym_stats has necessary columns (it likely does, but good to double check or add defaults if needed)
-- (weight, target_weight, etc. are already in the initial schema)
