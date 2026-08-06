-- ============================================================================
-- Organizador Personal — migración 0002: vínculo tema -> nota / bloque
-- Ejecuta esto DESPUÉS de 0001_init.sql, en el SQL Editor de Supabase.
-- Es aditiva: no modifica ni borra nada de la migración anterior.
-- ============================================================================

alter table public.notes
  add column if not exists topic_id uuid references public.subject_topics(id) on delete set null;

alter table public.schedule_blocks
  add column if not exists topic_id uuid references public.subject_topics(id) on delete set null;

create index if not exists notes_topic_idx on public.notes(topic_id);
create index if not exists schedule_blocks_topic_idx on public.schedule_blocks(topic_id);
