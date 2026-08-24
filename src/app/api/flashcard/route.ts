import { db } from "@/db";
import { questions, flashcards, userProgress } from "@/db/schema";
import { sql, eq, and, lte, exists } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FLASHCARD_LEARN_COUNT, FLASHCARD_MIN_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Devuelve la siguiente pregunta para practicar en flashcards
export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    // Corte de fecha: hace FLASHCARD_MIN_DAYS días
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - FLASHCARD_MIN_DAYS);

    // Buscar una pregunta en flashcards que cumpla:
    // 1. No está aprendida (learned = false)
    // 2. Han pasado al menos FLASHCARD_MIN_DAYS desde lastReviewedAt
    // 3. El usuario ha respondido correctamente al menos una vez en userProgress
    const rows = await db
      .select({
        flashcard: flashcards,
        question: questions,
      })
      .from(flashcards)
      .innerJoin(questions, eq(flashcards.questionId, questions.id))
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.learned, false),
          lte(flashcards.lastReviewedAt, minDate),
          exists(
            db
              .select()
              .from(userProgress)
              .where(
                and(
                  eq(userProgress.userId, userId),
                  eq(userProgress.questionId, questions.id),
                  eq(userProgress.isCorrect, true),
                ),
              ),
          ),
        ),
      )
      .orderBy(sql`random()`)
      .limit(1);

    const learnedRow = await db.execute(sql`
      SELECT COUNT(*)::int AS l
      FROM flashcards
      WHERE user_id = ${userId} AND learned = true
    `);
    const learnedCount = parseInt((learnedRow.rows[0] as any).l, 10);

    const pendingRow = await db.execute(sql`
      SELECT COUNT(*)::int AS p
      FROM flashcards
      WHERE user_id = ${userId} AND learned = false
    `);
    const pendingCount = parseInt((pendingRow.rows[0] as any).p, 10);

    return NextResponse.json({
      question: rows.length > 0 ? rows[0].question : null,
      learnedCount,
      pendingCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// Registrar una respuesta de práctica en flashcards
export async function POST(req: NextRequest) {
  try {
    const { userId, questionId, isCorrect } = await req.json();
    if (!userId || !questionId || typeof isCorrect !== "boolean") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const uid = parseInt(userId, 10);
    const qid = parseInt(questionId, 10);

    // Obtener la fila actual de flashcards
    const existing = await db
      .select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.userId, uid),
          eq(flashcards.questionId, qid),
        ),
      )
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Flashcard no encontrada" }, { status: 404 });
    }

    const fc = existing[0];
    const newCorrectCount = fc.correctCount + (isCorrect ? 1 : 0);
    const newLearned = newCorrectCount >= FLASHCARD_LEARN_COUNT;

    await db
      .update(flashcards)
      .set({
        correctCount: newCorrectCount,
        learned: newLearned,
        lastReviewedAt: new Date(),
      })
      .where(eq(flashcards.id, fc.id));

    const learnedRow = await db.execute(sql`
      SELECT COUNT(*)::int AS l
      FROM flashcards
      WHERE user_id = ${uid} AND learned = true
    `);
    const learnedCount = parseInt((learnedRow.rows[0] as any).l, 10);

    return NextResponse.json({
      ok: true,
      learned: newLearned,
      correctCount: newCorrectCount,
      learnedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}