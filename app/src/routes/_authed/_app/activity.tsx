import {
  IconActivity,
  IconBook2,
  IconBrandGithub,
  IconRefresh,
  IconRoute,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { auditEventsQueryOptions } from "@/lib/audit/queries";

export const Route = createFileRoute("/_authed/_app/activity")({
  component: ActivityPage,
});

type ActivityEvent = {
  id: string;
  eventType: string;
  targetId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

function labelFor(event: ActivityEvent) {
  const tool = String(event.targetId ?? event.payload.tool ?? "").toLowerCase();
  if (tool.includes("github")) return "Read data from GitHub";
  if (tool.includes("search_notes") || tool.includes("document"))
    return "Searched company knowledge";
  if (event.eventType === "channel.routed")
    return "Routed a task to the right agent";
  if (event.eventType.includes("mcp")) return "Used a connected tool";
  if (event.eventType.includes("credential")) return "Updated a credential";
  return event.eventType.replaceAll(".", " ");
}

function iconFor(event: ActivityEvent) {
  const subject = `${event.targetId ?? ""} ${event.eventType}`.toLowerCase();
  if (subject.includes("github")) return IconBrandGithub;
  if (subject.includes("document") || subject.includes("search_notes"))
    return IconBook2;
  if (subject.includes("routed")) return IconRoute;
  return IconActivity;
}

function ActivityPage() {
  const events = useQuery(auditEventsQueryOptions());
  const rows = ((events.data?.events ?? []) as ActivityEvent[]).slice(0, 20);

  return (
    <PageShell
      action={
        <Button
          disabled={events.isFetching}
          onClick={() => events.refetch()}
          size="sm"
          variant="outline"
        >
          <IconRefresh className={events.isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      }
      description="A human-readable view of what AgentForce agents and connected tools have done."
      title="Activity"
      width="wide"
    >
      <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
        {events.isPending ? (
          <p className="p-5 text-sm text-muted-foreground">Loading activity…</p>
        ) : events.isError ? (
          <p className="p-5 text-sm text-destructive">
            Activity could not be loaded.
          </p>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <IconActivity className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">No activity yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Agent and tool activity will appear after the first conversation.
            </p>
          </div>
        ) : (
          rows.map((event) => {
            const Mark = iconFor(event);
            const bot =
              typeof event.payload.bot === "string"
                ? event.payload.bot
                : "AgentForce";
            return (
              <div
                className="flex items-start gap-4 border-b px-5 py-4 last:border-b-0"
                key={event.id}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Mark className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{labelFor(event)}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {bot.replaceAll("-", " ")}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        This summary is backed by OpenBot's audit trail.{" "}
        <Link
          className="font-medium text-foreground underline"
          to="/admin/audit"
        >
          View governance detail
        </Link>
        .
      </p>
    </PageShell>
  );
}
