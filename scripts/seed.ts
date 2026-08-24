import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../src/db/index.js";
import { passages, questions } from "../src/db/schema.js";
import { sql } from "drizzle-orm";

const DATA_DIR = join(process.cwd(), "data");
const FORCE = process.argv.includes("--force");

type HistQuestion = {
  id: number;
  seccion: string;
  categoria: string;
  subtema: string;
  dificultad: string;
  pregunta: string;
  respuesta: string;
  opciones: string[];
  explicacion: string;
  fuente: string;
};

type ReadingQuestion = {
  question: string;
  options: string[];
  correct: string;
};

type Passage = {
  id: number;
  title: string;
  topic: string;
  source_hint: string;
  text: string;
  questions: ReadingQuestion[];
};

async function countQuestions(): Promise<number> {
  const rows = await db.execute(sql`SELECT COUNT(*)::int AS n FROM questions`);
  return parseInt(rows.rows[0].n, 10);
}

// Shuffle the options (and keep the correct answer index aligned) so the
// correct answer is not always placed in the same position.
function shuffleWithCorrect(options: string[], correctText: string) {
  const original = options.indexOf(correctText);
  const perm = options.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  return {
    options: perm.map((i) => options[i]),
    correct: perm.indexOf(original),
  };
}

async function seed() {
  const existing = await countQuestions();
  if (existing > 0 && !FORCE) {
    console.log(`La base ya tiene ${existing} preguntas. Usa --force para recargar.`);
    return;
  }

  const hist: HistQuestion[] = JSON.parse(
    readFileSync(join(DATA_DIR, "questions.json"), "utf-8"),
  );
  const passagesData: Passage[] = JSON.parse(
    readFileSync(join(DATA_DIR, "reading_passages.json"), "utf-8"),
  );

  if (FORCE) {
    await db.execute(
      sql`TRUNCATE TABLE user_progress, flashcards, daily_stats, exam_attempts, questions, passages RESTART IDENTITY CASCADE`,
    );
  }

  // 1) Pasajes de lectura
  const passageIdByOriginal: Record<number, number> = {};
  for (const p of passagesData) {
    const inserted = await db
      .insert(passages)
      .values({
        title: p.title,
        topic: p.topic || null,
        sourceHint: p.source_hint || null,
        text: p.text,
      })
      .returning({ id: passages.id });
    passageIdByOriginal[p.id] = inserted[0].id;
  }

  // 2) Historia/Cultura
  const histRows = hist.map((q) => {
    const shuffled = shuffleWithCorrect(q.opciones, q.respuesta);
    return {
      category: "historia_cultura",
      questionText: q.pregunta,
      options: shuffled.options,
      correctAnswer: shuffled.correct,
      explanation: q.explicacion || null,
      difficulty: q.dificultad || "media",
      categoria: q.categoria || null,
      subtema: q.subtema || null,
      source: q.fuente || null,
      isActive: true,
    };
  });

  // 3) Lectura
  const lecturaRows = passagesData.flatMap((p) =>
    p.questions.map((q) => {
      const shuffled = shuffleWithCorrect(q.options, q.correct);
      return {
        category: "lectura",
        questionText: q.question,
        options: shuffled.options,
        correctAnswer: shuffled.correct,
        explanation: null,
        difficulty: "media",
        categoria: null,
        subtema: p.topic || null,
        source: p.source_hint || null,
        passageId: passageIdByOriginal[p.id],
        isActive: true,
      };
    }),
  );

  const allRows = [...histRows, ...lecturaRows];
  const BATCH = 500;
  for (let i = 0; i < allRows.length; i += BATCH) {
    await db.insert(questions).values(allRows.slice(i, i + BATCH));
  }

  console.log(
    `Seeded ${histRows.length} historia/cultura + ${lecturaRows.length} lectura = ${allRows.length} preguntas (${passagesData.length} pasajes).`,
  );
}

seed()
  .then(() => {
    console.log("Listo.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
