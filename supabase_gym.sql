-- Create supplements table
create table public.supplements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  dosage text, -- e.g. "5g", "1 scoop"
  frequency text, -- e.g. "Daily", "Pre-workout"
  instructions text,
  current_stock integer, -- estimated doses left
  created_at timestamp with time zone default now()
);

alter table public.supplements enable row level security;

create policy "Users can view own supplements."
  on supplements for select
  using ( auth.uid() = user_id );

create policy "Users can insert own supplements."
  on supplements for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own supplements."
  on supplements for update
  using ( auth.uid() = user_id );

create policy "Users can delete own supplements."
  on supplements for delete
  using ( auth.uid() = user_id );

-- Create workouts table
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null, -- e.g. "Treino A - Peito", "Leg Day"
  day_of_week text, -- Optional: "Monday", "Tuesday", etc.
  muscle_group text,
  created_at timestamp with time zone default now()
);

alter table public.workouts enable row level security;

create policy "Users can view own workouts."
  on workouts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own workouts."
  on workouts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own workouts."
  on workouts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own workouts."
  on workouts for delete
  using ( auth.uid() = user_id );


-- Create workout_exercises table
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  sets text, -- text to allow ranges "3-4"
  reps text, -- text to allow ranges "8-12"
  weight text,
  notes text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

alter table public.workout_exercises enable row level security;

-- Policies for workout_exercises (inherit access via workout relation ideally, but RLS needs distinct policies)
-- Simplest approach: link check via query is expensive, so often we duplicate user_id or use a join policy. 
-- For simplicity in this app, let's duplicate user_id or just rely on the fact that you can only access workouts you own.
-- Actually, lets add user_id to workout_exercises for easier RLS, or use a join. 
-- Let's add user_id to workout_exercises to make RLS simple and standard consistent.

alter table public.workout_exercises add column user_id uuid references auth.users;
-- NOTE: In a production app, we'd automate filling this on insert via trigger, but frontend can send it for now.

create policy "Users can view own workout exercises."
  on workout_exercises for select
  using ( auth.uid() = user_id );

create policy "Users can insert own workout exercises."
  on workout_exercises for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own workout exercises."
  on workout_exercises for update
  using ( auth.uid() = user_id );

create policy "Users can delete own workout exercises."
  on workout_exercises for delete
  using ( auth.uid() = user_id );
