import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/**
 * Company knowledge documents. The Documents page CRUD and Knowledge Agent search
 * both read this table — not the old hardcoded demo arrays.
 */
export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    body: text("body").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("knowledge_documents_updated_idx").on(table.updatedAt),
    index("knowledge_documents_title_idx").on(table.title),
  ],
);
