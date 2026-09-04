import { db } from "@/db";
import {
  users,
  questions,
  flashcards,
  examAttempts,
} from "@/db/schema";
import { sql, eq, desc, inArray, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { FLASHCARD_LEARN_COUNT, FLASHCARD_MIN_DAYS } from "@/lib/constants";

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
      SELECT f.question_id, f.correct_count, f.last_reviewed_at, f.mark
      FROM flashcards f
      WHERE f.user_id = ${userId} AND f.learned = false
    `);
    const pendingRows = pending.rows as { question_id: number; correct_count: number; last_reviewed_at: string; mark: string }[];

    let pendingQuestions: any[] = [];
    if (pendingRows.length > 0) {
      const ids = pendingRows.map((r) => r.question_id);
      const pendingMap = new Map(
        pendingRows.map((r) => [
          r.question_id,
          { correctCount: r.correct_count, lastReviewedAt: r.last_reviewed_at, mark: r.mark },
        ]),
      );

      const minDateCorrect = new Date();
      minDateCorrect.setDate(minDateCorrect.getDate() - FLASHCARD_MIN_DAYS);
      const minDateWrong = new Date();
      minDateWrong.setDate(minDateWrong.getDate() - 1);

      pendingQuestions = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, ids));
      pendingQuestions = pendingQuestions.map((q: any) => {
        const info = pendingMap.get(q.id) || { correctCount: 0, lastReviewedAt: null, mark: "facil" };
        const last = info.lastReviewedAt ? new Date(info.lastReviewedAt) : null;
        const minDate = info.mark === "wrong" ? minDateWrong : minDateCorrect;
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

    const totalQuestions = await db.execute(
      sql`SELECT COUNT(*)::int AS n FROM questions WHERE is_active = true`,
    );
    const totalQ = parseInt((totalQuestions.rows[0] as any).n, 10);

    const totalHistRow = await db.execute(
      sql`SELECT COUNT(*)::int AS n FROM questions WHERE is_active = true AND category = 'historia_cultura'`,
    );
    const totalHist = parseInt((totalHistRow.rows[0] as any).n, 10);

    // Lista completa de historia/cultura con estado de flashcard
    const allHistQuestions = await db
      .select()
      .from(questions)
      .where(and(eq(questions.category, "historia_cultura"), eq(questions.isActive, true)))
      .orderBy(questions.id);

    const allFcRows = await db.select().from(flashcards).where(eq(flashcards.userId, userId));
    const fcMap = new Map(allFcRows.map((f: any) => [f.questionId, f]));
    const minDateAllCorrect = new Date();
    minDateAllCorrect.setDate(minDateAllCorrect.getDate() - FLASHCARD_MIN_DAYS);
    const minDateAllWrong = new Date();
    minDateAllWrong.setDate(minDateAllWrong.getDate() - 1);

    const allQuestions = allHistQuestions.map((q: any) => {
      const fc: any = fcMap.get(q.id);
      if (!fc) {
        return {
          ...q,
          status: "not_started" as const,
          correctCount: 0,
          learned: false,
          lastReviewedAt: null,
          availableForReview: false,
        };
      }
      if (fc.learned) {
        return {
          ...q,
          status: "learned" as const,
          correctCount: fc.correctCount,
          learned: true,
          lastReviewedAt: fc.lastReviewedAt,
          availableForReview: false,
        };
      }
      const last = fc.lastReviewedAt ? new Date(fc.lastReviewedAt) : null;
      const minDate = fc.mark === "wrong" ? minDateAllWrong : minDateAllCorrect;
      return {
        ...q,
        status: "pending" as const,
        correctCount: fc.correctCount,
        learned: false,
        lastReviewedAt: fc.lastReviewedAt,
        availableForReview: last ? last <= minDate : true,
      };
    });

    const notStarted = allQuestions.filter((q: any) => q.status === "not_started");

    return NextResponse.json({
      user,
      totalQuestions: totalQ,
      totalHist,
      learned: learnedQuestions,
      pending: pendingQuestions,
      allQuestions,
      notStarted,
      attempts,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}