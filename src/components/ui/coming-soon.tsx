import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <p className="font-medium text-foreground">Este módulo se construye en la próxima fase</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          La base de datos y el diseño ya están listos para él. Esto es lo que traerá:
        </p>
        <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
