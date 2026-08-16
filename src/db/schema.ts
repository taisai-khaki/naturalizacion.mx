import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  totalCorrect: integer("total_correct").default(0).notNull(),
  totalAnswered: integer("total_answered").default(0).notNull(),
  masteredCount: integer("mastered_count").default(0).notNull(),
  isReady: boolean("is_ready").default(false).notNull(),
  simuladorApproved: boolean("simulador_approved").default(false).notNull(),
  lecturaApproved: boolean("lectura_approved").default(false).notNull(),
  lastActive: timestamp("last_active", { withTimezone: true }).defaultNow().notNull(),
  practiceSession: integer("practice_session").default(0).notNull(),
});

export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'simulador' | 'lectura'
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    passed: boolean("passed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("attempts_user_idx").on(table.userId)],
);

export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  topic: text("topic"),
  sourceHint: text("source_hint"),
  text: text("text").notNull(),
});

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    // 'historia_cultura' | 'lectura'
    category: text("category").notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options").notNull(),
    correctAnswer: integer("correct_answer").notNull(),
    explanation: text("explanation"),
    difficulty: text("difficulty").default("media").notNull(), // 'facil' | 'media'
    categoria: text("categoria"), // Historia | Cultura | Civica | Geografia
    subtema: text("subtema"),
    source: text("source"),
    passageId: integer("passage_id").references(() => passages.id, {
      onDelete: "cascade",
    }),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("questions_category_idx").on(table.category),
    index("questions_subtema_idx").on(table.subtema),
  ],
);

export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    // Número de sesión (cada práctica cuenta como un día distinto)
    sessionDay: integer("session_day").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("progress_user_idx").on(table.userId),
    index("progress_user_question_session_idx").on(
      table.userId,
      table.questionId,
      table.sessionDay,
    ),
  ],
);

export const flashcards = pgTable(
  "flashcards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    mark: text("mark").notNull(), // 'facil' | 'dificil'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("flashcards_user_idx").on(table.userId),
    index("flashcards_question_idx").on(table.questionId),
  ],
);

export const dailyStats = pgTable(
  "daily_stats",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    flashcards: integer("flashcards").default(0).notNull(),
    simuladorDone: boolean("simulador_done").default(false).notNull(),
    lecturaDone: boolean("lectura_done").default(false).notNull(),
  },
  (table) => [uniqueIndex("daily_stats_user_day_idx").on(table.userId, table.day)],
);
