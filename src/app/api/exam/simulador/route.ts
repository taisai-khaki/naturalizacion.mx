import { db } from "@/db";
import { questions, flashcards } from "@/db/schema";
import { sql, eq, and, not, exists } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { SIMULADOR_TOTAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Devuelve N preguntas aleatorias de Historia/Cultura (sin repetición dentro del intento)
// REGLA: excluye CUALQUIER pregunta que ya esté en las flashcards del usuario
// (pendiente o aprendida). Una vez que una pregunta entró a la lista, el
// usuario la estudia desde Flashcards, no desde el simulador. Antes solo se
// excluían las aprendidas, así que las pendientes se repetían una y otra vez
// y sus contadores nunca avanzaban.
export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);

    let whereClause = and(
      eq(questions.category, "historia_cultura"),
      eq(questions.isActive, true),
    );

    // Si hay userId, excluir toda pregunta con tarjeta (pendiente o aprendida)
    if (userId) {
      whereClause = and(
        whereClause,
        not(
          exists(
            db
              .select()
              .from(flashcards)
              .where(
                and(
                  eq(flashcards.userId, userId),
                  eq(flashcards.questionId, questions.id),
                ),
              ),
          ),
        ),
      );
    }

    const rows = await db
      .select()
      .from(questions)
      .where(whereClause)
      .orderBy(sql`random()`)
      .limit(SIMULADOR_TOTAL);

    return NextResponse.json({ questions: rows, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}