-- ==========================================
-- Migration: Meals & Saved Foods
-- ==========================================

-- Tabela de refeições do dia
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de alimentos favoritos salvos
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC DEFAULT 0,
  protein NUMERIC DEFAULT 0,
  carbs NUMERIC DEFAULT 0,
  fat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE USING (auth.uid() = user_id);

-- RLS para saved_foods
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved_foods"
  ON saved_foods FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_foods"
  ON saved_foods FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved_foods"
  ON saved_foods FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_foods"
  ON saved_foods FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_saved_foods_user ON saved_foods(user_id);
