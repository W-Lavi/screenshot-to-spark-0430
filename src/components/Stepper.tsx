export function Stepper({ label, valor, unidade, onChange, passos }: {
  label: string; valor: number; unidade: string; onChange: (v: number) => void; passos: number[];
}) {
  const btn = "tap h-14 flex-1 rounded-xl bg-secondary text-lg font-semibold num active:bg-accent";
  const set = (v: number) => onChange(Math.max(0, Math.round(v * 2) / 2));
  return (
    <div className="rounded-2xl bg-card p-3">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="num my-1 text-center text-6xl leading-none" aria-live="polite">
        {valor}<span className="ml-1 text-xl text-muted-foreground">{unidade}</span>
      </p>
      <div className="mt-2 flex gap-2">
        {[...passos].reverse().map((p) => (
          <button key={"m" + p} className={btn} onClick={() => set(valor - p)} aria-label={`Menos ${p} ${unidade}`}>−{p}</button>
        ))}
        {passos.map((p) => (
          <button key={"p" + p} className={btn} onClick={() => set(valor + p)} aria-label={`Mais ${p} ${unidade}`}>+{p}</button>
        ))}
      </div>
    </div>
  );
}
