import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { History, Moon, Sun, ChevronLeft } from "lucide-react";
import { definirTema } from "@/lib/treino-api";
import { useHydrated, useOnline, useTreino } from "@/lib/use-treino";

export function useTemaNoHtml() {
  const { tema } = useTreino();
  useEffect(() => {
    document.documentElement.classList.toggle("light", tema === "claro");
  }, [tema]);
}

export function SyncBadge() {
  const { series } = useTreino();
  const online = useOnline();
  const pend = series.filter((s) => !s.sincronizado).length;
  const ok = online && pend === 0;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      <span className={`size-2 rounded-full ${ok ? "bg-success" : "bg-chart-4"}`} />
      {!online ? `Offline · ${pend} pendente${pend === 1 ? "" : "s"}` : pend ? "Sincronizando…" : "Sincronizado"}
    </span>
  );
}

export function AppShell({ children, voltar, titulo }: { children: ReactNode; voltar?: boolean; titulo?: string }) {
  useTemaNoHtml();
  const { usuario, tema } = useTreino();
  const hidratado = useHydrated();
  const navigate = useNavigate();
  useEffect(() => {
    if (hidratado && !usuario) navigate({ to: "/entrar" });
  }, [hidratado, usuario, navigate]);

  if (!hidratado || !usuario) return <div className="min-h-dvh bg-background" />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/90 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          {voltar ? (
            <Link to="/" aria-label="Voltar" className="tap -ml-2 grid size-11 place-items-center rounded-full hover:bg-muted">
              <ChevronLeft className="size-6" />
            </Link>
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold uppercase leading-none tracking-wide">
              {titulo ?? <>Carga<span className="text-primary">.</span></>}
            </p>
            <SyncBadge />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={tema === "escuro" ? "Usar tema claro" : "Usar tema escuro"}
            onClick={() => definirTema(tema === "escuro" ? "claro" : "escuro")}
            className="tap grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            {tema === "escuro" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <Link to="/historico" aria-label="Histórico" className="tap grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted [&.active]:text-primary">
            <History className="size-5" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
