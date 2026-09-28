CREATE TABLE "knowledge_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"body" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "knowledge_documents_updated_idx" ON "knowledge_documents" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "knowledge_documents_title_idx" ON "knowledge_documents" USING btree ("title");