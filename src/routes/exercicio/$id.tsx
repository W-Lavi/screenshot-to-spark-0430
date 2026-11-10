import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { buscarSeries, editarSerie, excluirSerie, registrarSerie, restaurarSerie, type Serie } from "@/lib/treino-api";
import { useTreino } from "@/lib/use-treino";

export const Route = createFileRoute("/exercicio/$id")({
  head: () => ({
    meta: [
      { title: "Registrar série — Carga" },
      { name: "description", content: "Veja a carga do último treino e registre a série de hoje." },
      { property: "og:title", content: "Registrar série — Carga" },
      { property: "og:description", content: "Hoje vs treino anterior, série a série." },
    ],
  }),
  component: Detalhe,
});

const fmtData = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

function Detalhe() {
  const { id } = Route.useParams();
  const estado = useTreino();
  const ex = estado.exercicios.find((e) => e.id === id);
  return (
    <AppShell voltar titulo={ex?.nome ?? "Exercício"}>
      {estado.exercicios.length && !ex ? (
        <p className="mt-10 text-center text-muted-foreground">Exercício não encontrado. <Link to="/" className="text-primary">Voltar</Link></p>
      ) : ex ? <Conteudo id={id} /> : null}
    </AppShell>
  );
}

function Conteudo({ id }: { id: string }) {
  const estado = useTreino();
  const { hoje, anterior, dataAnterior } = buscarSeries(id, estado);
  const base = hoje.at(-1) ?? anterior.at(-1);
  const [peso, setPeso] = useState(base?.peso ?? 20);
  const [reps, setReps] = useState(base?.reps ?? 10);
  const [editando, setEditando] = useState<Serie | null>(null);
  const [desfazer, setDesfazer] = useState<Serie | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!desfazer) return;
    const t = setTimeout(() => setDesfazer(null), 4000);
    return () => clearTimeout(t);
  }, [desfazer]);

  const salvar = () => {
    registrarSerie(id, peso, reps);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 900);
  };
  const excluir = (s: Serie) => { excluirSerie(s.id); setDesfazer(s); setEditando(null); };

  return (
    <main className="flex flex-1 flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {anterior.length
          ? <>Última vez ({fmtData(dataAnterior!)}): <span className="num text-foreground">{anterior.at(-1)!.peso} kg × {anterior.at(-1)!.reps}</span>. Bora superar.</>
          : "Primeira vez nesse exercício. Hoje vira sua referência."}
      </p>

      <Stepper label="Peso" unidade="kg" valor={peso} onChange={setPeso} passos={[1, 5]} />
      <Stepper label="Repetições" unidade="reps" valor={reps} onChange={setReps} passos={[1]} />

      <button
        onClick={salvar}
        className="tap h-16 rounded-2xl bg-primary font-display text-2xl font-bold uppercase text-primary-foreground"
      >
        {salvo ? "Salvo ✓" : `Salvar série ${hoje.length + 1}`}
      </button>

      <section className="mt-3">
        <h2 className="mb-2 flex items-baseline justify-between font-display text-xl font-bold uppercase">
          Hoje <span className="text-sm font-normal normal-case text-muted-foreground">toque para editar · deslize para excluir</span>
        </h2>
        {hoje.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-muted-foreground">Nenhuma série ainda. A primeira é a mais difícil.</p>
        ) : (
          <ul className="space-y-2">
            {hoje.map((s, i) => (
              <LinhaHoje key={s.id} s={s} i={i} anterior={anterior[i]} onTap={() => setEditando(s)} onSwipe={() => excluir(s)} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3">
        <h2 className="mb-2 flex items-baseline justify-between font-display text-xl font-bold uppercase text-muted-foreground">
          Treino anterior {dataAnterior ? <span className="text-sm font-normal normal-case">{fmtData(dataAnterior)}</span> : null}
        </h2>
        {anterior.length === 0 ? (
          <p className="text-muted-foreground">Sem histórico ainda.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl bg-card/60 px-4">
            {anterior.map((s, i) => (
              <li key={s.id} className="flex h-12 items-center justify-between text-muted-foreground">
                <span>Série {i + 1}</span>
                <span className="num text-lg">{s.peso} kg × {s.reps}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editando ? <PainelEditar s={editando} onClose={() => setEditando(null)} onExcluir={() => excluir(editando)} /> : null}

      {desfazer ? (
        <div className="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg">
          <span>Série excluída</span>
          <button
            className="tap font-semibold text-primary"
            onClick={() => { restaurarSerie(desfazer); setDesfazer(null); }}
          >Desfazer</button>
        </div>
      ) : null}
    </main>
  );
}


function Diferenca({ atual, antes }: { atual: Serie; antes?: Serie }) {
  if (!antes) return <span className="text-xs text-muted-foreground">nova</span>;
  const d = Math.round((atual.peso - antes.peso) * 10) / 10;
  if (d > 0) return <span className="flex items-center gap-0.5 text-sm font-semibold text-success"><ArrowUp className="size-4" />{d} kg</span>;
  if (d < 0) return <span className="flex items-center gap-0.5 text-sm font-semibold text-destructive"><ArrowDown className="size-4" />{Math.abs(d)} kg</span>;
  return <span className="flex items-center gap-0.5 text-sm text-muted-foreground"><Minus className="size-4" />igual</span>;
}

function LinhaHoje({ s, i, anterior, onTap, onSwipe }: { s: Serie; i: number; anterior?: Serie; onTap: () => void; onSwipe: () => void }) {
  const [dx, setDx] = useState(0);
  const inicio = useRef<number | null>(null);
  const moveu = useRef(false);
  return (
    <li className="relative overflow-hidden rounded-2xl bg-destructive">
      <span className="absolute inset-y-0 right-4 flex items-center text-destructive-foreground"><Trash2 className="size-5" /></span>
      <button
        onPointerDown={(e) => { inicio.current = e.clientX; moveu.current = false; }}
        onPointerMove={(e) => {
          if (inicio.current === null) return;
          const d = Math.min(0, e.clientX - inicio.current);
          if (d < -8) moveu.current = true;
          setDx(d);
        }}
        onPointerUp={() => {
          if (dx < -100) onSwipe();
          else if (!moveu.current) onTap();
          inicio.current = null; setDx(0);
        }}
        onPointerCancel={() => { inicio.current = null; setDx(0); }}
        style={{ transform: `translateX(${dx}px)`, touchAction: "pan-y" }}
        className="flex h-16 w-full items-center justify-between bg-card px-4 text-left transition-transform"
      >
        <span className="text-muted-foreground">Série {i + 1}</span>
        <span className="flex items-center gap-3">
          <span className="num text-2xl">{s.peso} kg × {s.reps}</span>
          <Diferenca atual={s} antes={anterior} />
        </span>
      </button>
    </li>
  );
}

function PainelEditar({ s, onClose, onExcluir }: { s: Serie; onClose: () => void; onExcluir: () => void }) {
  const [peso, setPeso] = useState(s.peso);
  const [reps, setReps] = useState(s.reps);
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-label="Editar série" onClick={(e) => e.stopPropagation()}
        className="animate-sheet mx-auto w-full max-w-md space-y-3 rounded-t-3xl border-t border-border bg-popover p-4 pb-8">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />
        <h3 className="font-display text-2xl font-bold uppercase">Editar série</h3>
        <Stepper label="Peso" unidade="kg" valor={peso} onChange={setPeso} passos={[1, 5]} />
        <Stepper label="Repetições" unidade="reps" valor={reps} onChange={setReps} passos={[1]} />
        <div className="flex gap-2">
          <button onClick={onExcluir} className="tap h-14 flex-1 rounded-2xl border border-destructive font-semibold text-destructive">Excluir</button>
          <button onClick={() => { editarSerie(s.id, peso, reps); onClose(); }}
            className="tap h-14 flex-[2] rounded-2xl bg-primary font-display text-xl font-bold uppercase text-primary-foreground">Salvar</button>
        </div>
      </div>
    </div>
  );
}
