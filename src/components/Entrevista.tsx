"use client";

import { useState } from "react";
import { MessageCircle, PenLine, Lightbulb, CheckSquare } from "lucide-react";
import { Card, Pill } from "./ui";
import iw from "../../data/interview_writing.json";

type IW = {
  interview: { question: string; tip: string }[];
  writing: string[];
  writingChecklist: string[];
  writingWordRange: [number, number];
};
const data = iw as unknown as IW;

export default function Entrevista() {
  const [selected, setSelected] = useState(0);
  const [writingIdx, setWritingIdx] = useState(0);

  const current = data.interview[selected];
  const prompt = data.writing[writingIdx];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-extrabold">Preguntas de entrevista</h2>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-4">
          {data.interview.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition ${
                i === selected
                  ? "border-amber-300 bg-amber-300/15 text-white"
                  : "border-white/10 bg-white/5 text-emerald-100/80 hover:bg-white/10"
              }`}
            >
              {i + 1}. {item.question}
            </button>
          ))}
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-200 text-sm font-bold mb-1">
            <Lightbulb className="w-4 h-4" /> Tip de respuesta
          </div>
          <p className="text-sm text-emerald-50/90">{current.tip}</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-extrabold">Redacción</h2>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
          <div className="text-xs uppercase tracking-wide text-emerald-300/70 font-bold mb-1">
            Tema actual ({data.writingWordRange[0]}–{data.writingWordRange[1]} palabras)
          </div>
          <p className="font-semibold">{prompt}</p>
        </div>
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-200 mb-2">
            <CheckSquare className="w-4 h-4" /> Checklist
          </div>
          <div className="flex flex-wrap gap-2">
            {data.writingChecklist.map((c) => (
              <Pill key={c} tone="green">{c}</Pill>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWritingIdx((i) => (i - 1 + data.writing.length) % data.writing.length)}
            className="text-sm bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
          >
            ← Anterior
          </button>
          <button
            onClick={() => setWritingIdx((i) => (i + 1) % data.writing.length)}
            className="text-sm bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition"
          >
            Siguiente →
          </button>
        </div>
        <p className="text-xs text-emerald-300/60 mt-4">
          Responde con idea principal, ejemplo real y cierre breve.
        </p>
      </Card>
    </div>
  );
}
