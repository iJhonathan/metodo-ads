-- Migration: Agregar campos de audiencia estructurados a branding_kits
-- Ejecutar en: Supabase Dashboard > SQL Editor

ALTER TABLE branding_kits
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS edad_desde integer,
  ADD COLUMN IF NOT EXISTS edad_hasta integer,
  ADD COLUMN IF NOT EXISTS mercado text,
  ADD COLUMN IF NOT EXISTS mercado_personalizado text;
