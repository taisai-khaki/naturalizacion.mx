import { db } from "@/db";
import { questions } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { SIMULADOR_TOTAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Devuelve N preguntas aleatorias de Historia/Cultura (sin repetición dentro del intento)
export async function GET(_req: NextRequest) {
  try {
    const rows = await db
      .select()
      .from(questions)
      .where(
        and(eq(questions.category, "historia_cultura"), eq(questions.isActive, true)),
      )
      .orderBy(sql`random()`)
      .limit(SIMULADOR_TOTAL);

    return NextResponse.json({ questions: rows, total: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
