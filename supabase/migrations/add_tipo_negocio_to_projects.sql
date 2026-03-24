-- Migration: Agregar tipo_negocio a projects
-- Ejecutar en: Supabase Dashboard > SQL Editor

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tipo_negocio text;
