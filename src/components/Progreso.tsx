"use client";

import { useState, useEffect } from "react";
import { BookCheck, Repeat, History, Target } from "lucide-react";
import type { User, Question } from "@/lib/client";
import { api } from "@/lib/client";
import { Card, Pill } from "./ui";
import { FLASHCARD_LEARN_COUNT } from "@/lib/constants";

type Attempt = { id: number; type: string; score: number; total: number; passed: boolean; createdAt: string };

type ProgressData = {
  user: User;
  totalQuestions: number;
  learned: (Question & { correctCount: number })[];
  pending: (Question & { correctCount: number; lastReviewedAt: string | null; availableForReview: boolean })[];
  attempts: Attempt[];
  daily: { flashcards: number; goal: number; simuladorDone: boolean; lecturaDone: boolean };
};

export default function Progreso({ user }: { user: User }) {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    api<ProgressData>(`/api/progress?userId=${user.id}`)
      .then(setData)
      .catch(() => {});
  }, [user.id]);

  if (!data) return <p className="text-sm text-emerald-300/60">Cargando progreso...</p>;

  const dailyDone =
    data.daily.flashcards >= data.daily.goal && data.daily.simuladorDone && data.daily.lecturaDone;

  const availableCount = data.pending.filter((p) => p.availableForReview).length;

  return (
    <div className="space-y-4">
      {/* Meta diaria */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-extrabold">Meta diaria</h2>
          {dailyDone && <Pill tone="green">¡COMPLETADA!</Pill>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-extrabold">
              {data.daily.flashcards}<span className="text-emerald-300">/{data.daily.goal}</span>
            </div>
            <div className="text-xs text-emerald-300/60 mt-1">Flashcards estudiadas hoy</div>
          </div>
          <div className={`bg-white/5 border rounded-xl p-4 ${data.daily.simuladorDone ? "border-emerald-400/40" : "border-white/10"}`}>
            <div className="text-xl font-extrabold">{data.daily.simuladorDone ? "✅" : "⬜"}</div>
            <div className="text-xs text-emerald-300/60 mt-1">Simulador completado hoy</div>
          </div>
          <div className={`bg-white/5 border rounded-xl p-4 ${data.daily.lecturaDone ? "border-emerald-400/40" : "border-white/10"}`}>
            <div className="text-xl font-extrabold">{data.daily.lecturaDone ? "✅" : "⬜"}</div>
            <div className="text-xs text-emerald-300/60 mt-1">Lectura completada hoy</div>
          </div>
        </div>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total banco", value: data.totalQuestions },
          { label: "Aprendidas", value: data.user.masteredCount },
          { label: "Correctas totales", value: data.user.totalCorrect },
          { label: "Respondidas", value: data.user.totalAnswered },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-xs text-emerald-300/60 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

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

      {/* Preguntas aprendidas */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookCheck className="w-5 h-5 text-emerald-300" />
          <h2 className="text-xl font-extrabold">Preguntas aprendidas</h2>
          <Pill tone="green">{data.learned.length}</Pill>
        </div>
        {data.learned.length === 0 ? (
          <p className="text-sm text-emerald-300/60">
            Responde correctamente {FLASHCARD_LEARN_COUNT} veces en flashcards para aprender una pregunta.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data.learned.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex justify-between items-center">
                <span>{item.questionText}</span>
                <span className="text-emerald-300/60 text-xs ml-2">✅ {item.correctCount}/{FLASHCARD_LEARN_COUNT}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* En repaso */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-5 h-5 text-rose-300" />
          <h2 className="text-xl font-extrabold">En repaso</h2>
          <Pill tone={availableCount > 0 ? "amber" : "rose"}>{data.pending.length} pendientes ({availableCount} disponibles hoy)</Pill>
        </div>
        {data.pending.length === 0 ? (
          <p className="text-sm text-emerald-300/60">
            Sin preguntas pendientes. Practica en el simulador para agregar más.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {data.pending.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{item.questionText}</span>
                  {item.availableForReview ? (
                    <Pill tone="green">Disponible</Pill>
                  ) : (
                    <Pill tone="rose">En espera</Pill>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-emerald-300/60">
                  <span>Correctas: {item.correctCount}/{FLASHCARD_LEARN_COUNT}</span>
                  {item.lastReviewedAt && (
                    <span>Último repaso: {new Date(item.lastReviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}