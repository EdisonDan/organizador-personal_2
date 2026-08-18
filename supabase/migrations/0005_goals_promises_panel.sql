-- ============================================================================
-- Organizador Personal — migración 0005: Objetivos, Promesas, Personalizar panel
-- Ejecuta esto DESPUÉS de 0001-0004, en el SQL Editor de Supabase.
-- Aditiva: no modifica ni borra nada de las migraciones anteriores.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OBJETIVOS
-- ----------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  color text not null default '#0E7A72',
  icon text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  priority smallint not null default 2 check (priority between 1 and 3), -- 1=baja,2=media,3=alta
  start_date date not null default current_date,
  target_date date,
  initial_level smallint check (initial_level between 1 and 5),
  target_level smallint check (target_level between 1 and 5),
  progress_pct integer not null default 0,
  primary_habit_id uuid references public.habits(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals(user_id);
alter table public.goals enable row level security;
create policy "Users manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_subtopics (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  difficulty smallint check (difficulty between 1 and 3),
  status text not null default 'no_iniciado' check (status in ('no_iniciado', 'entendiendo', 'practicando', 'consolidado')),
  progress_pct integer not null default 0,
  estimated_minutes integer,
  invested_minutes integer not null default 0,
  last_studied_at timestamptz,
  next_review_at date,
  created_at timestamptz not null default now()
);

create index goal_subtopics_goal_idx on public.goal_subtopics(goal_id);
alter table public.goal_subtopics enable row level security;
create policy "Users manage own goal subtopics" on public.goal_subtopics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subtopic_id uuid references public.goal_subtopics(id) on delete set null,
  note_id uuid references public.notes(id) on delete set null,
  resource_id uuid, -- referencia a goal_resources; se agrega FK más abajo (se crea después)
  title text not null,
  description text,
  task_type text not null default 'ejercicios' check (
    task_type in ('leer', 'ver_recurso', 'ejercicios', 'resumir', 'active_recall', 'repasar', 'practica_guiada', 'mini_evaluacion', 'proyecto')
  ),
  difficulty smallint check (difficulty between 1 and 3),
  priority smallint not null default 2 check (priority between 1 and 3),
  estimated_minutes integer,
  completed boolean not null default false,
  suggested_date date,
  due_date date,
  counts_as_habit boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index goal_tasks_goal_idx on public.goal_tasks(goal_id);
alter table public.goal_tasks enable row level security;
create policy "Users manage own goal tasks" on public.goal_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_resources (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subtopic_id uuid references public.goal_subtopics(id) on delete set null,
  title text not null,
  type text not null default 'link' check (type in ('pdf', 'link', 'video', 'other')),
  url text, -- para link/video/other, o la URL pública del PDF en Storage
  current_page integer not null default 1, -- progreso de lectura, solo aplica a type='pdf'
  page_count integer,
  created_at timestamptz not null default now()
);

create index goal_resources_goal_idx on public.goal_resources(goal_id);
alter table public.goal_resources enable row level security;
create policy "Users manage own goal resources" on public.goal_resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.goal_tasks
  add constraint goal_tasks_resource_fk foreign key (resource_id) references public.goal_resources(id) on delete set null;

create table public.goal_reviews (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.goal_subtopics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_reviewed_at timestamptz,
  next_review_at date not null default current_date,
  interval_stage integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subtopic_id)
);

create index goal_reviews_next_review_idx on public.goal_reviews(user_id, next_review_at);
alter table public.goal_reviews enable row level security;
create policy "Users manage own goal reviews" on public.goal_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_habit_links (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (goal_id, habit_id)
);

alter table public.goal_habit_links enable row level security;
create policy "Users manage own goal habit links" on public.goal_habit_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.goal_note_links (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  subtopic_id uuid references public.goal_subtopics(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (goal_id, note_id)
);

alter table public.goal_note_links enable row level security;
create policy "Users manage own goal note links" on public.goal_note_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sesiones: en vez de una tabla goal_sessions aparte, se reutilizan las
-- tablas que ya existen para Horario/Pomodoro (ver decisión confirmada).
alter table public.pomodoro_sessions
  add column if not exists goal_id uuid references public.goals(id) on delete set null,
  add column if not exists goal_subtopic_id uuid references public.goal_subtopics(id) on delete set null;

alter table public.schedule_blocks
  add column if not exists goal_id uuid references public.goals(id) on delete set null,
  add column if not exists goal_subtopic_id uuid references public.goal_subtopics(id) on delete set null;

create index if not exists pomodoro_sessions_goal_idx on public.pomodoro_sessions(goal_id);
create index if not exists schedule_blocks_goal_idx on public.schedule_blocks(goal_id);

-- ----------------------------------------------------------------------------
-- PROMESAS
-- ----------------------------------------------------------------------------
create table public.promises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'personal' check (type in ('yearly', 'change', 'creative', 'personal')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  start_date date not null default current_date,
  completed_date date,
  ideas text,
  related_goal_id uuid references public.goals(id) on delete set null,
  related_habit_id uuid references public.habits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index promises_user_idx on public.promises(user_id);
alter table public.promises enable row level security;
create policy "Users manage own promises" on public.promises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- PERSONALIZAR PANEL — qué secciones se ven en la navegación y en qué orden
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists visible_sections text[] not null default
    '{today,habits,schedule,notes,subjects,goals,promises,achievements}',
  add column if not exists section_order text[] not null default
    '{today,habits,schedule,notes,subjects,goals,promises,achievements}';
