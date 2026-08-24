import { db } from "@/db";
import { questions, passages, flashcards } from "@/db/schema";
import { sql, eq, and, ilike, or, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Banco completo: búsqueda por modo (historia_cultura | lectura)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "historia_cultura";
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);
    // Opcional: para marcar en el banco qué preguntas ya están en flashcards
    const userId = parseInt(url.searchParams.get("userId") || "0", 10);

    if (mode === "historia_cultura") {
      const cond = q
        ? or(
            ilike(questions.questionText, `%${q}%`),
            ilike(questions.subtema, `%${q}%`),
            ilike(questions.categoria, `%${q}%`),
            ilike(questions.explanation, `%${q}%`),
            sql`${questions.options}::text ILIKE ${`%${q}%`}`,
          )
        : undefined;

      const rows = await db
        .select()
        .from(questions)
        .where(
          and(eq(questions.category, "historia_cultura"), eq(questions.isActive, true), cond),
        )
        .orderBy(sql`random()`)
        .limit(limit);

      // IDs de preguntas que el usuario ya agregó a sus flashcards
      let flashcardIds: number[] = [];
      if (userId && rows.length > 0) {
        const fcRows = await db
          .select({ questionId: flashcards.questionId })
          .from(flashcards)
          .where(
            and(
              eq(flashcards.userId, userId),
              inArray(flashcards.questionId, rows.map((r: any) => r.id)),
            ),
          );
        flashcardIds = fcRows.map((r: any) => r.questionId);
      }

      return NextResponse.json({ mode, results: rows, total: rows.length, flashcardIds });
    }

    if (mode === "lectura") {
      const passageRows = await db
        .select()
        .from(passages)
        .where(
          q
            ? or(ilike(passages.title, `%${q}%`), ilike(passages.topic, `%${q}%`), ilike(passages.text, `%${q}%`))
            : undefined,
        )
        .orderBy(sql`random()`)
        .limit(limit);

      const results = [];
      for (const p of passageRows) {
        const qs = await db
          .select()
          .from(questions)
          .where(and(eq(questions.passageId, p.id), eq(questions.isActive, true)));
        results.push({ passage: p, questions: qs });
      }

      return NextResponse.json({ mode, results, total: results.length });
    }

    return NextResponse.json({ error: "Modo no válido" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
