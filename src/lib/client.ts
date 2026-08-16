export type Question = {
  id: number;
  category: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  difficulty: string;
  categoria: string | null;
  subtema: string | null;
  source: string | null;
  passageId: number | null;
};

export type Passage = {
  id: number;
  title: string;
  topic: string | null;
  sourceHint: string | null;
  text: string;
};

export type User = {
  id: number;
  phone: string;
  name: string | null;
  totalCorrect: number;
  totalAnswered: number;
  masteredCount: number;
  isReady: boolean;
  simuladorApproved: boolean;
  lecturaApproved: boolean;
  practiceSession: number;
  lastActive: string | null;
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || "Error de conexión");
  return data as T;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
