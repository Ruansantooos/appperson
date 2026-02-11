-- MIGRATION V2: NEW TABLES AND COLUMN UPDATES
-- Run this in Supabase SQL Editor

-- 1. Updates to gym_stats (Add macros)
ALTER TABLE public.gym_stats 
ADD COLUMN IF NOT EXISTS protein numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat numeric DEFAULT 0;

-- 2. Create weight_history table
CREATE TABLE IF NOT EXISTS public.weight_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  weight numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight history." ON weight_history FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own weight history." ON weight_history FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can delete own weight history." ON weight_history FOR DELETE USING ( auth.uid() = user_id );

-- 3. Create habit_logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date DEFAULT CURRENT_DATE,
  completed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs." ON habit_logs FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY "Users can insert own habit logs." ON habit_logs FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY "Users can update own habit logs." ON habit_logs FOR UPDATE USING ( auth.uid() = user_id );
CREATE POLICY "Users can delete own habit logs." ON habit_logs FOR DELETE USING ( auth.uid() = user_id );

-- 4. Apply all DELETE policies (Safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own tasks.') THEN
        create policy "Users can delete own tasks." on tasks for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own projects.') THEN
        create policy "Users can delete own projects." on projects for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own habits.') THEN
        create policy "Users can delete own habits." on habits for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own transactions.') THEN
        create policy "Users can delete own transactions." on transactions for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own calendar events.') THEN
        create policy "Users can delete own calendar events." on calendar_events for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own supplements.') THEN
        create policy "Users can delete own supplements." on supplements for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own workouts.') THEN
        create policy "Users can delete own workouts." on workouts for delete using ( auth.uid() = user_id );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own workout exercises.') THEN
        create policy "Users can delete own workout exercises." on workout_exercises for delete using ( auth.uid() = user_id );
    END IF;
END $$;
