import {
  IconBook2,
  IconBrandGithub,
  IconBrandNotion,
  IconBrandWindows,
  IconBuildingStore,
  IconCheck,
  IconWorld,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  connectionsQueryOptions,
  pluginsPageQueryOptions,
} from "@/lib/plugins/queries";

export const Route = createFileRoute("/_authed/_app/integrations")({
  component: IntegrationsPage,
});

const INTEGRATIONS = [
  {
    id: "github",
    name: "GitHub",
    description: "Repositories, issues, and pull requests.",
    status: "Not connected",
    tone: "soon",
    icon: IconBrandGithub,
  },
  {
    id: "knowledge",
    name: "AgentForce Knowledge",
    description: "Approved synthetic company documents for this demo.",
    status: "Connected",
    tone: "connected",
    icon: IconBook2,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Projects, issues, cycles, and engineering priorities.",
    status: "Demo",
    tone: "demo",
    icon: IconBuildingStore,
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Search messages and collaborate with your team.",
    status: "Coming soon",
    tone: "soon",
    icon: IconBrandWindows,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Search pages and team knowledge.",
    status: "Available",
    tone: "available",
    icon: IconBrandNotion,
  },
  {
    id: "web",
    name: "Web",
    description: "Research current information on the internet.",
    status: "Available",
    tone: "available",
    icon: IconWorld,
  },
] as const;

const STATUS_STYLES = {
  connected: "bg-emerald-50 text-emerald-700",
  demo: "bg-amber-50 text-amber-700",
  soon: "bg-muted text-muted-foreground",
  available: "bg-blue-50 text-blue-700",
};

function IntegrationsPage() {
  const plugins = useQuery(pluginsPageQueryOptions());
  const connections = useQuery(connectionsQueryOptions());
  const githubServer = plugins.data?.servers.find((server) =>
    server.id.toLowerCase().includes("github"),
  );
  const githubConnected =
    githubServer !== undefined &&
    connections.data?.connections.some(
      (connection) =>
        connection.serverId === githubServer.id &&
        connection.verified !== false,
    );
  const knowledgeConnected = plugins.data?.servers.some(
    (server) => server.id === "agentforce-knowledge",
  );
  const integrations = INTEGRATIONS.map((integration) => {
    if (integration.id === "github") {
      return {
        ...integration,
        status: githubConnected ? "Connected" : "Connect for demo",
        tone: githubConnected ? "connected" : "demo",
      } as const;
    }
    if (integration.id === "knowledge") {
      return {
        ...integration,
        status: knowledgeConnected ? "Connected" : "Starting",
        tone: knowledgeConnected ? "connected" : "demo",
      } as const;
    }
    return integration;
  });

  return (
    <PageShell
      action={
        <Button
          size="sm"
          variant="outline"
          render={(props) => <Link {...props} to="/admin/plugins" />}
        >
          Manage connections
        </Button>
      }
      description="Connect AgentForce to the tools your team already uses. Status labels distinguish working integrations from the demo roadmap."
      title="Integrations"
      width="wide"
    >
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <article
            className="flex items-start gap-4 rounded-2xl border bg-card p-5"
            key={integration.name}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
              <integration.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{integration.name}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[integration.tone]}`}
                >
                  {integration.tone === "connected" ? (
                    <IconCheck className="mr-1 inline size-3" />
                  ) : null}
                  {integration.status}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {integration.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border bg-card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a742f]">
          Developer Agent
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-lg font-semibold">Tool permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agents only receive the tools required for their role.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            render={(props) => <Link {...props} to="/admin/plugins" />}
          >
            Review grants
          </Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Read GitHub issues", true],
            ["Read pull requests", true],
            ["Create or close issues", false],
            ["Merge pull requests", false],
          ].map(([label, enabled]) => (
            <div
              className="flex items-center justify-between rounded-xl border px-4 py-3"
              key={String(label)}
            >
              <span className="text-sm">{label}</span>
              <span
                className={
                  enabled
                    ? "text-xs font-semibold text-emerald-700"
                    : "text-xs font-medium text-muted-foreground"
                }
              >
                {enabled ? "Granted" : "Not granted"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
