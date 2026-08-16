"use client";

import { useState } from "react";
import { Phone, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { api, type User } from "@/lib/client";

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<{ user: User }>("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() || undefined }),
      });
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || "Error al entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 text-white flex flex-col items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #BFBF00 0%, transparent 45%), radial-gradient(circle at 80% 70%, #CE1126 0%, transparent 45%)",
        }}
      />
      <div className="relative z-10 text-center max-w-xl w-full">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium text-amber-200 mb-6 border border-white/10">
          <Sparkles className="w-4 h-4" /> Práctica de naturalización mexicana
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-4 bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
          Examen <span className="italic font-serif">de Naturalización</span>
        </h1>
        <p className="text-lg md:text-xl text-emerald-100/90 mb-10 leading-relaxed">
          Simulador de Historia/Cultura (10 preguntas, pasa con 8), Lectura (6
          preguntas, pasa con 5) y práctica de Entrevista y Redacción.
        </p>
        <form
          onSubmit={submit}
          className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40 text-left max-w-md mx-auto"
        >
          <label htmlFor="phone" className="block text-sm font-medium text-emerald-100 mb-1">
            Número de teléfono
          </label>
          <div className="relative mb-4">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" />
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/50 transition"
            />
          </div>
          <label htmlFor="name" className="block text-sm font-medium text-emerald-100 mb-1">
            Tu nombre (opcional)
          </label>
          <div className="relative mb-5">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" />
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder:text-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/50 transition"
            />
          </div>
          {error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 text-emerald-950 font-extrabold text-lg shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar / Registrarme"} <ArrowRight className="w-5 h-5" />
          </button>
        </form>
        <p className="mt-8 text-emerald-300/60 text-sm">
          Tu progreso se guarda por teléfono. Regresa cuando quieras practicar.
        </p>
      </div>
    </main>
  );
}
