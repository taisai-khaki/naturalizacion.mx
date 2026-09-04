import { db } from "@/db";
import { questions, flashcards } from "@/db/schema";
import { sql, eq, and, ne, or, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FLASHCARD_LEARN_COUNT, FLASHCARD_MIN_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Devuelve la siguiente pregunta para practicar en flashcards
export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    const categoria = req.nextUrl.searchParams.get("categoria") || "all";

    // Intervalos de repetición espaciada: 5 días para acertadas, 1 día para falladas
    const minDateCorrect = new Date();
    minDateCorrect.setDate(minDateCorrect.getDate() - FLASHCARD_MIN_DAYS);
    const minDateWrong = new Date();
    minDateWrong.setDate(minDateWrong.getDate() - 1);

    const filters = [
      eq(flashcards.userId, userId),
      eq(flashcards.learned, false),
      or(
        and(eq(flashcards.mark, "wrong"), lte(flashcards.lastReviewedAt, minDateWrong)),
        and(ne(flashcards.mark, "wrong"), lte(flashcards.lastReviewedAt, minDateCorrect)),
      ),
    ];
    if (categoria !== "all") filters.push(eq(questions.categoria, categoria));

    // Buscar una pregunta en flashcards que cumpla:
    // 1. No está aprendida (learned = false)
    // 2. Cumple el intervalo de repetición espaciada (5 días si acertada, 1 día si fallada, o nueva)
    // 3. (opcional) filtro de categoría Historia/Cultura/Cívica/Geografía
    // Ordenamos por lastReviewedAt ASC (más antigua primero) para rotación
    // estable y evitar que random devuelva la misma tarjeta todos los días.
    const rows = await db
      .select({
        flashcard: flashcards,
        question: questions,
      })
      .from(flashcards)
      .innerJoin(questions, eq(flashcards.questionId, questions.id))
      .where(and(...filters))
      .orderBy(flashcards.lastReviewedAt, sql`random()`)
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

    const dueRow = await db.execute(sql`
      SELECT COUNT(*)::int AS d
      FROM flashcards
      WHERE user_id = ${userId}
        AND learned = false
        AND (
          (mark = 'wrong' AND last_reviewed_at <= ${minDateWrong})
          OR (mark != 'wrong' AND last_reviewed_at <= ${minDateCorrect})
        )
    `);
    const dueCount = parseInt((dueRow.rows[0] as any).d, 10);

    return NextResponse.json({
      question: rows.length > 0 ? rows[0].question : null,
      learnedCount,
      pendingCount,
      dueCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// Registrar una respuesta de práctica en flashcards, o agregar manualmente
// una pregunta del banco (action === "add") para repasarla en flashcards.
export async function POST(req: NextRequest) {
  try {
    const { userId, questionId, isCorrect, action } = await req.json();
    if (!userId || !questionId) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const uid = parseInt(userId, 10);
    const qid = parseInt(questionId, 10);

    // Agregar manualmente una pregunta del banco a las flashcards del usuario.
    if (action === "add") {
      const qRow = await db
        .select({ id: questions.id })
        .from(questions)
        .where(
          and(
            eq(questions.id, qid),
            eq(questions.category, "historia_cultura"),
            eq(questions.isActive, true),
          ),
        )
        .limit(1);
      if (!qRow.length) {
        return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
      }

      const existing = await db
        .select()
        .from(flashcards)
        .where(and(eq(flashcards.userId, uid), eq(flashcards.questionId, qid)))
        .limit(1);

      let already = existing.length > 0;
      if (!already) {
        await db.insert(flashcards).values({
          userId: uid,
          questionId: qid,
          mark: "facil",
          createdAt: new Date(),
          lastReviewedAt: new Date(0),
          correctCount: 0,
          learned: false,
        });
      }

      const pendingRow = await db.execute(sql`
        SELECT COUNT(*)::int AS p
        FROM flashcards
        WHERE user_id = ${uid} AND learned = false
      `);
      const pendingCount = parseInt((pendingRow.rows[0] as any).p, 10);

      return NextResponse.json({ ok: true, already, pendingCount });
    }

    if (typeof isCorrect !== "boolean") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

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
    // Si la respuesta es incorrecta, el contador vuelve a 0 (requiere 5 aciertos seguidos)
    const newCorrectCount = isCorrect ? fc.correctCount + 1 : 0;
    const newLearned = newCorrectCount >= FLASHCARD_LEARN_COUNT;
    const newMark = isCorrect ? "facil" : "wrong";

    await db
      .update(flashcards)
      .set({
        mark: newMark,
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