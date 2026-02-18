-- ==========================================
-- Migration: WhatsApp Integration
-- Adiciona campo de telefone ao perfil
-- ==========================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
