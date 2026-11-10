import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { buscarExercicios, buscarSeries, criarExercicio } from "@/lib/treino-api";
import { useTreino } from "@/lib/use-treino";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Registrar — Carga" },
      { name: "description", content: "Busque o exercício, veja a carga da última vez e registre a série." },
      { property: "og:title", content: "Carga — anote, compare, evolua" },
      { property: "og:description", content: "Rastreador minimalista de progressão de cargas para musculação." },
    ],
  }),
  component: Registrar,
});

function Registrar() {
  return (
    <AppShell>
      <Busca />
    </AppShell>
  );
}

function Busca() {
  const estado = useTreino();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const lista = useMemo(() => buscarExercicios(q, estado), [q, estado]);
  const exato = lista.some((e) => e.nome.toLowerCase() === q.trim().toLowerCase());

  const novo = () => {
    const ex = criarExercicio(q);
    navigate({ to: "/exercicio/$id", params: { id: ex.id } });
  };

  return (
    <main className="flex flex-1 flex-col">
      <h1 className="mb-3 mt-2 font-display text-3xl font-bold uppercase">
        E aí, {estado.usuario}. <span className="text-muted-foreground">Qual é agora?</span>
      </h1>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && lista[0]) navigate({ to: "/exercicio/$id", params: { id: lista[0].id } });
          }}
          placeholder="Buscar exercício"
          aria-label="Buscar exercício"
          className="h-16 w-full rounded-2xl border border-input bg-card pl-12 pr-4 text-xl outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <ul className="mt-3 divide-y divide-border">
        {lista.map((ex) => {
          const { anterior, hoje } = buscarSeries(ex.id, estado);
          const ref = hoje.at(-1) ?? anterior.at(-1);
          return (
            <li key={ex.id}>
              <Link
                to="/exercicio/$id"
                params={{ id: ex.id }}
                className="tap flex min-h-16 items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-lg font-medium">{ex.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {hoje.length ? `${hoje.length} série${hoje.length > 1 ? "s" : ""} hoje` : ref ? "Última vez" : "Primeira vez"}
                    {ref ? <> · <span className="num text-foreground">{ref.peso} kg × {ref.reps}</span></> : null}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>

      {q.trim().length >= 2 && !exato ? (
        <button onClick={novo} className="tap mt-3 flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 text-lg font-semibold text-primary">
          <Plus className="size-5" /> Criar “{q.trim()}”
        </button>
      ) : null}
      {lista.length === 0 && q.trim().length < 2 ? (
        <p className="mt-8 text-center text-muted-foreground">Nada por aqui. Digite para criar.</p>
      ) : null}
    </main>
  );
}
