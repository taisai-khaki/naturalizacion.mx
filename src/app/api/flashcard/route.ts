import { db } from "@/db";
import { questions, flashcards, dailyStats } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FLASH_ARCHIVE_STREAK } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getArchivedIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ questionId: flashcards.questionId, mark: flashcards.mark })
    .from(flashcards)
    .where(eq(flashcards.userId, userId))
    .orderBy(flashcards.createdAt);

  // Agrupar marcas por pregunta preservando el orden cronológico
  const byQ = new Map<number, string[]>();
  for (const r of rows) {
    const arr = byQ.get(r.questionId) || [];
    arr.push(r.mark);
    byQ.set(r.questionId, arr);
  }

  const archived: number[] = [];
  for (const [qId, marks] of byQ) {
    if (marks.length >= FLASH_ARCHIVE_STREAK) {
      const last = marks.slice(-FLASH_ARCHIVE_STREAK);
      if (last.every((m) => m === "facil")) archived.push(qId);
    }
  }
  return archived;
}

async function getStudiedToday(userId: number): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.execute(sql`
    SELECT COUNT(DISTINCT question_id)::int AS n
    FROM flashcards
    WHERE user_id = ${userId} AND created_at >= ${today + "T00:00:00Z"}
  `);
  return parseInt((rows.rows[0] as any).n, 10);
}

export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const archived = await getArchivedIds(userId);
    const studiedToday = await getStudiedToday(userId);

    const rows = await db
      .select()
      .from(questions)
      .where(
        and(eq(questions.category, "historia_cultura"), eq(questions.isActive, true)),
      )
      .orderBy(sql`random()`)
      .limit(50);

    const question =
      rows.find((q: { id: number }) => !archived.includes(q.id)) || rows[0] || null;

    return NextResponse.json({
      question,
      archivedCount: archived.length,
      studiedToday,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, questionId, mark } = await req.json();
    if (!userId || !questionId || (mark !== "facil" && mark !== "dificil")) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const uid = parseInt(userId, 10);
    const qid = parseInt(questionId, 10);

    await db.insert(flashcards).values({ userId: uid, questionId: qid, mark });

    // Incrementar contador de meta diaria
    const today = new Date().toISOString().slice(0, 10);
    await db.execute(sql`
      INSERT INTO daily_stats (user_id, day, flashcards, simulador_done, lectura_done)
      VALUES (${uid}, ${today}, 1, false, false)
      ON CONFLICT (user_id, day) DO UPDATE SET
        flashcards = (SELECT COUNT(DISTINCT f.question_id) FROM flashcards f WHERE f.user_id = ${uid} AND f.created_at >= ${today + "T00:00:00Z"})
    `);

    const archived = await getArchivedIds(uid);
    return NextResponse.json({ ok: true, archivedCount: archived.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
