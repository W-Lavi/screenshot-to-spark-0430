import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { listarHistorico, sair } from "@/lib/treino-api";
import { useTreino } from "@/lib/use-treino";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Carga" },
      { name: "description", content: "Seus treinos por data, limpos e organizados." },
      { property: "og:title", content: "Histórico — Carga" },
      { property: "og:description", content: "Seus treinos por data, limpos e organizados." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const estado = useTreino();
  const dias = listarHistorico(estado);
  return (
    <AppShell voltar titulo="Histórico">
      <main className="space-y-6">
        {dias.length === 0 ? <p className="mt-10 text-center text-muted-foreground">Seu primeiro treino aparece aqui.</p> : null}
        {dias.map((d) => (
          <section key={d.data}>
            <h2 className="mb-2 font-display text-lg font-bold uppercase text-primary">
              {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h2>
            <div className="space-y-2">
              {d.exercicios.map((ex) => (
                <div key={ex.nome} className="rounded-2xl bg-card p-4">
                  <p className="font-semibold">{ex.nome}</p>
                  <p className="num mt-1 text-lg text-muted-foreground">
                    {ex.series.map((s) => `${s.peso}×${s.reps}`).join("  ·  ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
        <button onClick={sair} className="tap w-full py-4 text-sm text-muted-foreground underline">Trocar apelido</button>
      </main>
    </AppShell>
  );
}
