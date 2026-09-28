import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { jsonb } from "./json";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const productEngineerRunStatus = pgEnum("product_engineer_run_status", [
  "awaiting_plan_approval",
  "implementing",
  "awaiting_review",
  "revising",
  "approved",
  "failed",
]);

/**
 * One Product Engineer coding loop per Linear ticket id.
 * AgentForce dispatches; Cursor cloud does the work — only after plan approval.
 */
export const productEngineerRuns = pgTable(
  "product_engineer_runs",
  {
    ticketId: text("ticket_id").primaryKey(),
    linearIssueId: text("linear_issue_id").notNull(),
    title: text("title").notNull(),
    linearUrl: text("linear_url").notNull(),
    agentId: text("agent_id").notNull().default(""),
    lastRunId: text("last_run_id"),
    status: productEngineerRunStatus("status").notNull(),
    repos: text("repos").array().notNull().default([]),
    prUrl: text("pr_url"),
    error: text("error"),
    progress: text("progress"),
    plan: text("plan"),
    history: jsonb("history").$type<unknown[]>().notNull().default([]),
    startedByUserId: text("started_by_user_id").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("product_engineer_runs_status_idx").on(table.status),
    index("product_engineer_runs_updated_idx").on(table.updatedAt),
  ],
);
