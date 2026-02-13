-- =====================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS
-- Cole TUDO de uma vez no SQL Editor do novo Supabase
-- =====================================================

-- =========================
-- 1. PROFILES
-- =========================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  gender text,
  birth_date date,
  height numeric,
  activity_level text,
  goal text,
  plan text DEFAULT 'premium',
  plan_expires_at timestamp with time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================
-- 2. TASKS
-- =========================
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  priority text,
  status text,
  due_date timestamp with time zone,
  category text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks." ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks." ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks." ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks." ON tasks FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 3. PROJECTS
-- =========================
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  status text,
  tags text[],
  links text[],
  last_edited timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects." ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects." ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects." ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects." ON projects FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 4. NOTES
-- =========================
CREATE TABLE public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text,
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes." ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes." ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes." ON notes FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- 5. HABITS
-- =========================
CREATE TABLE public.habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  progress integer DEFAULT 0,
  target text,
  completed_today boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits." ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits." ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits." ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits." ON habits FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 6. HABIT LOGS
-- =========================
CREATE TABLE public.habit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date DEFAULT CURRENT_DATE,
  completed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit logs." ON habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs." ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs." ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit logs." ON habit_logs FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 7. GYM STATS
-- =========================
CREATE TABLE public.gym_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  weight numeric,
  target_weight numeric,
  body_fat numeric,
  muscle_mass numeric,
  calories_consumed numeric,
  target_calories numeric,
  protein numeric DEFAULT 0,
  carbs numeric DEFAULT 0,
  fat numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.gym_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gym stats." ON gym_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gym stats." ON gym_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gym stats." ON gym_stats FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- 8. WEIGHT HISTORY
-- =========================
CREATE TABLE public.weight_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  weight numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight history." ON weight_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight history." ON weight_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight history." ON weight_history FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 9. SUPPLEMENTS
-- =========================
CREATE TABLE public.supplements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  instructions text,
  current_stock integer,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplements." ON supplements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own supplements." ON supplements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplements." ON supplements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplements." ON supplements FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 10. WORKOUTS
-- =========================
CREATE TABLE public.workouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  day_of_week text,
  muscle_group text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts." ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts." ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts." ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts." ON workouts FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 11. WORKOUT EXERCISES
-- =========================
CREATE TABLE public.workout_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  sets text,
  reps text,
  weight text,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout exercises." ON workout_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout exercises." ON workout_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout exercises." ON workout_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout exercises." ON workout_exercises FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 12. CALENDAR EVENTS
-- =========================
CREATE TABLE public.calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  category text,
  location text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events." ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events." ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events." ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events." ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 13. CARDS (cartões)
-- =========================
CREATE TABLE public.cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  bank_name text NOT NULL,
  last_four_digits text NOT NULL,
  expiration_date text NOT NULL,
  card_type text CHECK (card_type IN ('credit', 'debit')) NOT NULL,
  card_limit numeric DEFAULT 0,
  finance_scope text CHECK (finance_scope IN ('pf', 'pj')) DEFAULT 'pf',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards" ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards" ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.cards FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 14. TRANSACTIONS
-- =========================
CREATE TABLE public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text,
  type text CHECK (type IN ('income', 'expense')),
  date date DEFAULT CURRENT_DATE,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  finance_scope text CHECK (finance_scope IN ('pf', 'pj')) DEFAULT 'pf',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions." ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions." ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions." ON transactions FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 15. BILLS (contas a pagar)
-- =========================
CREATE TABLE public.bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  recurrence text CHECK (recurrence IN ('once', 'weekly', 'monthly')) DEFAULT 'once',
  category text NOT NULL DEFAULT 'Others',
  status text CHECK (status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  finance_scope text CHECK (finance_scope IN ('pf', 'pj')) DEFAULT 'pf',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- 16. PAYMENT HISTORY (Stripe futuro)
-- =========================
CREATE TABLE public.payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users,
  amount numeric NOT NULL,
  currency text DEFAULT 'BRL',
  status text NOT NULL,
  stripe_payment_id text,
  plan text DEFAULT 'premium',
  period_start date,
  period_end date,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments." ON payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments." ON payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================
-- 17. INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
