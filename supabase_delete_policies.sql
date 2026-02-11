-- DELETE RLS Policies for all user-owned tables
-- Run this in Supabase SQL Editor

-- Tasks
create policy "Users can delete own tasks." on tasks for delete using ( auth.uid() = user_id );

-- Projects
create policy "Users can delete own projects." on projects for delete using ( auth.uid() = user_id );

-- Habits
create policy "Users can delete own habits." on habits for delete using ( auth.uid() = user_id );

-- Transactions
create policy "Users can delete own transactions." on transactions for delete using ( auth.uid() = user_id );

-- Calendar Events
create policy "Users can delete own calendar events." on calendar_events for delete using ( auth.uid() = user_id );

-- Supplements
create policy "Users can delete own supplements." on supplements for delete using ( auth.uid() = user_id );

-- Workouts
create policy "Users can delete own workouts." on workouts for delete using ( auth.uid() = user_id );

-- Workout Exercises
create policy "Users can delete own workout exercises." on workout_exercises for delete using ( auth.uid() = user_id );
