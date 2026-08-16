"use client";

import { useState, useEffect } from "react";
import { Database, Search, X } from "lucide-react";
import type { Question, Passage } from "@/lib/client";
import { api } from "@/lib/client";
import { Card, Pill } from "./ui";
import iw from "../../data/interview_writing.json";

type IW = {
  interview: { question: string; tip: string }[];
  writing: string[];
};
const data = iw as unknown as IW;

type Mode = "historia_cultura" | "lectura" | "conversacion";

const MODES: { id: Mode; label: string }[] = [
  { id: "historia_cultura", label: "Historia y cultura" },
  { id: "lectura", label: "Lecturas" },
  { id: "conversacion", label: "Conversación" },
];

export default function Banco() {
  const [mode, setMode] = useState<Mode>("historia_cultura");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [histResults, setHistResults] = useState<Question[]>([]);
  const [lectResults, setLectResults] = useState<{ passage: Passage; questions: Question[] }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (mode === "conversacion") return;
    setLoading(true);
    const url = `/api/bank?mode=${mode}&q=${encodeURIComponent(query)}&limit=200`;
    api<any>(url)
      .then((data) => {
        if (mode === "historia_cultura") setHistResults(data.results || []);
        else setLectResults(data.results || []);
      })
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, [mode, query]);

  function highlightCorrect(opts: string[], correctIdx: number, show = true) {
    return opts.map((opt, oi) => (
      <div
        key={oi}
        className={`px-3 py-1.5 rounded-lg border text-sm ${
          show && oi === correctIdx
            ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
            : "border-white/5 bg-white/5 text-white/70"
        }`}
      >
        {opt}
        {show && oi === correctIdx && <span className="text-emerald-300 font-semibold"> [CORRECTA]</span>}
      </div>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                mode === m.id
                  ? "bg-gradient-to-r from-amber-300 to-amber-500 text-emerald-950 border-transparent"
                  : "bg-white/5 border-white/10 text-emerald-100 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode !== "conversacion" && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar palabra o tema..."
              className="w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-emerald-300/60">Buscando...</p>}

      {mode === "historia_cultura" && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-300/60">
            {histResults.length} pregunta{histResults.length !== 1 ? "s" : ""} encontrada{histResults.length !== 1 ? "s" : ""}.
          </p>
          {histResults.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex gap-2 mb-2 flex-wrap">
                {item.categoria && <Pill tone="amber">{item.categoria}</Pill>}
                {item.subtema && <Pill>{item.subtema}</Pill>}
                {item.difficulty && <Pill tone="green">{item.difficulty}</Pill>}
              </div>
              <p className="font-bold mb-3">{item.questionText}</p>
              <div className="grid gap-1.5">{highlightCorrect(item.options, item.correctAnswer)}</div>
              {item.explanation && (
                <p className="text-xs text-emerald-300/70 mt-2">Explicación: {item.explanation}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {mode === "lectura" && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-300/60">{lectResults.length} texto(s) encontrado(s).</p>
          {lectResults.map(({ passage, questions }) => (
            <Card key={passage.id} className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-amber-300" />
                <h3 className="font-extrabold">LECTURA: {passage.title}</h3>
              </div>
              <div className="flex gap-2 mb-3">
                {passage.topic && <Pill tone="amber">Tema: {passage.topic}</Pill>}
              </div>
              <p className="text-sm text-emerald-50/90 whitespace-pre-line mb-4 border-l-2 border-amber-300/40 pl-3">
                {passage.text}
              </p>
              <div className="space-y-3">
                {questions.map((item, i) => (
                  <div key={item.id}>
                    <p className="text-sm font-semibold mb-1.5">
                      {i + 1}. {item.questionText}
                    </p>
                    <div className="grid gap-1.5">{highlightCorrect(item.options, item.correctAnswer)}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {mode === "conversacion" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-extrabold mb-4">Preguntas de conversación</h3>
            <div className="space-y-3">
              {data.interview.map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="font-semibold text-sm">{i + 1}. {item.question}</p>
                  <p className="text-xs text-emerald-300/70 mt-1">Sugerencia: {item.tip}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-extrabold mb-4">Temas de redacción</h3>
            <div className="space-y-2">
              {data.writing.map((w, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium">
                  {i + 1}. {w}
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-300/60 mt-4">
              Enfoque: idea principal, ejemplo concreto, conectores y cierre.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
