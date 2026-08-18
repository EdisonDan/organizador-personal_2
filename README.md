# Panel Personal

App web personal de productividad: hábitos, horario, notas y organización académica en un solo lugar. Next.js 16 + TypeScript + Tailwind CSS v4 en el frontend, Supabase (PostgreSQL + Auth + Storage) como backend.

Construida siguiendo `prompt-organizador-personal-app.md` completo, módulo por módulo, verificando con un build real después de cada uno.

## Qué incluye

**Fundación** — Auth con Supabase (correo/contraseña + Google), rutas protegidas, layout responsive (sidebar en escritorio, barra inferior en móvil), modo claro/oscuro, sistema de diseño propio.

**Módulo 1 · Hábitos** — CRUD con ícono o imagen propia, positivos y **negativos** como decisión central del formulario (no un detalle escondido: cambia el lenguaje en toda la app — "lo hice" vs "lo evité"). Escala de color continua de 6 tonos (rojo→verde, interpolada en RGB) en el heatmap mensual/anual, el anillo de progreso y el resumen semanal. Racha actual y más larga con lógica según frecuencia (diaria / días específicos / X veces por semana). Checklist diario animado, nota + foto de evidencia, reordenar con drag & drop.

**Módulo 2 · Horario** — Grilla semanal (día × hora) con time blocking real: arrastrar un bloque a otro día/hora, o clic en un espacio vacío para crear uno. Bloques recurrentes o de un solo día. Vista diaria, semanal y mensual. Pomodoro con temporizador circular configurable, sonido al cambiar de fase (Web Audio, sin archivos), conteo por materia y por día. Entregas y exámenes con cuenta regresiva ("Faltan 3 días").

**Módulo 3 · Notas** — Editor de texto enriquecido (Tiptap): negritas, títulos, listas, checklist, código, citas, enlaces e imágenes. Tres tipos de nota: normal, **tarjetas** (recuperación activa con modo repaso y autoevaluación) y **Feynman** (plantilla guía precargada). Repetición espaciada real con intervalos crecientes (1, 3, 7, 14, 30 días). Etiquetas, vínculos entre notas, buscador global.

**Módulo 4 · Materias** — Materias con color/ícono o portada propia; al crearlas se generan automáticamente sus semanas. Temas por semana con checkbox, fecha límite, y **vínculo real** a una nota y a un bloque de estudio existentes. Barra de progreso por materia y general. Interleaving real: la sugerencia "qué estudiar hoy" alterna materias en vez de agrupar varias seguidas de la misma.

**Módulo 5 · Dashboard** — Hábitos de hoy (con la misma escala de color), próximo bloque, notas para repasar, progreso de materias, racha global, mensaje motivacional dinámico. Widgets reordenables con drag & drop.

**Gamificación** — Racha global, puntos y nivel calculados en vivo desde la actividad real (hábitos, Pomodoros, temas, repasos) — no un contador que había que sincronizar a mano en cada acción. 8 insignias con condiciones reales, guardadas con fecha real la primera vez que se desbloquean.

**Personalización** — Modo claro/oscuro/sistema, 4 temas de color predefinidos + color propio, 3 tipografías (moderna/clásica/redondeada), imagen de fondo con capa de legibilidad, día de inicio de semana (aplicado a la grilla de Horario), formato de fecha.

**Datos** — Exportar todo a JSON, importar/restaurar (respeta las llaves foráneas entre tablas), botón de reset con confirmación explícita (escribir "BORRAR"). RLS en las 14 tablas. Estados de carga y error en toda la app.

## Ampliación: Objetivos, Promesas, Personalizar panel y Logros ampliados

Sobre `prompt-unificado-app.md`. Siguiendo el orden que pediste ahí mismo (base de datos completa → Promesas de calentamiento → Objetivos → Personalizar panel → lector de PDF), esta entrega cubre las dos primeras etapas:

- **Base de datos completa** (`0005_goals_promises_panel.sql`): las 8 tablas de Objetivos y Promesas, más las columnas de Personalizar panel — todo de una vez, aunque la interfaz de Objetivos y Personalizar panel todavía no exista. Dos decisiones que confirmaste antes de escribir esto:
  - `primary_habit_id` en `goals` (para mostrarlo rápido) + tabla `goal_habit_links` para la relación completa con varios hábitos.
  - Sin tabla `goal_sessions` aparte: se reutilizan `pomodoro_sessions` y `schedule_blocks` con `goal_id`/`goal_subtopic_id` opcionales, mismo patrón que ya usa Materias con `topic_id`.
