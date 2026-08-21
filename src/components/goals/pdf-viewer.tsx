"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Loader2 } from "lucide-react";

// El worker se debe configurar en el mismo archivo donde se usan <Document>/<Page>,
// o el orden de ejecución de módulos puede pisar la configuración.
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export function PdfViewer({
  url,
  title,
  initialPage,
  onClose,
  onPageChange,
}: {
  url: string;
  title: string;
  initialPage: number;
  onClose: () => void;
  onPageChange: (page: number) => void;
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(Math.max(initialPage, 1));
  const [scale, setScale] = useState(1.1);
  const [error, setError] = useState<string | null>(null);

  function goTo(next: number) {
    if (!numPages) return;
    const clamped = Math.min(Math.max(next, 1), numPages);
    setPage(clamped);
    onPageChange(clamped);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
            aria-label="Alejar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="tabular-stat w-10 text-center text-xs text-white/70">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
            aria-label="Acercar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {error ? (
          <p className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white">{error}</p>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              if (initialPage > n) goTo(1);
            }}
            onLoadError={() => setError("No se pudo cargar el PDF. Revisa que el archivo siga disponible.")}
            loading={<Loader2 className="h-6 w-6 animate-spin text-white/70" />}
          >
            <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="tabular-stat text-sm text-white">
          {page} {numPages ? `/ ${numPages}` : ""}
        </span>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={!numPages || page >= numPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 disabled:opacity-30"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
