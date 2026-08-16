"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, ArrowRight, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { User, Question } from "@/lib/client";
import { api, formatTime } from "@/lib/client";
import { Card, PrimaryButton, OptionButton, Pill } from "./ui";
import { SIMULADOR_PASS, SIMULADOR_TOTAL, SIMULADOR_SECONDS } from "@/lib/constants";

type Result = { correct: number; total: number; passed: boolean; passBar: number };

export default function Simulador({
  user,
  onResult,
}: {
  user: User;
  onResult: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"idle" | "active" | "review">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [timeLeft, setTimeLeft] = useState(SIMULADOR_SECONDS);
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ questions: Question[] }>("/api/exam/simulador");
      setQuestions(data.questions);
      setAnswers({});
      setIndex(0);
      setResult(null);
      setTimeLeft(SIMULADOR_SECONDS);
      setPhase("active");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "active" && timeLeft <= 0) submit(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  function pick(idx: number) {
    const q = questions[index];
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  }

  async function submit(finalAnswers = answers) {
    setLoading(true);
    try {
      const list = questions.map((q) => ({ questionId: q.id, answerIndex: finalAnswers[q.id] }));
      const data = await api<Result>("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type: "simulador", answers: list }),
      });
      setResult(data);
      setPhase("review");
      onResult();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (phase === "idle") {
    return (
      <Card className="p-8 text-center">
        <Trophy className="w-10 h-10 text-amber-300 mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold mb-2">Simulador de Historia/Cultura</h2>
        <p className="text-emerald-200/80 max-w-xl mx-auto mb-6">
          {SIMULADOR_TOTAL} preguntas al azar de un banco de 3,000. Apruebas con{" "}
          {SIMULADOR_PASS} de {SIMULADOR_TOTAL}. Sin repetición dentro de cada intento.
        </p>
        <PrimaryButton onClick={start} disabled={loading}>
          {loading ? "Cargando..." : "Iniciar simulador"}
        </PrimaryButton>
      </Card>
    );
  }

  if (phase === "review" && result) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          {result.passed ? (
            <Trophy className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          )}
          <h2 className="text-3xl font-extrabold mb-1">
            {result.passed ? "APROBADO" : "NO APROBADO"}
          </h2>
          <p className="text-emerald-200/80 mb-6">
            Obtuviste <strong>{result.correct}</strong> de {result.total} (necesitas {result.passBar}).
          </p>
          <div className="flex justify-center gap-3">
            <PrimaryButton onClick={start}><RotateCcw className="w-4 h-4 inline mr-1" /> Repetir</PrimaryButton>
          </div>
        </Card>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const ok = userAns === q.correctAnswer;
            return (
              <Card key={q.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-emerald-100">
                    {i + 1}. {q.questionText}
                  </span>
                  <Pill tone={ok ? "green" : "rose"}>{ok ? "Correcta" : "Incorrecta"}</Pill>
                </div>
                <div className="grid gap-1.5 text-sm">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`px-3 py-2 rounded-lg border ${
                        oi === q.correctAnswer
                          ? "border-emerald-400 bg-emerald-500/15"
                          : oi === userAns
                            ? "border-rose-400 bg-rose-500/15"
                            : "border-white/5 bg-white/5"
                      }`}
                    >
                      {opt}
                      {oi === q.correctAnswer && <span className="text-emerald-300 font-semibold"> ✓</span>}
                      {oi === userAns && oi !== q.correctAnswer && (
                        <span className="text-rose-300 font-semibold"> ✗</span>
                      )}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-xs text-emerald-300/70 mt-2">Explicación: {q.explanation}</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-amber-300">
            Pregunta {index + 1} de {questions.length}
          </span>
          <div className="flex gap-2 mt-2">
            {q.categoria && <Pill tone="amber">{q.categoria}</Pill>}
            {q.subtema && <Pill>{q.subtema}</Pill>}
            {q.difficulty && <Pill tone="green">{q.difficulty}</Pill>}
          </div>
        </div>
        <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 60 ? "text-rose-300" : "text-emerald-200"}`}>
          <Timer className="w-5 h-5" /> {formatTime(Math.max(0, timeLeft))}
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-bold mb-6">{q.questionText}</h3>

      <div className="grid gap-3 mb-6">
        {q.options.map((opt, oi) => (
          <OptionButton
            key={oi}
            selected={answers[q.id] === oi}
            onClick={() => pick(oi)}
          >
            <span className="font-bold text-amber-300 mr-2">{String.fromCharCode(65 + oi)}.</span>
            {opt}
          </OptionButton>
        ))}
      </div>

      <div className="flex justify-between">
        <span className="text-sm text-emerald-300/60 self-center">
          {answers[q.id] != null ? "Respuesta seleccionada" : "Selecciona una opción"}
        </span>
        {index < questions.length - 1 ? (
          <PrimaryButton disabled={answers[q.id] == null} onClick={() => setIndex((i) => i + 1)}>
            Siguiente <ArrowRight className="w-4 h-4 inline ml-1" />
          </PrimaryButton>
        ) : (
          <PrimaryButton disabled={answers[q.id] == null || loading} onClick={() => submit()}>
            {loading ? "Enviando..." : "Terminar y ver resultado"}
          </PrimaryButton>
        )}
      </div>
    </Card>
  );
}
