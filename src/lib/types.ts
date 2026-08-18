// Tipos de dominio, alineados con supabase/migrations/0001_init.sql
// Cuando el proyecto de Supabase esté conectado, se pueden reemplazar por
// tipos generados automáticamente con:
//   npx supabase gen types typescript --project-id <tu-project-id> > src/lib/supabase/database.types.ts

export type Theme = "light" | "dark" | "system";
export type FontPref = "sans" | "serif" | "rounded";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: Theme;
  accent_color: string;
  font_pref: FontPref;
  week_start_day: number;
  date_format: string;
  background_image_url: string | null;
  background_color: string | null;
  dashboard_widget_order: string[];
  visible_sections: string[];
  section_order: string[];
  points: number;
  level: number;
  current_global_streak: number;
  longest_global_streak: number;
  last_active_date: string | null;
  created_at: string;
}

export type HabitType = "positive" | "negative";
export type FrequencyType = "daily" | "weekly_count" | "specific_days";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  icon: string | null;
  image_url: string | null;
  color: string;
  category: string | null;
  frequency_type: FrequencyType;
  frequency_config: Record<string, unknown>;
  goal_value: number | null;
  goal_unit: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  value: number | null;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  cover_image_url: string | null;
  semester_label: string | null;
  semester_start_date: string | null;
  semester_weeks: number;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export interface SubjectWeek {
  id: string;
  subject_id: string;
  user_id: string;
  week_number: number;
  title: string | null;
  created_at: string;
}

export interface SubjectTopic {
  id: string;
  week_id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

export type DeadlineType = "exam" | "assignment" | "other";

export interface Deadline {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  due_date: string;
  type: DeadlineType;
  completed: boolean;
  created_at: string;
}

export type BlockType = "class" | "study" | "habit" | "break";

export interface ScheduleBlock {
  id: string;
  user_id: string;
  title: string;
  block_type: BlockType;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  repeats: boolean;
  subject_id: string | null;
  habit_id: string | null;
  topic_id: string | null;
  goal_id: string | null;
  goal_subtopic_id: string | null;
  color: string | null;
  created_at: string;
}

export interface PomodoroSession {
  id: string;
  user_id: string;
  subject_id: string | null;
  schedule_block_id: string | null;
  goal_id: string | null;
  goal_subtopic_id: string | null;
  started_at: string;
  duration_minutes: number;
  completed: boolean;
}

export type NoteType = "normal" | "flashcards" | "feynman";

export interface Note {
  id: string;
  user_id: string;
  subject_id: string | null;
  week_id: string | null;
  topic_id: string | null;
  title: string;
  content: Record<string, unknown>;
  note_type: NoteType;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  note_id: string;
  user_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface NoteReview {
  id: string;
  note_id: string;
  user_id: string;
  last_reviewed_at: string | null;
  next_review_at: string;
  interval_stage: number;
  created_at: string;
}

export interface NoteLink {
  id: string;
  user_id: string;
  from_note_id: string;
  to_note_id: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  unlocked_at: string;
}

// ---------------------------------------------------------------- Objetivos --

export type GoalStatus = "active" | "paused" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  color: string;
  icon: string | null;
  status: GoalStatus;
  priority: number; // 1-3
  start_date: string;
  target_date: string | null;
  initial_level: number | null;
  target_level: number | null;
  progress_pct: number;
  primary_habit_id: string | null;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SubtopicStatus = "no_iniciado" | "entendiendo" | "practicando" | "consolidado";

export interface GoalSubtopic {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  difficulty: number | null;
  status: SubtopicStatus;
  progress_pct: number;
  estimated_minutes: number | null;
  invested_minutes: number;
  last_studied_at: string | null;
  next_review_at: string | null;
  created_at: string;
}

export type GoalTaskType =
  | "leer"
  | "ver_recurso"
  | "ejercicios"
  | "resumir"
  | "active_recall"
  | "repasar"
  | "practica_guiada"
  | "mini_evaluacion"
  | "proyecto";

export interface GoalTask {
  id: string;
  goal_id: string;
  user_id: string;
  subtopic_id: string | null;
  note_id: string | null;
  resource_id: string | null;
  title: string;
  description: string | null;
  task_type: GoalTaskType;
  difficulty: number | null;
  priority: number;
  estimated_minutes: number | null;
  completed: boolean;
  suggested_date: string | null;
  due_date: string | null;
  counts_as_habit: boolean;
  sort_order: number;
  created_at: string;
}

export type GoalResourceType = "pdf" | "link" | "video" | "other";

export interface GoalResource {
  id: string;
  goal_id: string;
  user_id: string;
  subtopic_id: string | null;
  title: string;
  type: GoalResourceType;
  url: string | null;
  current_page: number;
  page_count: number | null;
  created_at: string;
}

export interface GoalReview {
  id: string;
  subtopic_id: string;
  user_id: string;
  last_reviewed_at: string | null;
  next_review_at: string;
  interval_stage: number;
  created_at: string;
}

export interface GoalHabitLink {
  id: string;
  goal_id: string;
  habit_id: string;
  user_id: string;
}

export interface GoalNoteLink {
  id: string;
  goal_id: string;
  note_id: string;
  subtopic_id: string | null;
  user_id: string;
}

// ----------------------------------------------------------------- Promesas --
// Se llama "Promise_" (con guion bajo) para no chocar con el tipo global
// Promise<T> de TypeScript/JavaScript.

export type PromiseType = "yearly" | "change" | "creative" | "personal";
export type PromiseStatus = "active" | "paused" | "completed" | "archived";

export interface Promise_ {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: PromiseType;
  status: PromiseStatus;
  start_date: string;
  completed_date: string | null;
  ideas: string | null;
  related_goal_id: string | null;
  related_habit_id: string | null;
  created_at: string;
  updated_at: string;
}
