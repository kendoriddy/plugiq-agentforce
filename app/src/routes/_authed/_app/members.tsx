import { IconMailPlus, IconShieldCheck, IconUser } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { currentUserQueryOptions } from "@/lib/auth/queries";

export const Route = createFileRoute("/_authed/_app/members")({
  component: MembersPage,
});

const DEMO_MEMBERS = [
  {
    name: "Amina Bello",
    email: "amina.bello@example.demo",
    role: "Product Manager",
  },
  {
    name: "Tunde Okafor",
    email: "tunde.okafor@example.demo",
    role: "Engineer",
  },
];

function MembersPage() {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const members = [
    {
      name: currentUser?.name ?? "Kehinde Onifade",
      email: currentUser?.email ?? "kehinde@descasio.com",
      role: currentUser?.role === "admin" ? "Administrator" : "Member",
      live: true,
    },
    ...DEMO_MEMBERS.map((member) => ({ ...member, live: false })),
  ];

  return (
    <PageShell
      action={
        <Button size="sm" variant="outline" disabled>
          <IconMailPlus />
          Invite member
        </Button>
      }
      description="People with access to the Descasio AgentForce workspace. Invitations are represented for the prototype and are not sent."
      title="Members"
      width="wide"
    >
      <div className="mt-8 flex items-center justify-between rounded-2xl bg-primary px-6 py-5 text-primary-foreground">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4a853]">
            Organization
          </p>
          <h2 className="mt-1 text-xl font-semibold">Descasio</h2>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/65">
          Demo workspace
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
        {members.map((member) => (
          <div
            className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
            key={member.email}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              {member.role === "Administrator" ? (
                <IconShieldCheck className="size-5 text-[#9a742f]" />
              ) : (
                <IconUser className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.name}</p>
                {!member.live ? (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    Demo
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {member.email}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{member.role}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Need access controls?{" "}
        <Link
          className="font-medium text-foreground underline"
          to="/admin/people"
        >
          Open the live people administration page
        </Link>
        .
      </p>
    </PageShell>
  );
}
