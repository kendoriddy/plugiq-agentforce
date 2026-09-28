import { describe, expect, test } from "bun:test";
import {
  knowledgeDocumentsSystemContent,
  parseKnowledgeDocumentIds,
} from "../../shared/knowledge-documents";
import { expandKnowledgeDocuments } from "../src/copilot";

describe("knowledge document markers", () => {
  test("round-trip unique ids", () => {
    const content = knowledgeDocumentsSystemContent(["a", "b", "a", ""]);
    expect(content).toBe("[[openbot-knowledge-documents:a,b]]");
    expect(parseKnowledgeDocumentIds(content!)).toEqual(["a", "b"]);
  });

  test("empty ids produce no marker", () => {
    expect(knowledgeDocumentsSystemContent([])).toBeNull();
    expect(knowledgeDocumentsSystemContent(["", "  "])).toBeNull();
  });
});

describe("expandKnowledgeDocuments", () => {
  test("replaces the system marker with title and body", async () => {
    const marker = knowledgeDocumentsSystemContent(["doc-1"])!;
    const [expanded] = await expandKnowledgeDocuments(
      [
        { id: "sys", role: "system", content: marker },
        { id: "user", role: "user", content: "summarise" },
      ],
      async () => [
        {
          id: "doc-1",
          title: "Leave Policy",
          category: "HR",
          body: "20 days annual leave.",
        },
      ],
    );

    expect(expanded.content).toContain("Leave Policy");
    expect(expanded.content).toContain("20 days annual leave.");
    expect(String(expanded.content)).not.toContain(
      "[[openbot-knowledge-documents:",
    );
  });

  test("notes missing documents without failing the turn", async () => {
    const marker = knowledgeDocumentsSystemContent(["gone"])!;
    const [expanded] = await expandKnowledgeDocuments(
      [{ id: "sys", role: "system", content: marker }],
      async () => [],
    );

    expect(expanded.content).toContain("was not found");
  });
});
