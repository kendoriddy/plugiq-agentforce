import { IconUsers, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { agentListQueryOptions } from "@/lib/agents/queries";
import {
  addChannelAgentMutationOptions,
  createChannelMutationOptions,
  removeChannelAgentMutationOptions,
} from "@/lib/channels/mutations";
import type { AgentChannel } from "@/lib/channels/queries";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";

/**
 * Start a room: a channel the person names, with two or more coworkers.
 *
 * Sits beside the new-chat action. One coworker is still a chat, started from that other control.
 */
export function NewRoomButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const profiles = useQuery(agentListQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation(createChannelMutationOptions(queryClient));

  const toggle = (agentId: string, on: boolean) => {
    setSelected((current) =>
      on ? [...current, agentId] : current.filter((id) => id !== agentId),
    );
  };

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setName("");
      setSelected([]);
      setError(null);
    }
  };

  return (
    <>
      <Button
        aria-label="New room"
        className="size-7 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <IconUsers />
      </Button>
      <Dialog onOpenChange={close} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New room</DialogTitle>
            <DialogDescription>
              Name the room and choose the coworkers who will share it. Address
              one with @, or leave a message untagged and it goes to whoever it
              is for.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              if (!trimmed) {
                setError("Give the room a name.");
                return;
              }
              if (selected.length < 2) {
                setError("A room needs at least two coworkers.");
                return;
              }
              setError(null);
              void create
                .mutateAsync({ agentIds: selected, name: trimmed })
                .then((channel) => {
                  close(false);
                  return navigate({
                    params: { channelId: channel.id },
                    to: "/channel/$channelId",
                  });
                })
                .catch((caught: unknown) => {
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : "Could not start this room.",
                  );
                });
            }}
          >
            <DialogBody>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" id="room-name-label">
                  Name
                </span>
                <Input
                  aria-labelledby="room-name-label"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Launch review"
                  value={name}
                />
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-medium">Coworkers</legend>
                {profiles.data?.map((profile) => (
                  <div className="flex items-center gap-2" key={profile.id}>
                    <Checkbox
                      aria-label={profile.name}
                      checked={selected.includes(profile.id)}
                      onCheckedChange={(checked) =>
                        toggle(profile.id, checked === true)
                      }
                    />
                    <span>{profile.name}</span>
                  </div>
                ))}
                {profiles.data?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No coworkers are available.
                  </p>
                ) : null}
              </fieldset>
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
            </DialogBody>
            <DialogFooter className="pt-2">
              <Button disabled={create.isPending} type="submit">
                Create room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Everyone in this channel, and the controls to add or remove one.
 *
 * The focused member is who the screen and the profile pane follow. Removing
 * the last coworker is refused here as well as on the server.
 */
export function ChannelMembers({
  channel,
  focusedId,
  onFocus,
}: {
  channel: AgentChannel;
  focusedId: string | undefined;
  onFocus: (agentId: string) => void;
}) {
  const profiles = useQuery(agentListQueryOptions());
  const queryClient = useQueryClient();
  const add = useMutation(addChannelAgentMutationOptions(queryClient));
  const remove = useMutation(removeChannelAgentMutationOptions(queryClient));
  const nameOf = (agentId: string) =>
    profiles.data?.find((profile) => profile.id === agentId)?.name ?? agentId;
  const available =
    profiles.data?.filter(
      (profile) => !channel.agentIds.includes(profile.id),
    ) ?? [];
  const failed = add.error ?? remove.error;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {channel.agentIds.map((agentId) => (
        <span
          className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs ${
            agentId === focusedId
              ? "border-foreground/30 bg-foreground/5"
              : "border-border"
          }`}
          key={agentId}
        >
          <button
            className="px-1"
            onClick={() => onFocus(agentId)}
            type="button"
          >
            {nameOf(agentId)}
          </button>
          {channel.agentIds.length > 1 ? (
            <button
              aria-label={`Remove ${nameOf(agentId)}`}
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ agentId, channelId: channel.id })}
              type="button"
            >
              <IconX className="size-3" />
            </button>
          ) : null}
        </span>
      ))}
      {available.length > 0 ? (
        <select
          aria-label="Add a coworker"
          className="h-7 shrink-0 rounded-md border border-border bg-transparent px-1.5 text-xs"
          disabled={add.isPending}
          onChange={(event) => {
            const agentId = event.target.value;
            if (!agentId) return;
            add.mutate({ agentId, channelId: channel.id });
            event.target.value = "";
          }}
          value=""
        >
          <option value="">Add</option>
          {available.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      ) : null}
      {failed ? (
        <span className="shrink-0 text-destructive text-xs" role="alert">
          {failed.message}
        </span>
      ) : null}
    </div>
  );
}
