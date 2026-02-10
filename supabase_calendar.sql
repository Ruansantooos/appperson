-- Create calendar_events table
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  category text,
  location text,
  created_at timestamp with time zone default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can view own calendar events."
  on calendar_events for select
  using ( auth.uid() = user_id );

create policy "Users can insert own calendar events."
  on calendar_events for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own calendar events."
  on calendar_events for update
  using ( auth.uid() = user_id );

create policy "Users can delete own calendar events."
  on calendar_events for delete
  using ( auth.uid() = user_id );
