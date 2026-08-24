"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, Check, X, BookCheck, SplitSquareVertical } from "lucide-react";
import type { User, Question } from "@/lib/client";
import { api } from "@/lib/client";
import { Card, PrimaryButton, GhostButton, Pill, OptionButton } from "./ui";
import { FLASHCARD_LEARN_COUNT, FLASHCARD_MIN_DAYS } from "@/lib/constants";

type Mode = "reveal" | "choice";

export default function Flashcards({
  user,
  onResult,
}: {
  user: User;
  onResult: () => void;
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("reveal");

  const next = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setAnswered(false);
    setSelectedOption(null);
    try {
      const data = await api<{ question: Question | null; learnedCount: number; pendingCount: number }>(
        `/api/flashcard?userId=${user.id}`,
      );
      setQuestion(data.question);
      setLearnedCount(data.learnedCount);
      setPendingCount(data.pendingCount);
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

  async function submitAnswer(isCorrect: boolean) {
    if (!question) return;
    setLoading(true);
    setAnswered(true);
    try {
      const data = await api<{ learned: boolean; correctCount: number; learnedCount: number }>("/api/flashcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, questionId: question.id, isCorrect }),
      });
      setLearnedCount(data.learnedCount);
      onResult();
      setTimeout(() => next(), 1500);
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  }

  function handlePickOption(idx: number) {
    if (selectedOption != null || !question) return;
    setSelectedOption(idx);
    const isCorrect = idx === question.correctAnswer;
    submitAnswer(isCorrect);
  }

  function toggleMode() {
    setMode((m) => (m === "reveal" ? "choice" : "reveal"));
    setRevealed(false);
    setAnswered(false);
    setSelectedOption(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="amber">
          <Layers className="w-3.5 h-3.5 mr-1" /> Pendientes: {pendingCount}
        </Pill>
        <Pill tone="green">
          <BookCheck className="w-3.5 h-3.5 mr-1" /> Aprendidas: {learnedCount}
        </Pill>
        <button
          onClick={toggleMode}
          className="ml-auto text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full transition"
        >
          <SplitSquareVertical className="w-3.5 h-3.5 inline mr-1" />
          {mode === "reveal" ? "Cambiar a opciones" : "Cambiar a autoevaluación"}
        </button>
      </div>

      {empty ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-extrabold mb-2">¡Sin pendientes! 🎉</h2>
          <p className="text-emerald-200/80">
            No hay tarjetas disponibles para repasar ahora.
            Vuelve a practicar en el simulador para agregar más preguntas.
          </p>
        </Card>
      ) : question ? (
        <Card className="p-6 md:p-8">
          <div className="flex gap-2 mb-4">
            {question.categoria && <Pill tone="amber">{question.categoria}</Pill>}
            {question.subtema && <Pill>{question.subtema}</Pill>}
            {question.difficulty && <Pill tone="green">{question.difficulty}</Pill>}
          </div>

          <h3 className="text-xl md:text-2xl font-bold mb-6">{question.questionText}</h3>

          {/* Modo 1: Autoevaluación — pregunta, revelar respuesta, el usuario se califica */}
          {mode === "reveal" && (
            <>
              {revealed ? (
                <>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                    <div className="text-sm font-bold text-emerald-300 mb-1">Respuesta:</div>
                    <div className="font-semibold">{question.options[question.correctAnswer]}</div>
                    {question.explanation && (
                      <div className="text-sm text-emerald-200/80 mt-2">
                        Explicación: {question.explanation}
                      </div>
                    )}
                  </div>

                  {answered ? (
                    <div className="text-center text-emerald-200/80 text-sm">
                      ¡Respuesta registrada! Cargando siguiente...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <PrimaryButton onClick={() => submitAnswer(true)} disabled={loading}>
                        <Check className="w-4 h-4 inline mr-1" /> Correcta
                      </PrimaryButton>
                      <GhostButton onClick={() => submitAnswer(false)} disabled={loading}>
                        <X className="w-4 h-4 inline mr-1" /> Incorrecta
                      </GhostButton>
                    </div>
                  )}
                </>
              ) : (
                <GhostButton onClick={() => setRevealed(true)} className="mb-6">
                  Mostrar respuesta
                </GhostButton>
              )}
            </>
          )}

          {/* Modo 2: Opciones múltiples — el usuario elige la respuesta correcta */}
          {mode === "choice" && (
            <>
              {answered && (
                <div className={`text-center mb-4 font-bold ${selectedOption === question.correctAnswer ? "text-emerald-300" : "text-rose-300"}`}>
                  {selectedOption === question.correctAnswer ? "¡Correcta! ✅" : "Incorrecta ❌"} — Cargando siguiente...
                </div>
              )}
              <div className="grid gap-3 mb-6">
                {question.options.map((opt, oi) => (
                  <OptionButton
                    key={oi}
                    selected={selectedOption === oi}
                    disabled={selectedOption !== null}
                    onClick={() => handlePickOption(oi)}
                  >
                    <span className="font-bold text-amber-300 mr-2">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {opt}
                    {selectedOption !== null && oi === question.correctAnswer && (
                      <span className="text-emerald-300 font-semibold ml-2">✓</span>
                    )}
                    {selectedOption !== null && oi === selectedOption && oi !== question.correctAnswer && (
                      <span className="text-rose-300 font-semibold ml-2">✗</span>
                    )}
                  </OptionButton>
                ))}
              </div>
              {!answered && (
                <p className="text-sm text-emerald-300/60">
                  Selecciona la opción correcta
                </p>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-emerald-200/80">Cargando tarjeta...</p>
        </Card>
      )}

      <p className="text-xs text-emerald-300/60">
        Modo {mode === "reveal" ? "autoevaluación" : "opciones múltiples"} · 
        Responde <strong>correctamente {FLASHCARD_LEARN_COUNT} veces</strong> para aprender la pregunta. 
        Puedes repasar cada {FLASHCARD_MIN_DAYS} días como mínimo.
      </p>
    </div>
  );
}