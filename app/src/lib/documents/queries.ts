import { queryOptions } from "@tanstack/react-query";
import { client } from "@/lib/client";

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

export const documentKeys = {
  all: ["documents"] as const,
  list: (search = "") => [...documentKeys.all, "list", search] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
};

export function documentsQueryOptions(search = "") {
  const q = search.trim();
  return queryOptions({
    queryKey: documentKeys.list(q),
    queryFn: async (): Promise<KnowledgeDocumentSummary[]> => {
      const path = q
        ? `/api/documents?q=${encodeURIComponent(q)}`
        : "/api/documents";
      return (
        (await client<KnowledgeDocumentSummary[]>(path, "documents", {
          fallback: "Could not load documents.",
        })) ?? []
      );
    },
  });
}

export function documentQueryOptions(id: string) {
  return queryOptions({
    queryKey: documentKeys.detail(id),
    queryFn: () =>
      client<KnowledgeDocument>(
        `/api/documents/${encodeURIComponent(id)}`,
        "document",
        { fallback: "Could not load that document." },
      ),
    enabled: id.trim().length > 0,
  });
}
