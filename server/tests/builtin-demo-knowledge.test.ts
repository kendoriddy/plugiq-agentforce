import { describe, expect, test } from "bun:test";
import {
  callTool,
  listNeedsCredential,
  listTools,
} from "../src/plugins/builtin-demo-knowledge";

const CONNECTION = { url: "builtin://agentforce-knowledge/" };

describe("AgentForce demo knowledge transport", () => {
  test("advertises one read-only search tool without credentials", async () => {
    expect(listNeedsCredential).toBe(false);
    expect(await listTools()).toEqual([
      expect.objectContaining({
        name: "search_knowledge",
        inputSchema: expect.objectContaining({ required: ["query"] }),
      }),
    ]);
  });

  test("grounds annual leave answers in the synthetic handbook", async () => {
    const result = await callTool(CONNECTION, "search_knowledge", {
      query: "How many annual leave days do employees receive?",
    });

    expect(result.isError).toBe(false);
    expect(result.text).toContain("20 working days");
    expect(result.text).toContain("Employee Handbook — Annual Leave");
    expect(result.text).toContain("Source:");
  });

  test("refuses an empty search instead of inventing an answer", async () => {
    const result = await callTool(CONNECTION, "search_knowledge", {
      query: " ",
    });

    expect(result.isError).toBe(true);
    expect(result.text).toContain("Say what");
  });
});
