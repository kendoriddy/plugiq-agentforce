import type { McpCallResult, McpTool } from "./mcp";

type DemoDocument = {
  title: string;
  url: string;
  keywords: string[];
  body: string;
};

const DOCUMENTS: readonly DemoDocument[] = Object.freeze([
  {
    title: "Employee Handbook — Annual Leave",
    url: "https://demo.agentforce.local/knowledge/employee-handbook",
    keywords: ["annual", "leave", "holiday", "days", "handbook"],
    body: "Full-time employees receive 20 working days of annual leave each calendar year. Leave should be requested at least five working days in advance and approved by the employee's manager. Up to five unused days may be carried into the next calendar year and must be used by March 31.",
  },
  {
    title: "Engineering Guidelines",
    url: "https://demo.agentforce.local/knowledge/engineering-guidelines",
    keywords: ["engineering", "code", "review", "pull request", "security"],
    body: "All production changes require one peer review. Pull requests must explain customer impact, include test evidence, and link the relevant issue. Security-sensitive changes require a second reviewer from the platform team.",
  },
  {
    title: "Product Overview — Plug 2.0",
    url: "https://demo.agentforce.local/knowledge/product-overview",
    keywords: ["plug", "product", "workflow", "process", "automation"],
    body: "Plug 2.0 is Descasio's workflow automation platform for digitizing approvals, requisitions, and operational processes. Current priorities are the Process Builder experience, reusable workflow templates, and clearer audit history.",
  },
]);

const TOOLS: readonly McpTool[] = Object.freeze([
  {
    name: "search_knowledge",
    description:
      "Search the approved synthetic Descasio demo documents. Use this for company policy, engineering practice, and Plug 2.0 questions. Cite the returned title and URL in the answer.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The policy, practice, or product information to find.",
        },
      },
      required: ["query"],
    },
  },
]);

export const listNeedsCredential = false;

export async function listTools(): Promise<McpTool[]> {
  return TOOLS.map((tool) => ({ ...tool }));
}

export async function callTool(
  _connection: { url: string },
  toolName: string,
  args: Record<string, unknown>,
): Promise<McpCallResult> {
  if (toolName !== "search_knowledge") {
    return {
      text: `${toolName} is not available in AgentForce demo knowledge.`,
      isError: true,
      truncated: false,
    };
  }

  const query =
    typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
  if (!query) {
    return {
      text: "Say what company policy, engineering practice, or product information to search for.",
      isError: true,
      truncated: false,
    };
  }

  const words = query.split(/\s+/).filter((word) => word.length > 2);
  const matches = DOCUMENTS.filter((document) => {
    const haystack =
      `${document.title} ${document.keywords.join(" ")} ${document.body}`.toLowerCase();
    return words.some((word) => haystack.includes(word));
  });
  const selected = matches.length > 0 ? matches : DOCUMENTS;
  const text = selected
    .map(
      (document) =>
        `## ${document.title}\n\n${document.body}\n\n[Source: ${document.title}](${document.url})`,
    )
    .join("\n\n---\n\n");

  return { text, isError: false, truncated: false };
}