- **Promesas, completo**: CRUD con tipo (del año / de cambio / creativa / personal), ideas de apoyo, vínculo opcional a un hábito existente, botón "Cumplida" con confirmación, filtro para ver archivadas/pausadas.
- **Logros ampliados**: 5 insignias nuevas (primera promesa, 5, 10, promesa del año, promesa creativa) en el mismo sistema que ya existía — se revisan y se desbloquean **al momento** de marcar una promesa como cumplida, no solo la próxima vez que entres a Logros. Cumplir una promesa también suma puntos.
- **Perfil ampliado**: contador "Promesas cumplidas" y tarjeta "Última promesa cumplida".
- **Navegación reorganizada**: con Objetivos y Promesas, el menú principal ya son 7 secciones — mucho para la barra inferior de un teléfono. La barra inferior ahora muestra las primeras 4 y un botón "Más" con el resto (incluye Logros, Perfil, Configuración). En escritorio, el sidebar los muestra todos.
- **Objetivos**: página lista pero marcada como "próxima fase" — es la pieza más grande de las cuatro, sigue en la siguiente entrega.

- **Objetivos, completo**: la pieza más grande de las cuatro.
  - CRUD con categoría, prioridad, color/ícono, nivel inicial→meta, hábito principal y materia relacionada.
  - Cada objetivo tiene 9 pestañas: Resumen (con plan de estudio integrado), Subtemas (estado real: no iniciado/entendiendo/practicando/consolidado), Tareas (9 tipos educativos: leer, ver recurso, ejercicios, resumir, active recall, repasar, práctica guiada, mini evaluación, proyecto), Hábitos vinculados (con su consistencia real, no solo el nombre), Sesiones (Pomodoro embebido, preseleccionado a este objetivo), Notas (vincular existente o crear nueva desde ahí), Repasos (repetición espaciada real sobre subtemas, mismo algoritmo que Notas), Recursos, y Estadísticas.
  - **"Qué estudiar hoy" real**: prioriza repaso vencido → tarea sugerida → siguiente subtema sin empezar, por objetivo, e intercala entre objetivos activos con el mismo algoritmo de Materias — probado con casos de prueba (incluye que un objetivo pausado no aparece).
  - Alertas reales de "llevas N días sin avanzar en este objetivo", calculadas desde la última vez que se estudió algo.
  - El Pomodoro de Horario ahora también puede vincularse a un objetivo, no solo a una materia.
  - El dashboard de Hoy ya muestra el progreso de tus objetivos activos y la siguiente tarea sugerida.
  - Simplificación honesta: el gráfico de "evolución semanal" que pedía el prompt en Estadísticas se reemplazó por las cifras agregadas (esta semana / total / racha) — un gráfico de series de tiempo completo se puede agregar después si hace falta.

Pendiente del prompt unificado: Personalizar panel (mostrar/ocultar secciones — la base de datos ya está lista desde la migración anterior) y el lector de PDF.

## Ronda de ajustes (sobre comentarios directos)

- **Fondo personalizable de verdad**: además de imagen de fondo, ahora hay color de fondo sólido — 4 preestablecidos (gris claro, gris oscuro, negro suave, azul noche) o cualquier color propio. Las tarjetas y el texto se ajustan solos para seguir combinando y leyéndose bien.
- **Registrar un día pasado en Hábitos**: en el detalle de un hábito, el calendario ahora se puede clicar — cualquier día de hoy hacia atrás abre el registro para marcarlo como hecho/evitado, con nota y foto si quieres. Antes solo se podía marcar "hoy" desde el checklist.
- **Vista de cuadrícula para Hábitos**: nueva pestaña "Cuadrícula" en Hábitos — hábitos como filas, días del mes como columnas, clic para marcar. Con el mismo estilo (colores, tipografía) del resto de la app en vez de copiar un esquema de colores fijo, para que respete tu personalización.
- **Materias por semestre y parcial**: cada materia puede llevar una etiqueta de semestre (agrupa la lista de materias cuando hay más de uno), y las semanas se dividen automáticamente en Primer y Segundo parcial dentro de cada materia.
- **Horario más pulido**: bloques con ícono según su tipo, mejor contraste y sombra, franjas suaves cada hora para orientarte mejor en la grilla, y una línea roja que marca la hora actual en el día de hoy.
- **Panel lateral contraíble**: flecha junto al panel para contraerlo a solo íconos; se recuerda tu preferencia.

## Decisiones de diseño que vale la pena conocer

