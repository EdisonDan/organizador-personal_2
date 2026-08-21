"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Link2, Video, FileText, ExternalLink, Loader2, UploadCloud } from "lucide-react";
import { createResource, deleteResource, updateResourcePage } from "@/app/(dashboard)/goals/actions";
import { uploadFile } from "@/lib/storage";
import type { Goal, GoalResource, GoalResourceType, GoalSubtopic } from "@/lib/types";

// El visor de PDF solo puede correr en el cliente (pdf.js no soporta SSR).
const PdfViewer = dynamic(() => import("@/components/goals/pdf-viewer").then((m) => m.PdfViewer), { ssr: false });

const TYPE_META: Record<GoalResourceType, { label: string; icon: typeof Link2 }> = {
  pdf: { label: "PDF", icon: FileText },
  link: { label: "Enlace", icon: Link2 },
  video: { label: "Video", icon: Video },
  other: { label: "Otro", icon: FileText },
};

export function GoalResourcesTab({
  goal,
  resources,
  subtopics,
  userId,
}: {
  goal: Goal;
  resources: GoalResource[];
  subtopics: GoalSubtopic[];
  userId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [openPdf, setOpenPdf] = useState<GoalResource | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Recursos</p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary text-xs">
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {showForm && <ResourceForm goal={goal} subtopics={subtopics} userId={userId} onDone={() => setShowForm(false)} />}

      {resources.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Enlaces, videos o PDFs que uses para estudiar este objetivo.
        </p>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            const isPdf = r.type === "pdf" && r.url;
            return (
              <li key={r.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                <button
                  type="button"
                  disabled={!isPdf}
                  onClick={() => isPdf && setOpenPdf(r)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground disabled:cursor-default"
                >
                  <Icon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!isPdf}
                  onClick={() => isPdf && setOpenPdf(r)}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                >
                  <p className="truncate text-sm text-foreground">{r.title}</p>
                  <p className="tabular-stat text-[10px] text-muted-foreground">
                    {meta.label}
                    {isPdf && r.current_page > 1 && ` · pág. ${r.current_page}`}
                  </p>
                </button>
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

      {openPdf && openPdf.url && (
        <PdfViewer
          url={openPdf.url}
          title={openPdf.title}
          initialPage={openPdf.current_page}
          onClose={() => setOpenPdf(null)}
          onPageChange={(page) => updateResourcePage(openPdf.id, goal.id, page).catch(() => {})}
        />
      )}
    </div>
  );
}

function ResourceForm({
  goal,
  subtopics,
  userId,
  onDone,
}: {
  goal: Goal;
  subtopics: GoalSubtopic[];
  userId: string;
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalResourceType>("link");
  const [url, setUrl] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePdfPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadFile(userId, file, `goals/${goal.id}/resources`);
      setUrl(uploaded.url);
      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el PDF.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (!url.trim()) {
      setError(type === "pdf" ? "Sube un archivo PDF." : "Agrega una URL.");
      return;
    }
    setSaving(true);
    try {
      await createResource(goal.id, { title: title.trim(), type, url: url.trim(), subtopic_id: subtopicId || null });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el recurso.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del recurso" className="input" autoFocus />
      <div className="flex gap-2">
        {(Object.keys(TYPE_META) as GoalResourceType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setUrl("");
              setError(null);
            }}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              type === t ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {type === "pdf" ? (
        url ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary">
            <FileText className="h-3.5 w-3.5" />
            PDF listo para guardar
          </p>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Subir PDF
          </button>
        )
      ) : (
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="input" />
      )}
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfPick} />

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

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

      <button type="submit" disabled={saving || uploading} className="btn-primary w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Agregar recurso
      </button>
    </form>
  );
}
