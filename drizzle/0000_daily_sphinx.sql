CREATE TABLE "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day" date NOT NULL,
	"flashcards" integer DEFAULT 0 NOT NULL,
	"simulador_done" boolean DEFAULT false NOT NULL,
	"lectura_done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"mark" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"topic" text,
	"source_hint" text,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_answer" integer NOT NULL,
	"explanation" text,
	"difficulty" text DEFAULT 'media' NOT NULL,
	"categoria" text,
	"subtema" text,
	"source" text,
	"passage_id" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"session_day" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"total_answered" integer DEFAULT 0 NOT NULL,
	"mastered_count" integer DEFAULT 0 NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"simulador_approved" boolean DEFAULT false NOT NULL,
	"lectura_approved" boolean DEFAULT false NOT NULL,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"practice_session" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_stats_user_day_idx" ON "daily_stats" USING btree ("user_id","day");--> statement-breakpoint
CREATE INDEX "attempts_user_idx" ON "exam_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcards_user_idx" ON "flashcards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flashcards_question_idx" ON "flashcards" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "questions_subtema_idx" ON "questions" USING btree ("subtema");--> statement-breakpoint
CREATE INDEX "progress_user_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_user_question_session_idx" ON "user_progress" USING btree ("user_id","question_id","session_day");