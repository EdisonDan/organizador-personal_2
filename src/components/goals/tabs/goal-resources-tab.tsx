"use client";

import { useState } from "react";
import { Plus, Trash2, Link2, Video, FileText, ExternalLink } from "lucide-react";
import { createResource, deleteResource } from "@/app/(dashboard)/goals/actions";
import type { Goal, GoalResource, GoalResourceType, GoalSubtopic } from "@/lib/types";

const TYPE_META: Record<GoalResourceType, { label: string; icon: typeof Link2 }> = {
  pdf: { label: "PDF", icon: FileText },
  link: { label: "Enlace", icon: Link2 },
  video: { label: "Video", icon: Video },
  other: { label: "Otro", icon: FileText },
};

export function GoalResourcesTab({ goal, resources, subtopics }: { goal: Goal; resources: GoalResource[]; subtopics: GoalSubtopic[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Recursos</p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary text-xs">
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {showForm && <ResourceForm goal={goal} subtopics={subtopics} onDone={() => setShowForm(false)} />}

      {resources.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Enlaces, videos o PDFs que uses para estudiar este objetivo.
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            return (
              <li key={r.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {meta.label}
                    {r.type === "pdf" && " · lector dentro de la app: próxima fase"}
                  </p>
                </div>
                {r.url && r.type !== "pdf" && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => deleteResource(r.id, goal.id).catch(() => {})}
                  aria-label="Eliminar recurso"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ResourceForm({ goal, subtopics, onDone }: { goal: Goal; subtopics: GoalSubtopic[]; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalResourceType>("link");
  const [url, setUrl] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await createResource(goal.id, { title: title.trim(), type, url: url.trim() || null, subtopic_id: subtopicId || null }).catch(
      () => {}
    );
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del recurso" className="input" autoFocus />
      <div className="flex gap-2">
        {(["link", "video", "other"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              type === t ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {TYPE_META[t].label}
          </button>
        ))}
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="input" />
      {subtopics.length > 0 && (
        <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} className="input">
          <option value="">Sin subtema</option>
          {subtopics.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      )}
      <button type="submit" disabled={saving} className="btn-primary w-full">
        Agregar recurso
      </button>
    </form>
  );
}
