"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, ThumbsUp, ThumbsDown, Archive } from "lucide-react";
import type { User, Question } from "@/lib/client";
import { api } from "@/lib/client";
import { Card, PrimaryButton, GhostButton, Pill } from "./ui";
import { DAILY_FLASHCARD_GOAL } from "@/lib/constants";

export default function Flashcards({
  user,
  onResult,
}: {
  user: User;
  onResult: () => void;
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [studiedToday, setStudiedToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const next = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    try {
      const data = await api<{ question: Question | null; archivedCount: number; studiedToday: number }>(
        `/api/flashcard?userId=${user.id}`,
      );
      setQuestion(data.question);
      setArchivedCount(data.archivedCount);
      setStudiedToday(data.studiedToday);
      setEmpty(!data.question);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    next();
  }, [next]);

  async function mark(mark: "facil" | "dificil") {
    if (!question) return;
    setLoading(true);
    try {
      const data = await api<{ archivedCount: number }>("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, questionId: question.id, mark }),
      });
      setArchivedCount(data.archivedCount);
      onResult();
      await next();
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Pill tone="amber">
          <Layers className="w-3.5 h-3.5 mr-1" /> Hoy: {studiedToday}/{DAILY_FLASHCARD_GOAL}
        </Pill>
        <Pill tone="green">
          <Archive className="w-3.5 h-3.5 mr-1" /> Archivadas: {archivedCount}
        </Pill>
      </div>

      {empty ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-extrabold mb-2">¡Todo archivado! 🎉</h2>
          <p className="text-emerald-200/80">No hay tarjetas pendientes por ahora.</p>
        </Card>
      ) : question ? (
        <Card className="p-6 md:p-8">
          <div className="flex gap-2 mb-4">
            {question.categoria && <Pill tone="amber">{question.categoria}</Pill>}
            {question.subtema && <Pill>{question.subtema}</Pill>}
            {question.difficulty && <Pill tone="green">{question.difficulty}</Pill>}
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-6">{question.questionText}</h3>

          {revealed ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <div className="text-sm font-bold text-emerald-300 mb-1">Respuesta:</div>
              <div className="font-semibold">{question.options[question.correctAnswer]}</div>
              {question.explanation && (
                <div className="text-sm text-emerald-200/80 mt-2">
                  Explicación: {question.explanation}
                </div>
              )}
            </div>
          ) : (
            <GhostButton onClick={() => setRevealed(true)} className="mb-6">
              Mostrar respuesta
            </GhostButton>
          )}

          {revealed && (
            <div className="flex flex-wrap gap-3">
              <PrimaryButton onClick={() => mark("facil")} disabled={loading}>
                <ThumbsUp className="w-4 h-4 inline mr-1" /> Fácil
              </PrimaryButton>
              <GhostButton onClick={() => mark("dificil")} disabled={loading}>
                <ThumbsDown className="w-4 h-4 inline mr-1" /> Difícil
              </GhostButton>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-emerald-200/80">Cargando tarjeta...</p>
        </Card>
      )}

      <p className="text-xs text-emerald-300/60">
        Una pregunta se archiva cuando la marcas <strong>fácil</strong> 3 veces consecutivas.
      </p>
    </div>
  );
}
