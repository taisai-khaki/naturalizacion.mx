import { db } from "@/db";
import { questions, passages } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Devuelve un pasaje aleatorio + sus 6 preguntas de comprensión
export async function GET(_req: NextRequest) {
  try {
    const passageRows = await db
      .select()
      .from(passages)
      .orderBy(sql`random()`)
      .limit(1);

    if (!passageRows.length) {
      return NextResponse.json({ error: "No hay pasajes disponibles" }, { status: 404 });
    }

    const passage = passageRows[0];
    const qs = await db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.category, "lectura"),
          eq(questions.passageId, passage.id),
          eq(questions.isActive, true),
        ),
      );

    return NextResponse.json({ passage, questions: qs, total: qs.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
