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
