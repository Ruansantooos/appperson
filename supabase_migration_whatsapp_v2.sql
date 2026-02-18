-- ==========================================
-- Migration: WhatsApp Sessions & Rate Limiting
-- Para uso com o bot WhatsApp v2 (Corelys)
-- ==========================================

-- 1. Tabela de sessões WhatsApp (anti-flood + analytics)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user ON whatsapp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_last_msg ON whatsapp_sessions(last_message_at);

-- 3. Tabela de logs de mensagens (opcional, para debug/analytics)
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'document', 'other')),
  content TEXT,
  ai_response TEXT,
  tools_used TEXT[],
  processing_time_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para logs
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_message_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user ON whatsapp_message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created ON whatsapp_message_logs(created_at);

-- 5. RLS policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total (usado pelo n8n)
-- Usuários podem ver apenas suas próprias sessões
CREATE POLICY "Users can view own whatsapp sessions"
  ON whatsapp_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own whatsapp logs"
  ON whatsapp_message_logs FOR SELECT USING (auth.uid() = user_id);

-- 6. Tabela de notas rápidas (usada pela tool adicionar_nota)
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
