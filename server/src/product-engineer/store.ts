import { desc, eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { productEngineerRuns } from "../db/schema";
import type {
  RunStatus,
  TicketRun,
  TicketRunHistoryEntry,
} from "product-engineer-loop";

export type ProductEngineerRunRow = TicketRun & {
  startedByUserId: string;
  error: string | null;
  progress: string | null;
};

function toRun(
  row: typeof productEngineerRuns.$inferSelect,
): ProductEngineerRunRow {
  return {
    ticketId: row.ticketId,
    linearIssueId: row.linearIssueId,
    title: row.title,
    linearUrl: row.linearUrl,
    agentId: row.agentId,
    lastRunId: row.lastRunId,
    status: row.status,
    repos: row.repos,
    prUrl: row.prUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    history: (row.history ?? []) as TicketRunHistoryEntry[],
    plan: row.plan,
    error: row.error,
    progress: row.progress,
    startedByUserId: row.startedByUserId,
  };
}

export type ProductEngineerStore = {
  list(): Promise<ProductEngineerRunRow[]>;
  get(ticketId: string): Promise<ProductEngineerRunRow | null>;
  insert(input: {
    ticketId: string;
    linearIssueId: string;
    title: string;
    linearUrl: string;
    status: RunStatus;
    repos: string[];
    startedByUserId: string;
    plan?: string | null;
    history?: TicketRunHistoryEntry[];
  }): Promise<ProductEngineerRunRow>;
  save(
    run: TicketRun & { error?: string | null; plan?: string | null },
  ): Promise<ProductEngineerRunRow>;
  setStatus(
    ticketId: string,
    status: RunStatus,
    patch?: {
      error?: string | null;
      agentId?: string;
      plan?: string | null;
      progress?: string | null;
    },
  ): Promise<ProductEngineerRunRow | null>;
  /** Persist mid-run Cursor agent id / stream text without changing status. */
  updateLive(
    ticketId: string,
    patch: {
      agentId?: string;
      lastRunId?: string | null;
      progress?: string;
    },
  ): Promise<ProductEngineerRunRow | null>;
};

export function createProductEngineerStore(
  database: Database,
): ProductEngineerStore {
  return {
    async list() {
      const rows = await database
        .select()
        .from(productEngineerRuns)
        .orderBy(desc(productEngineerRuns.updatedAt))
        .limit(50);
      return rows.map(toRun);
    },

    async get(ticketId) {
      const [row] = await database
        .select()
        .from(productEngineerRuns)
        .where(eq(productEngineerRuns.ticketId, ticketId))
        .limit(1);
      return row ? toRun(row) : null;
    },

    async insert(input) {
      const [row] = await database
        .insert(productEngineerRuns)
        .values({
          ticketId: input.ticketId,
          linearIssueId: input.linearIssueId,
          title: input.title,
          linearUrl: input.linearUrl,
          status: input.status,
          repos: input.repos,
          startedByUserId: input.startedByUserId,
          history: input.history ?? [],
          agentId: "",
          error: null,
          progress: null,
          plan: input.plan ?? null,
        })
        .returning();
      if (!row) throw new Error("Failed to insert product engineer run.");
      return toRun(row);
    },

    async save(run) {
      const [row] = await database
        .update(productEngineerRuns)
        .set({
          linearIssueId: run.linearIssueId,
          title: run.title,
          linearUrl: run.linearUrl,
          agentId: run.agentId,
          lastRunId: run.lastRunId,
          status: run.status,
          repos: run.repos,
          prUrl: run.prUrl,
          error: run.error ?? null,
          progress: run.progress ?? null,
          plan: run.plan ?? null,
          history: run.history,
          updatedAt: new Date(),
        })
        .where(eq(productEngineerRuns.ticketId, run.ticketId))
        .returning();
      if (!row) throw new Error(`No product engineer run for ${run.ticketId}.`);
      return toRun(row);
    },

    async setStatus(ticketId, status, patch = {}) {
      const [row] = await database
        .update(productEngineerRuns)
        .set({
          status,
          ...(patch.error !== undefined ? { error: patch.error } : {}),
          ...(patch.agentId !== undefined ? { agentId: patch.agentId } : {}),
          ...(patch.plan !== undefined ? { plan: patch.plan } : {}),
          ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
          updatedAt: new Date(),
        })
        .where(eq(productEngineerRuns.ticketId, ticketId))
        .returning();
      return row ? toRun(row) : null;
    },

    async updateLive(ticketId, patch) {
      const [row] = await database
        .update(productEngineerRuns)
        .set({
          ...(patch.agentId !== undefined ? { agentId: patch.agentId } : {}),
          ...(patch.lastRunId !== undefined
            ? { lastRunId: patch.lastRunId }
            : {}),
          ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
          updatedAt: new Date(),
        })
        .where(eq(productEngineerRuns.ticketId, ticketId))
        .returning();
      return row ? toRun(row) : null;
    },
  };
}
