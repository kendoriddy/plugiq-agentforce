/** Seed rows matching the former demo knowledge texts. */
export const SEED_KNOWLEDGE_DOCUMENTS = [
  {
    title: "Employee Handbook — Annual Leave",
    category: "People & Culture",
    body: "Full-time employees receive 20 working days of annual leave each calendar year. Leave should be requested at least five working days in advance and approved by the employee's manager. Up to five unused days may be carried into the next calendar year and must be used by March 31.",
    createdBy: "agentforce-demo@local",
  },
  {
    title: "Engineering Guidelines",
    category: "Engineering",
    body: "All production changes require one peer review. Pull requests must explain customer impact, include test evidence, and link the relevant issue. Security-sensitive changes require a second reviewer from the platform team.",
    createdBy: "agentforce-demo@local",
  },
  {
    title: "Product Overview — Plug 2.0",
    category: "Product",
    body: "Plug 2.0 is Descasio's workflow automation platform for digitizing approvals, requisitions, and operational processes. Current priorities are the Process Builder experience, reusable workflow templates, and clearer audit history.",
    createdBy: "agentforce-demo@local",
  },
] as const;
