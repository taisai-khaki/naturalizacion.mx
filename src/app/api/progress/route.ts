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
import { DAILY_FLASHCARD_GOAL, FLASHCARD_MIN_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get("userId") || "0", 10);
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0] || null;

    // Preguntas aprendidas en flashcards
    const learned = await db.execute(sql`
      SELECT f.question_id, f.correct_count
      FROM flashcards f
      WHERE f.user_id = ${userId} AND f.learned = true
    `);
    const learnedRows = learned.rows as { question_id: number; correct_count: number }[];

    let learnedQuestions: any[] = [];
    if (learnedRows.length > 0) {
      const ids = learnedRows.map((r) => r.question_id);
      const correctMap = new Map(learnedRows.map((r) => [r.question_id, r.correct_count]));

      learnedQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, ids));
      learnedQuestions = learnedQuestions.map((q: any) => ({
        ...q,
        correctCount: correctMap.get(q.id) || 0,
      }));
    }

    // Preguntas pendientes en flashcards (no aprendidas)
    const pending = await db.execute(sql`
      SELECT f.question_id, f.correct_count, f.last_reviewed_at
      FROM flashcards f
      WHERE f.user_id = ${userId} AND f.learned = false
    `);
    const pendingRows = pending.rows as { question_id: number; correct_count: number; last_reviewed_at: string }[];

    let pendingQuestions: any[] = [];
    if (pendingRows.length > 0) {
      const ids = pendingRows.map((r) => r.question_id);
      const pendingMap = new Map(
        pendingRows.map((r) => [
          r.question_id,
          { correctCount: r.correct_count, lastReviewedAt: r.last_reviewed_at },
        ]),
      );

      const minDate = new Date();
      minDate.setDate(minDate.getDate() - FLASHCARD_MIN_DAYS);

      pendingQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, ids));
      pendingQuestions = pendingQuestions.map((q: any) => {
        const info = pendingMap.get(q.id) || { correctCount: 0, lastReviewedAt: null };
        const last = info.lastReviewedAt ? new Date(info.lastReviewedAt) : null;
        return {
          ...q,
          correctCount: info.correctCount,
          lastReviewedAt: info.lastReviewedAt,
          availableForReview: last ? last <= minDate : true,
        };
      });
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
      learned: learnedQuestions,
      pending: pendingQuestions,
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