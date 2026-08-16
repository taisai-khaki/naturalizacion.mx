import { db } from "@/db";
import {
  users,
  questions,
  userProgress,
  examAttempts,
  dailyStats,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  SIMULADOR_PASS,
  LECTURA_PASS,
  MASTERY_SESSIONS,
} from "@/lib/constants";

type Answer = { questionId?: number; answerIndex?: number };

export async function POST(req: NextRequest) {
  try {
    const { userId, type, answers } = await req.json();
    if (
      !userId ||
      !Array.isArray(answers) ||
      (type !== "simulador" && type !== "lectura")
    ) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const uid = parseInt(userId, 10);
    if (!uid) return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });

    const userRow = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!userRow.length) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const sessionDay = (userRow[0].practiceSession || 0) + 1;

    let correct = 0;
    const answered: number[] = [];
    for (const item of answers as Answer[]) {
      const qId = item.questionId ?? (item as any).id;
      const ans = item.answerIndex ?? (item as any).userAnswer;
      if (qId == null || ans == null) continue;

      const qRow = await db
        .select({ correctAnswer: questions.correctAnswer })
        .from(questions)
        .where(eq(questions.id, qId))
        .limit(1);
      if (!qRow.length) continue;

      const isCorrect = qRow[0].correctAnswer === ans;
      if (isCorrect) correct++;
      answered.push(qId);

      await db
        .insert(userProgress)
        .values({ userId: uid, questionId: qId, sessionDay, isCorrect });
    }

    const total = answered.length;
    const passBar = type === "simulador" ? SIMULADOR_PASS : LECTURA_PASS;
    const passed = total > 0 && correct >= passBar;

    // Stats agregados del usuario
    const stats = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_answered,
        COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS total_correct
      FROM user_progress
      WHERE user_id = ${uid}
    `);
    const s = stats.rows[0] as any;
    const totalAnswered = parseInt(s.total_answered, 10);
    const totalCorrect = parseInt(s.total_correct, 10);

    // Dominadas = preguntas correctas en >= N sesiones distintas
    const masteredRow = await db.execute(sql`
      SELECT COUNT(DISTINCT question_id)::int AS m FROM (
        SELECT question_id
        FROM user_progress
        WHERE user_id = ${uid} AND is_correct = true
        GROUP BY question_id
        HAVING COUNT(DISTINCT session_day) >= ${MASTERY_SESSIONS}
      ) t
    `);
    const masteredCount = parseInt((masteredRow.rows[0] as any).m, 10);

    // Registrar intento
    await db
      .insert(examAttempts)
      .values({ userId: uid, type, score: correct, total, passed });

    // Actualizar meta diaria
    const today = new Date().toISOString().slice(0, 10);
    const simDone = type === "simulador";
    const lecDone = type === "lectura";
    await db.execute(sql`
      INSERT INTO daily_stats (user_id, day, flashcards, simulador_done, lectura_done)
      VALUES (${uid}, ${today}, 0, ${simDone}, ${lecDone})
      ON CONFLICT (user_id, day) DO UPDATE SET
        simulador_done = daily_stats.simulador_done OR EXCLUDED.simulador_done,
        lectura_done   = daily_stats.lectura_done OR EXCLUDED.lectura_done
    `);

    // Actualizar usuario
    const patch: Record<string, any> = {
      totalCorrect,
      totalAnswered,
      masteredCount,
      practiceSession: sessionDay,
      lastActive: new Date(),
    };
    if (type === "simulador" && passed) patch.simuladorApproved = true;
    if (type === "lectura" && passed) patch.lecturaApproved = true;
    await db.update(users).set(patch).where(eq(users.id, uid));

    const fresh = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    const ready = fresh[0].simuladorApproved && fresh[0].lecturaApproved;
    await db.update(users).set({ isReady: ready }).where(eq(users.id, uid));
    fresh[0].isReady = ready;

    return NextResponse.json({
      correct,
      total,
      passed,
      passBar,
      sessionDay,
      masteredCount,
      user: fresh[0],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
