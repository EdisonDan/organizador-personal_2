-- ============================================================================
-- Organizador Personal — esquema inicial
-- Cómo usarlo: Dashboard de Supabase > SQL Editor > New query > pega TODO
-- este archivo > Run. Es seguro volver a ejecutarlo (usa IF NOT EXISTS /
-- ON CONFLICT donde corresponde), pero está pensado para correr una sola vez
-- sobre un proyecto nuevo.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PERFILES — extiende auth.users con preferencias y gamificación
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  accent_color text not null default 'teal',
  font_pref text not null default 'sans' check (font_pref in ('sans', 'serif', 'rounded')),
  week_start_day smallint not null default 1 check (week_start_day between 0 and 6),
  date_format text not null default 'dd/mm/yyyy',
  background_image_url text,
  points integer not null default 0,
  level integer not null default 1,
  current_global_streak integer not null default 0,
  longest_global_streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Crea el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- MÓDULO 1 · HÁBITOS
-- ----------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'positive' check (type in ('positive', 'negative')),
  icon text,
  image_url text,
  color text not null default '#0E7A72',
  category text,
  frequency_type text not null default 'daily' check (frequency_type in ('daily', 'weekly_count', 'specific_days')),
  frequency_config jsonb not null default '{}'::jsonb, -- {"days_per_week":3} o {"days":[1,3,5]}
  goal_value numeric,
  goal_unit text,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits(user_id);
alter table public.habits enable row level security;
create policy "Users manage own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  value numeric,
  note text,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index habit_logs_user_date_idx on public.habit_logs(user_id, date);
alter table public.habit_logs enable row level security;
create policy "Users manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- MÓDULO 4 · MATERIAS (organización académica)
-- ----------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#0E7A72',
  icon text,
  cover_image_url text,
  semester_start_date date,
  semester_weeks integer not null default 16,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index subjects_user_id_idx on public.subjects(user_id);
alter table public.subjects enable row level security;
create policy "Users manage own subjects" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.subject_weeks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_number integer not null,
  title text,
  created_at timestamptz not null default now(),
  unique (subject_id, week_number)
);

alter table public.subject_weeks enable row level security;
create policy "Users manage own subject weeks" on public.subject_weeks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.subject_topics (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.subject_weeks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index subject_topics_week_idx on public.subject_topics(week_id);
alter table public.subject_topics enable row level security;
create policy "Users manage own subject topics" on public.subject_topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  due_date timestamptz not null,
  type text not null default 'assignment' check (type in ('exam', 'assignment', 'other')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index deadlines_user_due_idx on public.deadlines(user_id, due_date);
alter table public.deadlines enable row level security;
create policy "Users manage own deadlines" on public.deadlines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- MÓDULO 2 · HORARIO
-- ----------------------------------------------------------------------------
create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  block_type text not null default 'study' check (block_type in ('class', 'study', 'habit', 'break')),
  day_of_week smallint check (day_of_week between 0 and 6),
  specific_date date,
  start_time time not null,
  end_time time not null,
  repeats boolean not null default true,
  subject_id uuid references public.subjects(id) on delete set null,
  habit_id uuid references public.habits(id) on delete set null,
  color text default '#0E7A72',
  created_at timestamptz not null default now()
);

create index schedule_blocks_user_idx on public.schedule_blocks(user_id);
alter table public.schedule_blocks enable row level security;
create policy "Users manage own schedule blocks" on public.schedule_blocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.pomodoro_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  schedule_block_id uuid references public.schedule_blocks(id) on delete set null,
  started_at timestamptz not null default now(),
  duration_minutes integer not null default 25,
  completed boolean not null default false
);

create index pomodoro_sessions_user_idx on public.pomodoro_sessions(user_id, started_at);
alter table public.pomodoro_sessions enable row level security;
create policy "Users manage own pomodoro sessions" on public.pomodoro_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- MÓDULO 3 · NOTAS
-- ----------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  week_id uuid references public.subject_weeks(id) on delete set null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  note_type text not null default 'normal' check (note_type in ('normal', 'flashcards', 'feynman')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_idx on public.notes(user_id);
create index notes_subject_idx on public.notes(subject_id);
alter table public.notes enable row level security;
create policy "Users manage own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0
);

create index flashcards_note_idx on public.flashcards(note_id);
alter table public.flashcards enable row level security;
create policy "Users manage own flashcards" on public.flashcards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.note_reviews (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_reviewed_at timestamptz,
  next_review_at date not null default current_date,
  interval_stage integer not null default 0, -- 0=nueva,1=+1d,2=+3d,3=+7d,4=+14d...
  created_at timestamptz not null default now(),
  unique (note_id)
);

create index note_reviews_next_review_idx on public.note_reviews(user_id, next_review_at);
alter table public.note_reviews enable row level security;
create policy "Users manage own note reviews" on public.note_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.note_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_note_id uuid not null references public.notes(id) on delete cascade,
  to_note_id uuid not null references public.notes(id) on delete cascade,
  unique (from_note_id, to_note_id)
);

alter table public.note_links enable row level security;
create policy "Users manage own note links" on public.note_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- GAMIFICACIÓN
-- ----------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_type text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_type)
);

alter table public.achievements enable row level security;
create policy "Users manage own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- STORAGE — bucket único para fotos de perfil, íconos, portadas y evidencias
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('app-images', 'app-images', true)
on conflict (id) do nothing;

create policy "Cualquiera puede ver las imágenes" on storage.objects
  for select using (bucket_id = 'app-images');

create policy "Los usuarios suben a su propia carpeta" on storage.objects
  for insert with check (
    bucket_id = 'app-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Los usuarios actualizan su propia carpeta" on storage.objects
  for update using (
    bucket_id = 'app-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Los usuarios borran de su propia carpeta" on storage.objects
  for delete using (
    bucket_id = 'app-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Notas de diseño:
-- · Cada tabla "hija" guarda su propio user_id (denormalizado) para que las
--   políticas RLS sean simples y rápidas (sin joins).
-- · Sube tus imágenes a la carpeta "app-images/<tu-user-id>/..." para que las
--   políticas de storage te reconozcan como dueño del archivo.
-- · Este esquema cubre los 5 módulos completos; los módulos que aún no están
--   implementados en el código (Hábitos completo, Horario, Notas, Materias)
--   ya tienen su tabla lista para cuando construyamos esa fase.
-- ============================================================================
