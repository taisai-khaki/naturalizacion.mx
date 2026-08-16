"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, BookOpen, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { User, Question, Passage } from "@/lib/client";
import { api, formatTime } from "@/lib/client";
import { Card, PrimaryButton, OptionButton, Pill } from "./ui";
import { LECTURA_PASS, LECTURA_SECONDS } from "@/lib/constants";

type Result = { correct: number; total: number; passed: boolean; passBar: number };

export default function Lectura({
  user,
  onResult,
}: {
  user: User;
  onResult: () => void;
}) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"idle" | "active" | "review">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [timeLeft, setTimeLeft] = useState(LECTURA_SECONDS);
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ passage: Passage; questions: Question[] }>("/api/exam/lectura");
      setPassage(data.passage);
      setQuestions(data.questions);
      setAnswers({});
      setResult(null);
      setTimeLeft(LECTURA_SECONDS);
      setPhase("active");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "active" && timeLeft <= 0) submit(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  async function submit(finalAnswers = answers) {
    setLoading(true);
    try {
      const list = questions.map((q) => ({ questionId: q.id, answerIndex: finalAnswers[q.id] }));
      const data = await api<Result>("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type: "lectura", answers: list }),
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
        <BookOpen className="w-10 h-10 text-amber-300 mx-auto mb-3" />
        <h2 className="text-2xl font-extrabold mb-2">Examen de Lectura</h2>
        <p className="text-emerald-200/80 max-w-xl mx-auto mb-6">
          Un pasaje completo + {LECTURA_PASS + 1} preguntas de comprensión. Apruebas con{" "}
          {LECTURA_PASS} de {LECTURA_PASS + 1}. Banco de 16 lecturas.
        </p>
        <PrimaryButton onClick={start} disabled={loading}>
          {loading ? "Cargando..." : "Iniciar lectura"}
        </PrimaryButton>
      </Card>
    );
  }

  if (phase === "review" && result && passage) {
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
          <PrimaryButton onClick={start}><RotateCcw className="w-4 h-4 inline mr-1" /> Repetir</PrimaryButton>
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
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 lg:sticky lg:top-24 self-start max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold">{passage?.title}</h3>
          <span className={`flex items-center gap-2 font-mono ${timeLeft < 60 ? "text-rose-300" : "text-emerald-200"}`}>
            <Timer className="w-4 h-4" /> {formatTime(Math.max(0, timeLeft))}
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          {passage?.topic && <Pill tone="amber">{passage.topic}</Pill>}
        </div>
        <p className="text-sm leading-relaxed text-emerald-50/90 whitespace-pre-line">{passage?.text}</p>
      </Card>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="text-sm font-bold text-emerald-100 mb-3">
              {i + 1}. {q.questionText}
            </div>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => (
                <OptionButton
                  key={oi}
                  selected={answers[q.id] === oi}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                >
                  <span className="font-bold text-amber-300 mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </OptionButton>
              ))}
            </div>
          </Card>
        ))}
        <PrimaryButton disabled={loading} onClick={() => submit()} className="w-full">
          {loading ? "Enviando..." : "Enviar respuestas de lectura"}
        </PrimaryButton>
      </div>
    </div>
  );
}
