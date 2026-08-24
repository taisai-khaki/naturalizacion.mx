import { db } from "@/db";
import { questions, flashcards } from "@/db/schema";
import { sql, eq, and, not, exists } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { SIMULADOR_TOTAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Devuelve N preguntas aleatorias de Historia/Cultura (sin repetición dentro del intento)
// Excluye preguntas que el usuario ya ha aprendido en flashcards
export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);

    let whereClause = and(
      eq(questions.category, "historia_cultura"),
      eq(questions.isActive, true),
    );

    // Si hay userId, excluir preguntas aprendidas
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
                  eq(flashcards.learned, true),
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