- **Puntos, nivel y racha se recalculan en vivo**, no se leen de una columna cacheada. Evita que el número mostrado se desincronice de la actividad real; a escala personal el costo extra es imperceptible.
- **Semana empieza en lunes por defecto**, configurable en Configuración — pero ese ajuste solo está conectado a la grilla de Horario por ahora. El cálculo de "X veces por semana" de Hábitos sigue usando lunes fijo (afecta poco: es solo el punto de corte de la semana, no si el hábito cuenta o no).
- **Formato de fecha** se guarda como preferencia real, pero la mayoría de fechas en la app ya se muestran en español sin ambigüedad ("sábado 1 de agosto"), así que su impacto práctico es acotado a los pocos lugares con fecha corta numérica.
- El **esquema es un poco más granular** que el del prompt original: separé `subject_topics` en su propia tabla en vez de un array, y agregué `deadlines` y `pomodoro_sessions`, necesarias para funciones que el prompt describe pero no había modelado como tabla. También agregué una migración aditiva (`0002`) para que temas se puedan vincular a notas y bloques de estudio específicos, y otra (`0003`) para el orden de widgets.

## Puesta en marcha

### 1. Crea tu proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com), crea una cuenta gratuita y un proyecto nuevo.
2. En **Authentication > Sign In / Providers**, activa "Email" (ya viene activo) y, si quieres login con Google, actívalo y configura el Client ID/Secret de Google Cloud.
3. En **Authentication > URL Configuration**, agrega `http://localhost:3000/auth/callback` a las Redirect URLs (y la URL de producción cuando despliegues).

### 2. Crea las tablas

En **SQL Editor**, ejecuta en orden los tres archivos de `supabase/migrations/`:

1. `0001_init.sql` — esquema completo, RLS, bucket de Storage.
2. `0002_topic_links.sql` — vínculo tema → nota / bloque de estudio.
3. `0003_personalization.sql` — orden de widgets del dashboard.
4. `0004_background_and_semester.sql` — color de fondo propio, semestre por materia.
5. `0005_goals_promises_panel.sql` — Objetivos, Promesas, vínculos de sesión, personalizar panel.

### 3. Configura las variables de entorno

1. En Supabase: **Project Settings > API**, copia el **Project URL** y la **Publishable key** (no la Secret key).
2. `cp .env.local.example .env.local` y pega esos dos valores.

### 4. Instala y corre

```bash
npm install
npm run dev
```

Abre http://localhost:3000, crea una cuenta y ya deberías estar en el dashboard.

### 5. Desplegar en Vercel

1. Sube el proyecto a GitHub.
2. Impórtalo en vercel.com y agrega las mismas dos variables de entorno.
3. Agrega `https://tu-app.vercel.app/auth/callback` a las Redirect URLs de Supabase.

## Tipos generados por Supabase (opcional)

`src/lib/types.ts` tiene tipos escritos a mano que coinciden con el esquema. Con el proyecto ya conectado, puedes generar tipos exactos:

```bash
npx supabase gen types typescript --project-id <tu-project-id> > src/lib/supabase/database.types.ts
```

## Estructura del proyecto

```
src/
  app/
    login/, signup/, auth/callback/     → autenticación (públicas)
    (dashboard)/                        → rutas protegidas (requieren sesión)
      today/                            → Módulo 5: Dashboard, widgets reordenables
      habits/                           → Módulo 1: CRUD, heatmap, rachas, drag & drop
      schedule/                         → Módulo 2: grilla drag & drop, Pomodoro, entregas
      notes/                            → Módulo 3: editor Tiptap, tarjetas, repaso espaciado
      subjects/                         → Módulo 4: semanas, temas, vínculos, interleaving
      achievements/                     → Gamificación: racha, puntos, nivel, insignias
      profile/ settings/                → perfil y personalización + datos
  components/
    habits/ schedule/ notes/ subjects/ achievements/ settings/ dashboard/
    layout/                             → Sidebar, BottomNav, TopBar
    ui/                                 → EmptyState, ComingSoon, Dialog
    personalization-provider.tsx        → aplica color de acento y tipografía en vivo
  lib/
    habits/ schedule/ notes/ subjects/ gamification/  → lógica de cada módulo
    storage.ts                          → subida de archivos a Supabase Storage
    color-utils.ts, theme-presets.ts    → personalización
    supabase/                           → clientes de Supabase (browser/server)
    types.ts                            → tipos de dominio
  proxy.ts                              → refresca la sesión y protege rutas (Next.js 16)
supabase/
  migrations/0001_init.sql              → esquema completo + RLS + Storage
  migrations/0002_topic_links.sql       → vínculo tema → nota / bloque de estudio
  migrations/0003_personalization.sql   → orden de widgets del dashboard
  migrations/0004_background_and_semester.sql → color de fondo propio, semestre por materia
  migrations/0005_goals_promises_panel.sql → Objetivos, Promesas, personalizar panel
```

## Ideas para seguir puliendo (no son parte del prompt original)

- Reemplazar el conteo de `console.error` en logros por un log real si el proyecto crece.
- Mover el cálculo de racha/puntos a una vista materializada o trigger si la cantidad de datos crece mucho (a escala personal no hace falta).
- Extender el día de inicio de semana a la lógica de rachas semanales de Hábitos, no solo a la grilla de Horario.
