-- Limpiar duplicados: mantener solo la fila más reciente por (user_id, question_id)
DELETE FROM flashcards f1 USING flashcards f2
WHERE f1.id < f2.id
  AND f1.user_id = f2.user_id
  AND f1.question_id = f2.question_id;
--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "last_reviewed_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "correct_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "flashcards" ADD COLUMN "learned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Actualizar last_reviewed_at con el created_at existente para datos legacy
UPDATE "flashcards" SET "last_reviewed_at" = "created_at";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "flashcards_user_question_idx" ON "flashcards" USING btree ("user_id","question_id");