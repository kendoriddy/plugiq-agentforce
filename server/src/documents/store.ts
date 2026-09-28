import { desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Database } from "../db/client";
import { knowledgeDocuments } from "../db/schema";

/** Enough for one turn to inline a few documents without blowing the context window. */
export const MAX_DOCUMENT_BODY_CHARS = 50_000;

export type KnowledgeDocumentSummary = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
};

export type KnowledgeDocument = KnowledgeDocumentSummary & {
  body: string;
};

function toSummary(
  row: typeof knowledgeDocuments.$inferSelect,
): KnowledgeDocumentSummary {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
  };
}

function toDocument(
  row: typeof knowledgeDocuments.$inferSelect,
): KnowledgeDocument {
  return { ...toSummary(row), body: row.body };
}

export type KnowledgeDocumentStore = {
  list(search?: string): Promise<KnowledgeDocumentSummary[]>;
  get(id: string): Promise<KnowledgeDocument | null>;
  getMany(ids: readonly string[]): Promise<KnowledgeDocument[]>;
  create(input: {
    title: string;
    category: string;
    body: string;
    createdBy: string;
  }): Promise<KnowledgeDocument>;
  update(
    id: string,
    input: { title: string; category: string; body: string },
  ): Promise<KnowledgeDocument | null>;
  remove(id: string): Promise<boolean>;
  search(query: string): Promise<KnowledgeDocument[]>;
  seedIfEmpty(
    docs: readonly {
      title: string;
      category: string;
      body: string;
      createdBy: string;
    }[],
  ): Promise<number>;
};

export function createKnowledgeDocumentStore(
  database: Database,
): KnowledgeDocumentStore {
  return {
    async list(search) {
      const needle = search?.trim();
      if (!needle) {
        const rows = await database
          .select()
          .from(knowledgeDocuments)
          .orderBy(desc(knowledgeDocuments.updatedAt))
          .limit(200);
        return rows.map(toSummary);
      }
      const pattern = `%${needle}%`;
      const rows = await database
        .select()
        .from(knowledgeDocuments)
        .where(
          or(
            ilike(knowledgeDocuments.title, pattern),
            ilike(knowledgeDocuments.category, pattern),
            ilike(knowledgeDocuments.body, pattern),
          ),
        )
        .orderBy(desc(knowledgeDocuments.updatedAt))
        .limit(200);
      return rows.map(toSummary);
    },

    async get(id) {
      const [row] = await database
        .select()
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.id, id))
        .limit(1);
      return row ? toDocument(row) : null;
    },

    async getMany(ids) {
      if (ids.length === 0) return [];
      const unique = [...new Set(ids)];
      const rows = await database
        .select()
        .from(knowledgeDocuments)
        .where(inArray(knowledgeDocuments.id, unique));
      const byId = new Map(rows.map((row) => [row.id, row]));
      return unique
        .map((id) => byId.get(id))
        .filter((row): row is NonNullable<typeof row> => row !== undefined)
        .map(toDocument);
    },

    async create(input) {
      const [row] = await database
        .insert(knowledgeDocuments)
        .values({
          id: randomUUID(),
          title: input.title.trim(),
          category: input.category.trim(),
          body: input.body,
          createdBy: input.createdBy,
        })
        .returning();
      if (!row) throw new Error("Failed to create document.");
      return toDocument(row);
    },

    async update(id, input) {
      const [row] = await database
        .update(knowledgeDocuments)
        .set({
          title: input.title.trim(),
          category: input.category.trim(),
          body: input.body,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeDocuments.id, id))
        .returning();
      return row ? toDocument(row) : null;
    },

    async remove(id) {
      const removed = await database
        .delete(knowledgeDocuments)
        .where(eq(knowledgeDocuments.id, id))
        .returning({ id: knowledgeDocuments.id });
      return removed.length > 0;
    },

    async search(query) {
      const words = query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);
      const rows = await database
        .select()
        .from(knowledgeDocuments)
        .orderBy(desc(knowledgeDocuments.updatedAt))
        .limit(200);
      if (words.length === 0) return rows.slice(0, 3).map(toDocument);
      const matches = rows.filter((row) => {
        const haystack =
          `${row.title} ${row.category} ${row.body}`.toLowerCase();
        return words.some((word) => haystack.includes(word));
      });
      const selected = matches.length > 0 ? matches : rows.slice(0, 3);
      return selected.map(toDocument);
    },

    async seedIfEmpty(docs) {
      const [{ count }] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(knowledgeDocuments);
      if (count > 0) return 0;
      for (const doc of docs) {
        await database.insert(knowledgeDocuments).values({
          id: randomUUID(),
          title: doc.title,
          category: doc.category,
          body: doc.body,
          createdBy: doc.createdBy,
        });
      }
      return docs.length;
    },
  };
}
