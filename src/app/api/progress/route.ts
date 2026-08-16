import { db } from "@/db";
import {
  users,
  questions,
  flashcards,
  examAttempts,
  dailyStats,
} from "@/db/schema";
import { sql, eq, desc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FLASH_ARCHIVE_STREAK, DAILY_FLASHCARD_GOAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0] || null;

    const marks = await db
      .select({ questionId: flashcards.questionId, mark: flashcards.mark })
      .from(flashcards)
      .where(eq(flashcards.userId, userId))
      .orderBy(flashcards.createdAt);

    const byQ = new Map<number, string[]>();
    for (const m of marks) {
      const arr = byQ.get(m.questionId) || [];
      arr.push(m.mark);
      byQ.set(m.questionId, arr);
    }

    const archivedIds: number[] = [];
    const difficultIds: number[] = [];
    for (const [qId, m] of byQ) {
      const last = m.slice(-FLASH_ARCHIVE_STREAK);
      if (last.length >= FLASH_ARCHIVE_STREAK && last.every((x) => x === "facil")) {
        archivedIds.push(qId);
      } else if (m[m.length - 1] === "dificil") {
        difficultIds.push(qId);
      }
    }

    let archivedQuestions: any[] = [];
    let difficultQuestions: any[] = [];
    if (archivedIds.length) {
      archivedQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, archivedIds));
    }
    if (difficultIds.length) {
      difficultQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, difficultIds));
    }

    const attempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.userId, userId))
      .orderBy(desc(examAttempts.createdAt))
      .limit(10);

    const today = new Date().toISOString().slice(0, 10);
    const dailyRows = await db
      .select()
      .from(dailyStats)
      .where(sql`${dailyStats.userId} = ${userId} AND ${dailyStats.day} = ${today}::date`)
      .limit(1);

    const daily = dailyRows[0] || {
      flashcards: 0,
      simuladorDone: false,
      lecturaDone: false,
    };

    const totalQuestions = await db.execute(
      sql`SELECT COUNT(*)::int AS n FROM questions WHERE is_active = true`,
    );
    const totalQ = parseInt((totalQuestions.rows[0] as any).n, 10);

    return NextResponse.json({
      user,
      totalQuestions: totalQ,
      archived: archivedQuestions.map((q) => ({
        ...q,
        streak: (byQ.get(q.id) || []).slice(-FLASH_ARCHIVE_STREAK),
      })),
      difficult: difficultQuestions,
      attempts,
      daily: {
        flashcards: daily.flashcards,
        goal: DAILY_FLASHCARD_GOAL,
        simuladorDone: daily.simuladorDone,
        lecturaDone: daily.lecturaDone,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
