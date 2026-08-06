-- ============================================================================
-- Organizador Personal — migración 0003: orden de widgets del dashboard
-- Ejecuta esto DESPUÉS de 0001 y 0002, en el SQL Editor de Supabase.
-- Aditiva: no modifica nada de las migraciones anteriores.
-- ============================================================================

alter table public.profiles
  add column if not exists dashboard_widget_order text[]
  not null default '{habits,next_block,notes_review,subjects}';
