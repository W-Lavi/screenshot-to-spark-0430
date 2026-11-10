/**
 * Único módulo de acesso a dados. Hoje usa dados simulados no navegador (localStorage).
 * Para ligar ao back-end Spring Boot, troque o corpo destas funções por chamadas fetch
 * mantendo as mesmas assinaturas. IDs são UUID gerados no aparelho (funciona offline).
 */
export type Exercicio = { id: string; nome: string; personalizado: boolean };
export type Serie = {
  id: string;
  exercicioId: string;
  peso: number;
  reps: number;
  data: string; // YYYY-MM-DD
  criadoEm: number;
  sincronizado: boolean;
};
export type Estado = {
  usuario: string | null;
  exercicios: Exercicio[];
  series: Serie[];
  tema: "escuro" | "claro";
};

const KEY = "carga-v1";
const PADRAO = [
  "Supino reto", "Supino inclinado", "Agachamento livre", "Leg press", "Puxada frontal",
  "Remada curvada", "Desenvolvimento", "Elevação lateral", "Rosca direta", "Tríceps corda",
  "Levantamento terra", "Cadeira extensora", "Mesa flexora", "Panturrilha em pé", "Barra fixa",
];

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

export const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function diasAtras(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function semente(): Estado {
  const exercicios = PADRAO.map((nome) => ({ id: uuid(), nome, personalizado: false }));
  const s = (ex: number, dia: number, peso: number, reps: number, i: number): Serie => ({
    id: uuid(), exercicioId: exercicios[ex].id, peso, reps, data: diasAtras(dia),
    criadoEm: Date.now() - dia * 864e5 + i * 1000, sincronizado: true,
  });
  const series = [
    s(0, 7, 40, 10, 0), s(0, 7, 40, 8, 1), s(0, 7, 35, 8, 2),
    s(0, 3, 42, 10, 0), s(0, 3, 42, 9, 1), s(0, 3, 40, 8, 2),
    s(2, 5, 60, 10, 0), s(2, 5, 60, 10, 1), s(2, 5, 65, 8, 2),
    s(4, 3, 45, 12, 3), s(4, 3, 50, 10, 4),
  ];
  return { usuario: null, exercicios, series, tema: "escuro" };
}

let estado: Estado | null = null;
const ouvintes = new Set<() => void>();
const SERVIDOR: Estado = { usuario: null, exercicios: [], series: [], tema: "escuro" };

function carregar(): Estado {
  if (estado) return estado;
  try {
    const raw = localStorage.getItem(KEY);
    estado = raw ? (JSON.parse(raw) as Estado) : semente();
  } catch {
    estado = semente();
  }
  return estado;
}
function salvar(novo: Estado) {
  estado = novo;
  localStorage.setItem(KEY, JSON.stringify(novo));
  ouvintes.forEach((f) => f());
  agendarSync();
}

export const store = {
  subscribe(f: () => void) { ouvintes.add(f); return () => ouvintes.delete(f); },
  get: () => carregar(),
  getServer: () => SERVIDOR,
};

// ---------- API ----------
export function entrar(apelido: string) { salvar({ ...carregar(), usuario: apelido.trim() }); }
export function sair() { salvar({ ...carregar(), usuario: null }); }
export function definirTema(tema: Estado["tema"]) { salvar({ ...carregar(), tema }); }

export function buscarExercicios(termo: string, e: Estado = carregar()) {
  const n = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = n(termo.trim());
  const ultimo = (id: string) => Math.max(0, ...e.series.filter((s) => s.exercicioId === id).map((s) => s.criadoEm));
  return e.exercicios
    .filter((x) => n(x.nome).includes(q))
    .sort((a, b) => ultimo(b.id) - ultimo(a.id) || a.nome.localeCompare(b.nome));
}

export function criarExercicio(nome: string): Exercicio {
  const ex = { id: uuid(), nome: nome.trim(), personalizado: true };
  const e = carregar();
  salvar({ ...e, exercicios: [...e.exercicios, ex] });
  return ex;
}

/** Séries de hoje e do último treino anterior de um exercício. */
export function buscarSeries(exercicioId: string, e: Estado = carregar()) {
  const todas = e.series.filter((s) => s.exercicioId === exercicioId).sort((a, b) => a.criadoEm - b.criadoEm);
  const d = hoje();
  const deHoje = todas.filter((s) => s.data === d);
  const datasAnteriores = [...new Set(todas.filter((s) => s.data < d).map((s) => s.data))].sort();
  const dataAnterior = datasAnteriores.at(-1) ?? null;
  const anterior = dataAnterior ? todas.filter((s) => s.data === dataAnterior) : [];
  return { hoje: deHoje, anterior, dataAnterior };
}

export function registrarSerie(exercicioId: string, peso: number, reps: number) {
  const e = carregar();
  const s: Serie = { id: uuid(), exercicioId, peso, reps, data: hoje(), criadoEm: Date.now(), sincronizado: false };
  salvar({ ...e, series: [...e.series, s] });
}
export function editarSerie(id: string, peso: number, reps: number) {
  const e = carregar();
  salvar({ ...e, series: e.series.map((s) => (s.id === id ? { ...s, peso, reps, sincronizado: false } : s)) });
}
export function excluirSerie(id: string) {
  const e = carregar();
  salvar({ ...e, series: e.series.filter((s) => s.id !== id) });
}

export function listarHistorico(e: Estado = carregar()) {
  const porData = new Map<string, Map<string, Serie[]>>();
  for (const s of [...e.series].sort((a, b) => a.criadoEm - b.criadoEm)) {
    if (!porData.has(s.data)) porData.set(s.data, new Map());
    const m = porData.get(s.data)!;
    m.set(s.exercicioId, [...(m.get(s.exercicioId) ?? []), s]);
  }
  return [...porData.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([data, m]) => ({
      data,
      exercicios: [...m.entries()].map(([id, series]) => ({
        nome: e.exercicios.find((x) => x.id === id)?.nome ?? "Exercício",
        series,
      })),
    }));
}

let timer: ReturnType<typeof setTimeout> | null = null;
function agendarSync() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void sincronizar(), 1500);
}
/** Simula envio ao servidor das séries pendentes. */
export async function sincronizar() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const e = carregar();
  if (!e.series.some((s) => !s.sincronizado)) return;
  estado = { ...e, series: e.series.map((s) => ({ ...s, sincronizado: true })) };
  localStorage.setItem(KEY, JSON.stringify(estado));
  ouvintes.forEach((f) => f());
}
