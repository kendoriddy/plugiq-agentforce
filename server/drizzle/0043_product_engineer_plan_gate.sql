ALTER TYPE "public"."product_engineer_run_status" ADD VALUE IF NOT EXISTS 'awaiting_plan_approval';--> statement-breakpoint
ALTER TABLE "product_engineer_runs" ADD COLUMN IF NOT EXISTS "plan" text;
