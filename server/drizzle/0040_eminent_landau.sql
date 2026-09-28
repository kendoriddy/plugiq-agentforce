CREATE TYPE "public"."product_engineer_run_status" AS ENUM('implementing', 'awaiting_review', 'revising', 'approved', 'failed');--> statement-breakpoint
CREATE TABLE "product_engineer_runs" (
	"ticket_id" text PRIMARY KEY NOT NULL,
	"linear_issue_id" text NOT NULL,
	"title" text NOT NULL,
	"linear_url" text NOT NULL,
	"agent_id" text DEFAULT '' NOT NULL,
	"last_run_id" text,
	"status" "product_engineer_run_status" NOT NULL,
	"repos" text[] DEFAULT '{}' NOT NULL,
	"pr_url" text,
	"error" text,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "product_engineer_runs_status_idx" ON "product_engineer_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_engineer_runs_updated_idx" ON "product_engineer_runs" USING btree ("updated_at");