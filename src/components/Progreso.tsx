"use client";

import { useState, useEffect, useMemo } from "react";
import { BookCheck, Repeat, History, Search, ListChecks, GraduationCap, Clock } from "lucide-react";
import type { User, Question } from "@/lib/client";
import { api } from "@/lib/client";
import { Card, Pill } from "./ui";
import { FLASHCARD_LEARN_COUNT } from "@/lib/constants";

type Attempt = { id: number; type: string; score: number; total: number; passed: boolean; createdAt: string };

type ProgressData = {
  user: User;
  totalQuestions: number;
  totalHist?: number;
  learned: (Question & { correctCount: number })[];
  pending: (Question & { correctCount: number; lastReviewedAt: string | null; availableForReview: boolean })[];
  allQuestions?: (Question & { status: "learned" | "pending" | "not_started"; correctCount: number; lastReviewedAt: string | null; availableForReview: boolean })[];
  notStarted?: Question[];
  attempts: Attempt[];
};

type Filter = "all" | "learned" | "pending" | "not_started" | "available";

export default function Progreso({ user }: { user: User }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    api<ProgressData>(`/api/progress?userId=${user.id}`)
      .then(setData)
      .catch(() => {});
  }, [user.id]);

  if (!data) return <p className="text-sm text-emerald-300/60">Cargando progreso...</p>;

  const totalHist = data.totalHist ?? data.totalQuestions;
  const learnedCount = data.learned.length;
  const pendingCount = data.pending.length;
  const notStartedCount = data.notStarted?.length ?? Math.max(0, totalHist - learnedCount - pendingCount);
  const availableCount = data.pending.filter((p) => p.availableForReview).length;
  const all = data.allQuestions ?? [];

  const filtered = useMemo(() => {
    let list = all;
    if (filter === "learned") list = list.filter((x) => x.status === "learned");
    else if (filter === "pending") list = list.filter((x) => x.status === "pending");
    else if (filter === "not_started") list = list.filter((x) => x.status === "not_started");
    else if (filter === "available") list = list.filter((x) => (x as any).availableForReview);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.questionText.toLowerCase().includes(s) ||
          (x.subtema && x.subtema.toLowerCase().includes(s)) ||
          (x.categoria && x.categoria.toLowerCase().includes(s)) ||
          (x.explanation && x.explanation.toLowerCase().includes(s))
      );
    }
    return list;
  }, [all, filter, q]);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total banco", value: totalHist, sub: "Historia/Cultura", icon: ListChecks },
          { label: "Aprendidas", value: learnedCount, sub: `${FLASHCARD_LEARN_COUNT} aciertos`, icon: BookCheck },
          { label: "En repaso", value: pendingCount, sub: `${availableCount} disponibles hoy`, icon: Repeat },
          { label: "Sin empezar", value: notStartedCount, sub: "Aún no practicadas", icon: GraduationCap },
          { label: "Correctas", value: data.user.totalCorrect, sub: "Aciertos totales", icon: BookCheck },
          { label: "Respondidas", value: data.user.totalAnswered, sub: "Intentos totales", icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-2 text-amber-300" />
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className="text-xs font-semibold text-white/80 mt-1">{s.label}</div>
            <div className="text-[10px] text-emerald-300/60">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Barra de progreso global */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">Progreso global</span>
          <span className="text-xs text-emerald-300/70">
            {learnedCount} / {totalHist} aprendidas ({totalHist ? Math.round((learnedCount / totalHist) * 100) : 0}%)
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ width: `${totalHist ? (learnedCount / totalHist) * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-2 mt-2 text-[11px] text-emerald-300/60">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Aprendidas</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> En repaso</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-white/20 rounded-full" /> Sin empezar</span>
        </div>
      </Card>

      {/* Últimos intentos */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-extrabold">Últimos intentos de examen</h2>
        </div>
        {data.attempts.length === 0 ? (
          <p className="text-sm text-emerald-300/60">Aún no hay intentos registrados.</p>
        ) : (
          <div className="space-y-2">
            {data.attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="text-sm font-semibold capitalize">
                  {a.type === "simulador" ? "Simulador Historia/Cultura" : "Examen de Lectura"}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{a.score}/{a.total}</span>
                  <Pill tone={a.passed ? "green" : "rose"}>{a.passed ? "Aprobado" : "No aprobado"}</Pill>
                  <span className="text-xs text-emerald-300/50">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Banco completo con progreso */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-extrabold">Banco completo</h2>
            <Pill tone="amber">{filtered.length} / {totalHist}</Pill>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar pregunta, tema..."
                className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/30 w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            { id: "all", label: `Todas (${totalHist})` },
            { id: "learned", label: `Aprendidas (${learnedCount})` },
            { id: "pending", label: `En repaso (${pendingCount})` },
            { id: "available", label: `Disponibles hoy (${availableCount})` },
            { id: "not_started", label: `Sin empezar (${notStartedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as Filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                filter === f.id
                  ? "bg-amber-300 text-emerald-950 border-amber-300"
                  : "bg-white/5 border-white/10 text-emerald-100 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-emerald-300/60">No hay preguntas con ese filtro.</p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filtered.map((item: any) => (
              <div
                key={item.id}
                className={`border rounded-xl px-4 py-3 text-sm ${
                  item.status === "learned"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : item.status === "pending"
                    ? item.availableForReview
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/10"
                    : "bg-white/[0.02] border-white/5 opacity-80"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <span className="font-medium flex-1">{item.questionText}</span>
                  <span className="shrink-0">
                    {item.status === "learned" && <Pill tone="green">Aprendida ✓</Pill>}
                    {item.status === "pending" && item.availableForReview && <Pill tone="amber">Disponible</Pill>}
                    {item.status === "pending" && !item.availableForReview && <Pill tone="rose">En espera</Pill>}
                    {item.status === "not_started" && <Pill>Sin empezar</Pill>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.categoria && <Pill tone="amber">{item.categoria}</Pill>}
                  {item.subtema && <Pill>{item.subtema}</Pill>}
                  {item.difficulty && <Pill tone="green">{item.difficulty}</Pill>}
                </div>
                <div className="flex gap-3 mt-2 text-xs text-emerald-300/60 flex-wrap">
                  {item.status !== "not_started" ? (
                    <>
                      <span>
                        Correctas: {item.correctCount}/{FLASHCARD_LEARN_COUNT}
                      </span>
                      {item.lastReviewedAt && (
                        <span>Último repaso: {new Date(item.lastReviewedAt).toLocaleDateString()}</span>
                      )}
                      {item.status === "pending" && !item.availableForReview && item.lastReviewedAt && (
                        <span className="text-amber-300/70">
                          Próximo repaso:{" "}
                          {new Date(new Date(item.lastReviewedAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-emerald-300/40">Practica en simulador o agrégala desde el banco para empezar.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-emerald-300/40 mt-3">
          Cada flashcard requiere {FLASHCARD_LEARN_COUNT} aciertos seguidos para marcarse como aprendida. Si fallas, el contador vuelve a 0. Solo puedes repasar la misma tarjeta una vez cada 5 días.
        </p>
      </Card>

      {/* Detalle antiguo: Aprendidas y En repaso (colapsables) - mantenemos por compatibilidad pero ahora son redundantes */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookCheck className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold">Aprendidas</h3>
            <Pill tone="green">{data.learned.length}</Pill>
          </div>
          {data.learned.length === 0 ? (
            <p className="text-sm text-emerald-300/60">Responde correctamente {FLASHCARD_LEARN_COUNT} veces seguidas.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {data.learned.slice(0, 10).map((item) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs flex justify-between">
                  <span className="truncate mr-2">{item.questionText}</span>
                  <span className="shrink-0 text-emerald-300/60">✅ {item.correctCount}/{FLASHCARD_LEARN_COUNT}</span>
                </div>
              ))}
              {data.learned.length > 10 && (
                <p className="text-xs text-emerald-300/50">Y {data.learned.length - 10} más… (ver “Banco completo”)</p>
              )}
            </div>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="w-5 h-5 text-rose-300" />
            <h3 className="font-extrabold">En repaso</h3>
            <Pill tone={availableCount > 0 ? "amber" : "rose"}>{data.pending.length} ({availableCount} hoy)</Pill>
          </div>
          {data.pending.length === 0 ? (
            <p className="text-sm text-emerald-300/60">Sin pendientes. Practica en simulador.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {data.pending.slice(0, 10).map((item) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                  <div className="flex justify-between">
                    <span className="truncate mr-2">{item.questionText}</span>
                    {item.availableForReview ? <Pill tone="green">Disp.</Pill> : <Pill tone="rose">Espera</Pill>}
                  </div>
                </div>
              ))}
              {data.pending.length > 10 && (
                <p className="text-xs text-emerald-300/50">Y {data.pending.length - 10} más…</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
