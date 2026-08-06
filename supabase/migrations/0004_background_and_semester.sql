-- ============================================================================
-- Organizador Personal — migración 0004: color de fondo propio + semestre
-- Ejecuta esto DESPUÉS de 0001, 0002 y 0003, en el SQL Editor de Supabase.
-- Aditiva: no modifica nada de las migraciones anteriores.
-- ============================================================================

alter table public.profiles
  add column if not exists background_color text;

alter table public.subjects
  add column if not exists semester_label text;
