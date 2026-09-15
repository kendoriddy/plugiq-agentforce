import {
  IconBrandGoogle,
  IconBrandOpenai,
  IconCpu,
  IconSparkles,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { credentialListQueryOptions } from "@/lib/credentials/queries";

export const Route = createFileRoute("/_authed/_app/models")({
  component: ModelsPage,
});

const PROVIDERS = [
  {
    name: "OpenAI",
    aliases: ["openai"],
    description: "GPT models",
    icon: IconBrandOpenai,
  },
  {
    name: "Anthropic",
    aliases: ["anthropic", "claude"],
    description: "Claude models",
    icon: IconSparkles,
  },
  {
    name: "Google",
    aliases: ["google", "gemini"],
    description: "Gemini models",
    icon: IconBrandGoogle,
  },
  {
    name: "xAI",
    aliases: ["xai", "grok"],
    description: "Grok models",
    icon: IconCpu,
  },
  {
    name: "DeepSeek",
    aliases: ["deepseek"],
    description: "DeepSeek models",
    icon: IconCpu,
  },
] as const;

function ModelsPage() {
  const credentials = useQuery(credentialListQueryOptions());

  return (
    <PageShell
      action={
        <Button
          size="sm"
          render={(props) => <Link {...props} to="/admin/credentials" />}
        >
          Add API key
        </Button>
      }
      description="Configure the models available to your organization. Secret values are encrypted and never displayed again."
      title="AI Models"
      width="wide"
    >
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const configured = credentials.data?.some(
            (credential) =>
              credential.kind === "model" &&
              !credential.revokedAt &&
              provider.aliases.some((alias) =>
                credential.provider.toLowerCase().includes(alias),
              ),
          );
          return (
            <article
              className="flex items-center gap-4 rounded-2xl border bg-card p-5"
              key={provider.name}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <provider.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{provider.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </div>
              <span
                className={
                  configured
                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                    : "rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                }
              >
                {configured ? "Configured" : "Add key"}
              </span>
            </article>
          );
        })}
      </div>
      {credentials.isError ? (
        <p className="mt-5 text-sm text-destructive">
          Credential status could not be loaded.
        </p>
      ) : null}
    </PageShell>
  );
}
