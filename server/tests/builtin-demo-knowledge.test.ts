import { describe, expect, test } from "bun:test";
import {
  callTool,
  listNeedsCredential,
  listTools,
  useKnowledgeDocuments,
} from "../src/plugins/builtin-demo-knowledge";
import type { KnowledgeDocumentStore } from "../src/documents/store";

const CONNECTION = { url: "builtin://agentforce-knowledge/" };

const fakeStore = {
  async search(query: string) {
    if (!query.includes("leave") && !query.includes("annual")) return [];
    return [
      {
        id: "doc-1",
        title: "Employee Handbook — Annual Leave",
        category: "People & Culture",
        body: "Full-time employees receive 20 working days of annual leave each calendar year.",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "test",
      },
    ];
  },
} as unknown as KnowledgeDocumentStore;

describe("AgentForce knowledge transport", () => {
  test("advertises one read-only search tool without credentials", async () => {
    expect(listNeedsCredential).toBe(false);
    expect(await listTools()).toEqual([
      expect.objectContaining({
        name: "search_knowledge",
        inputSchema: expect.objectContaining({ required: ["query"] }),
      }),
    ]);
  });

  test("grounds annual leave answers in stored documents", async () => {
    useKnowledgeDocuments(fakeStore);
    const result = await callTool(CONNECTION, "search_knowledge", {
      query: "How many annual leave days do employees receive?",
    });

    expect(result.isError).toBe(false);
    expect(result.text).toContain("20 working days");
    expect(result.text).toContain("Employee Handbook — Annual Leave");
    expect(result.text).toContain("Source:");
  });

  test("refuses an empty search instead of inventing an answer", async () => {
    useKnowledgeDocuments(fakeStore);
    const result = await callTool(CONNECTION, "search_knowledge", {
      query: " ",
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Say what");
  });
});
