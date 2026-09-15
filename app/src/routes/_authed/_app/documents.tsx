import {
  IconBook2,
  IconCode,
  IconFileText,
  IconSearch,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export const Route = createFileRoute("/_authed/_app/documents")({
  component: DocumentsPage,
});

const DOCUMENTS = [
  {
    title: "Employee Handbook",
    category: "People & Culture",
    updated: "Updated Sep 2026",
    description: "Annual leave, workplace policies, and employee guidance.",
    icon: IconBook2,
  },
  {
    title: "Engineering Guidelines",
    category: "Engineering",
    updated: "Updated Sep 2026",
    description: "Code review, pull request, testing, and security practices.",
    icon: IconCode,
  },
  {
    title: "Plug 2.0 Product Overview",
    category: "Product",
    updated: "Updated Sep 2026",
    description: "Product direction, priorities, and workflow capabilities.",
    icon: IconFileText,
  },
] as const;

function DocumentsPage() {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const documents = DOCUMENTS.filter((document) =>
    `${document.title} ${document.category} ${document.description}`
      .toLowerCase()
      .includes(query),
  );

  return (
    <PageShell
      description="Search the approved sources available to Knowledge Agent."
      title="Company knowledge"
      width="wide"
    >
      <div className="mt-8 flex items-center gap-3">
        <InputGroup className="max-w-md bg-card">
          <InputGroupInput
            aria-label="Search documents"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents"
            value={search}
          />
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
        </InputGroup>
        <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
          Synthetic demo data
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {documents.map((document) => (
          <article
            className="rounded-2xl border bg-card p-5 shadow-sm"
            key={document.title}
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <document.icon className="size-5" />
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a742f]">
              {document.category}
            </p>
            <h2 className="mt-1 font-semibold">{document.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {document.description}
            </p>
            <p className="mt-5 text-xs text-muted-foreground">
              {document.updated}
            </p>
          </article>
        ))}
      </div>

      {documents.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No demo documents match “{search.trim()}”.
        </p>
      ) : null}
    </PageShell>
  );
}
