"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { exportAllData, importAllData, resetAllData } from "@/app/(dashboard)/settings/actions";

export function DataManagement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await exportAllData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `panel-personal-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed?.data) throw new Error("El archivo no tiene el formato esperado.");
      const result = await importAllData({ data: parsed.data });
      setImportMessage(
        result.errors.length > 0
          ? `Se importaron ${result.imported} registros, con algunos errores: ${result.errors.join("; ")}`
          : `Se importaron ${result.imported} registros correctamente.`
      );
    } catch (err) {
      setImportMessage(err instanceof Error ? `No se pudo importar: ${err.message}` : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleReset() {
    setResetting(true);
    await resetAllData().catch(() => {});
    setResetting(false);
    setShowResetConfirm(false);
    setConfirmText("");
    setResetDone(true);
  }

  return (
    <div className="space-y-5">
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <p className="mb-1 text-sm font-medium text-foreground">Respaldo de tus datos</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Descarga todo lo que tienes guardado (hábitos, horario, notas, materias) en un archivo JSON.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={handleExport} disabled={exporting} className="btn-secondary">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar a JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn-secondary"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar / restaurar
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
        </div>
        {importMessage && <p className="mt-3 text-xs text-muted-foreground">{importMessage}</p>}
      </section>

      <section className="max-w-lg rounded-2xl border border-destructive/30 bg-card p-6">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Zona de peligro
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Borra todos tus hábitos, horario, notas, materias y logros. Tu cuenta y tus preferencias se mantienen. Esto
          no se puede deshacer.
        </p>

        {resetDone ? (
          <p className="text-xs text-muted-foreground">Listo, tus datos fueron borrados.</p>
        ) : !showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Borrar todos mis datos
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-foreground">
              Escribe <span className="font-mono font-semibold">BORRAR</span> para confirmar.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input max-w-40"
              placeholder="BORRAR"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setConfirmText("");
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={confirmText !== "BORRAR" || resetting}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sí, borrar todo
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
