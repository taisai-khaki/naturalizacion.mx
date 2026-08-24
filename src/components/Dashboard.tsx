"use client";

import { useState, useCallback } from "react";
import {
  Landmark,
  BookOpen,
  MessageCircle,
  Layers,
  Database,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Sparkles,
} from "lucide-react";
import type { User } from "@/lib/client";
import { api } from "@/lib/client";
import Simulador from "./Simulador";
import Lectura from "./Lectura";
import Entrevista from "./Entrevista";
import Flashcards from "./Flashcards";
import Banco from "./Banco";
import Progreso from "./Progreso";

type TabId = "simulador" | "lectura" | "entrevista" | "flashcards" | "banco" | "progreso";

const TABS: { id: TabId; label: string; icon: typeof Landmark }[] = [
  { id: "simulador", label: "Simulador", icon: ShieldCheck },
  { id: "lectura", label: "Lectura", icon: BookOpen },
  { id: "entrevista", label: "Entrevista", icon: MessageCircle },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "banco", label: "Banco", icon: Database },
  { id: "progreso", label: "Progreso", icon: Trophy },
];

export default function Dashboard({
  user,
  setUser,
}: {
  user: User;
  setUser: (u: User | null) => void;
}) {
  const [tab, setTab] = useState<TabId>("simulador");

  const refreshUser = useCallback(async () => {
    try {
      const data = await api<{ user: User }>(`/api/progress?userId=${user.id}`);
      setUser(data.user);
    } catch {
      /* ignore */
    }
  }, [user.id, setUser]);

  const stats = [
    { label: "Aprendidas", value: user.masteredCount, sub: "5 respuestas correctas en flashcards", icon: ShieldCheck, color: "bg-emerald-500/10 text-emerald-300" },
    { label: "Correctas", value: user.totalCorrect, sub: "Respuestas correctas", icon: CheckCircle2, color: "bg-amber-500/10 text-amber-300" },
    { label: "Sesión", value: `#${(user.practiceSession || 0) + 1}`, sub: "Cada práctica = un día", icon: Zap, color: "bg-rose-500/10 text-rose-300" },
    {
      label: "Estado",
      value: user.isReady ? "¡Listo!" : "En progreso",
      sub: user.isReady ? "Simulador + lectura aprobados" : "Aprueba simulador y lectura",
      icon: Sparkles,
      color: user.isReady ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 text-white">
      <header className="sticky top-0 z-30 bg-emerald-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 to-rose-400 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Landmark className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="font-extrabold leading-none text-base tracking-tight">
                Naturalización <span className="text-amber-300">MX</span>
              </h2>
              <div className="text-[10px] text-emerald-300/70 font-medium leading-none mt-0.5">
                Examen de Ciudadanía
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-medium bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
              {user.phone}
            </span>
            <button
              onClick={() => setUser(null)}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Saludo + progreso */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-1">
                Hola, {user.name || "estudiante"}
              </h1>
              <p className="text-emerald-200/80 text-base">
                Practica hasta dominar el examen de naturalización mexicana.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                Simulador: {user.simuladorApproved ? "✅ Aprobado" : "Pendiente"}
              </span>
              <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                Lectura: {user.lecturaApproved ? "✅ Aprobado" : "Pendiente"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-4">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${s.color} mb-3`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold leading-none">{s.value}</div>
                <div className="text-xs font-semibold text-white/80 mt-1">{s.label}</div>
                <div className="text-[11px] text-emerald-300/60">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <nav className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition border ${
                tab === t.id
                  ? "bg-gradient-to-r from-amber-300 to-amber-500 text-emerald-950 border-transparent shadow"
                  : "bg-white/5 border-white/10 text-emerald-100 hover:bg-white/10"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>

        {tab === "simulador" && <Simulador user={user} onResult={refreshUser} />}
        {tab === "lectura" && <Lectura user={user} onResult={refreshUser} />}
        {tab === "entrevista" && <Entrevista />}
        {/* Keep the flashcard component mounted so navigating tabs doesn't
            advance to the next card before the user responds. */}
        <div className={tab === "flashcards" ? "" : "hidden"} aria-hidden={tab !== "flashcards"}>
          <Flashcards user={user} onResult={refreshUser} active={tab === "flashcards"} />
        </div>
        {tab === "banco" && <Banco user={user} />}
        {tab === "progreso" && <Progreso user={user} />}
      </main>
    </div>
  );
}
