import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { emailValido, entrar } from "@/lib/treino-api";
import { useTemaNoHtml } from "@/components/AppShell";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Carga" },
      { name: "description", content: "Entre com seu e-mail e bora treinar." },
      { property: "og:title", content: "Entrar — Carga" },
      { property: "og:description", content: "Entre com seu e-mail e bora treinar." },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  useTemaNoHtml();
  const [nome, setNome] = useState("");
  const navigate = useNavigate();
  const [tocado, setTocado] = useState(false);
  const ok = emailValido(nome);
  const erro = tocado && nome.trim() && !ok;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-10">
      <div className="pt-10">
        <p className="font-display text-6xl font-bold uppercase leading-[0.9]">
          Carga<span className="text-primary">.</span>
        </p>
        <h1 className="mt-6 font-display text-4xl font-bold uppercase leading-tight">
          Anote em segundos.<br />
          <span className="text-primary">Supere a última.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">Sem anúncio. Só o treino.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTocado(true);
          if (!ok) return;
          entrar(nome);
          navigate({ to: "/" });
        }}
        className="space-y-3"
      >
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Seu e-mail</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          onBlur={() => setTocado(true)}
          aria-invalid={erro ? true : undefined}
          aria-describedby="email-erro"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="voce@exemplo.com"
          maxLength={254}
          className="h-16 w-full rounded-2xl border border-input bg-card px-5 text-xl outline-none focus:ring-2 focus:ring-ring"
        />
        <p id="email-erro" className="min-h-5 text-sm text-destructive" aria-live="polite">
          {erro ? "Digite um e-mail válido, tipo voce@exemplo.com" : ""}
        </p>
        <button
          disabled={!ok}
          className="tap h-16 w-full rounded-2xl bg-primary font-display text-2xl font-bold uppercase text-primary-foreground disabled:opacity-40"
        >
          Bora treinar
        </button>
      </form>
    </main>
  );
}
