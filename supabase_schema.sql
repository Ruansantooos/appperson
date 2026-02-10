-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create gym_stats table
create table public.gym_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  weight numeric,
  target_weight numeric,
  body_fat numeric,
  muscle_mass numeric,
  calories_consumed numeric,
  target_calories numeric,
  updated_at timestamp with time zone default now()
);

alter table public.gym_stats enable row level security;

create policy "Users can view own gym stats."
  on gym_stats for select
  using ( auth.uid() = user_id );

create policy "Users can insert own gym stats."
  on gym_stats for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own gym stats."
  on gym_stats for update
  using ( auth.uid() = user_id );

-- Create habits table
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  streak integer default 0,
  best_streak integer default 0,
  progress integer default 0,
  target text,
  completed_today boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.habits enable row level security;

create policy "Users can view own habits."
  on habits for select
  using ( auth.uid() = user_id );

create policy "Users can insert own habits."
  on habits for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own habits."
  on habits for update
  using ( auth.uid() = user_id );

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  description text not null,
  amount numeric not null,
  category text,
  type text check (type in ('income', 'expense')),
  date date default CURRENT_DATE,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions."
  on transactions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own transactions."
  on transactions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own transactions."
  on transactions for update
  using ( auth.uid() = user_id );

-- Create tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  priority text,
  status text,
  due_date timestamp with time zone,
  category text,
  created_at timestamp with time zone default now()
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks."
  on tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own tasks."
  on tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own tasks."
  on tasks for update
  using ( auth.uid() = user_id );

-- Create projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  status text,
  tags text[],
  links text[],
  last_edited timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects."
  on projects for select
  using ( auth.uid() = user_id );

create policy "Users can insert own projects."
  on projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own projects."
  on projects for update
  using ( auth.uid() = user_id );

-- Create notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text,
  tags text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.notes enable row level security;

create policy "Users can view own notes."
  on notes for select
  using ( auth.uid() = user_id );

create policy "Users can insert own notes."
  on notes for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own notes."
  on notes for update
  using ( auth.uid() = user_id );
