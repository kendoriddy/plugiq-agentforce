import {
  IconActivity,
  IconBolt,
  IconFileText,
  IconHome,
  IconLogout,
  IconPlugConnected,
  IconPlus,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  type LinkOptions,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type * as React from "react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { signOutMutationOptions } from "@/lib/auth/mutations";
import { currentUserQueryOptions } from "@/lib/auth/queries";
import {
  type ChannelSummary,
  channelListQueryOptions,
} from "@/lib/channels/queries";
import { useChannelEvents } from "@/lib/channels/use-channel-events";
import { EASE_OUT, ENTRANCE_SECONDS } from "@/lib/motion";
import { relativeTime } from "@/lib/relative-time";
import { Button } from "../ui/button";
import { Channel } from "./channel";

const appLinkOptions = { to: "/" } satisfies LinkOptions;
const adminLinkOptions = { to: "/admin" } satisfies LinkOptions;
const settingsLinkOptions = { to: "/settings" } satisfies LinkOptions;

const userMenuItemClassName = "gap-2 px-2 py-1.5";

function UserAvatar() {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const initials =
    currentUser?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? currentUser?.email.slice(0, 2).toUpperCase();

  return (
    <div className="size-[28px] bg-muted-foreground/10 text-foreground/70 rounded-full flex items-center justify-center text-xs overflow-hidden">
      {initials}
    </div>
  );
}

/**
 * Cap layout animation because `layout` measures every animated row on each reorder.
 */
const MAX_ANIMATED_ROWS = 60;

/**
 * The roster, narrowed to what the person typed.
 *
 * Matches the channel's name, its summary, and the last message, because those are the things the
 * row can actually show — searching against something invisible returns results a person cannot
 * account for. The last message is included because it is still what the second line draws until the
 * conversation has been named. Message history beyond that line is not here to search: it lives in
 * the thread store, and reaching for it is a server endpoint rather than a filter.
 *
 * An empty query returns the input array unchanged rather than a copy, so typing and clearing does
 * not hand `AnimatePresence` a new array identity and restage the whole list.
 */
export function matchingChannels(
  channels: ChannelSummary[] | undefined,
  query: string,
): ChannelSummary[] {
  if (!channels) {
    return [];
  }
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return channels;
  }
  return channels.filter((channel) =>
    [channel.name, channel.summary, channel.lastMessage].some((field) =>
      field?.toLowerCase().includes(needle),
    ),
  );
}

/**
 * Pinned channels first, everything else after, newest activity first within each group.
 *
 * The mirror of a server rule, not the rule itself: the roster query orders pinned-first and its
 * cursor carries the pin, so a pinned channel arrives on page one however long ago it was last
 * spoken in. Sorting here as well is for what happens between refetches — the socket patches a pin
 * onto a loaded row without moving it, and re-sorts a page by recency alone — which is the same
 * reason `byRecency` in use-channel-events.ts mirrors the recency rule. A stable partition, so the
 * recency order inside each group is whatever arrived.
 */
export function pinnedFirst(channels: ChannelSummary[]): ChannelSummary[] {
  return [...channels].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

/**
 * Whether a Bot has said something this member has not had on screen yet.
 *
 * A Bot's message, and only a Bot's: your own message carries a null agent id and reading your own
 * words needs no marker. ISO-8601 strings compare correctly as strings, which is the same bet the
 * server's recency sort already makes.
 */
export function hasUnseenActivity(channel: ChannelSummary): boolean {
  if (channel.lastMessageAgentId === null || channel.lastMessageAt === null) {
    return false;
  }
  return (
    channel.lastReadAt === null || channel.lastMessageAt > channel.lastReadAt
  );
}

/** Unseen activity somewhere you are not looking. The open channel never shows the dot. */
export function isUnread(
  channel: ChannelSummary,
  openChannelId: string | undefined,
): boolean {
  return channel.id !== openChannelId && hasUnseenActivity(channel);
}

/**
 * A roster row that can animate.
 *
 * Two movements only: a channel that did not exist fades in, and a channel that was just spoken in
 * moves to the top. Nothing else animates, a roster that reacts to being read is a roster that
 * moves under the cursor.
 */
function ChannelRow({
  channel,
  animateOrder,
}: {
  channel: ChannelSummary;
  animateOrder: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  // Whether this row is unread, as a boolean, for the same reason `Channel` computes `isOpen`
  // that way: navigating re-renders the rows whose answer changed, not the whole roster.
  const unread = useParams({
    strict: false,
    select: (params) =>
      isUnread(channel, (params as { channelId?: string }).channelId),
  });
  return (
    <motion.div
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      initial={{
        opacity: 0,
        transform: shouldReduceMotion ? "none" : "translateY(-8px)",
      }}
      exit={{ opacity: 0 }}
      layout={animateOrder && !shouldReduceMotion ? "position" : false}
      transition={{ duration: ENTRANCE_SECONDS, ease: EASE_OUT }}
    >
      <Channel
        channelId={channel.id}
        participantIds={channel.agentIds}
        name={channel.name}
        summary={channel.summary ?? undefined}
        lastMessage={channel.lastMessage ?? undefined}
        lastMessageAt={
          channel.lastMessageAt
            ? relativeTime(channel.lastMessageAt)
            : undefined
        }
        pinned={channel.pinned}
        unread={unread}
        busy={channel.busy ?? false}
      />
    </motion.div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: currentUser } = useQuery(currentUserQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = useMutation(signOutMutationOptions(queryClient));
  const channels = useInfiniteQuery(channelListQueryOptions());
  // One socket for the app, opened where the roster is kept live.
  useChannelEvents();
  const [search, setSearch] = useState("");
  const searching = search.trim().length > 0;
  const visibleChannels = pinnedFirst(matchingChannels(channels.data, search));
  /*
   * FILTERING DOES NOT ANIMATE. Rows exit and relayout on every keystroke otherwise, which is a
   * list thrashing under somebody who is still typing — and the moving target is the very thing
   * they are trying to read. Order animation is for a channel that was just spoken in, which is
   * occasional; this is not.
   */
  const animateOrder =
    !searching && (channels.data?.length ?? 0) <= MAX_ANIMATED_ROWS;

  const handleSignOut = async () => {
    await signOut.mutateAsync();
    await navigate({ to: "/sign" });
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border border-b px-4 py-4">
        <Link {...appLinkOptions} className="flex items-center gap-3">
          <img
            alt="Descasio"
            className="h-7 w-auto object-contain"
            src="/descasio-logo.png"
          />
          <div className="border-sidebar-border border-l pl-3 leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              PlugiQ
            </div>
            <div className="text-sm font-semibold text-sidebar-foreground">
              AgentForce
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="scroll-fade-b">
        <SidebarGroup className="px-2 pt-3">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            AgentForce
          </div>
          <SidebarMenu className="gap-1">
            {(
              [
                { to: "/", label: "Home", icon: IconHome },
                { to: "/agents", label: "Agents", icon: IconRobot },
                { to: "/documents", label: "Documents", icon: IconFileText },
                {
                  to: "/integrations",
                  label: "Integrations",
                  icon: IconPlugConnected,
                },
              ] as const
            ).map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  className="h-9 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  render={(props) => (
                    <Link
                      {...props}
                      activeProps={{
                        className:
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      }}
                      to={item.to}
                    />
                  )}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-2 pt-2">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Administration
          </div>
          <SidebarMenu className="gap-1">
            {(
              [
                { to: "/models", label: "AI Models", icon: IconBolt },
                { to: "/members", label: "Members", icon: IconUsers },
                { to: "/activity", label: "Activity", icon: IconActivity },
              ] as const
            ).map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  className="h-9 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  render={(props) => (
                    <Link
                      {...props}
                      activeProps={{
                        className:
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      }}
                      to={item.to}
                    />
                  )}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-2 gap-px border-sidebar-border border-t px-2 pt-4">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
              Recent work
            </span>
            <Button
              className="size-7 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              size="icon"
              variant="ghost"
              render={(props) => <Link {...props} to="/channel/new" />}
            >
              <IconPlus />
            </Button>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <InputGroup className="h-9 rounded-lg border-sidebar-border bg-sidebar-accent text-sm text-sidebar-foreground">
                <InputGroupInput
                  aria-label="Search channels"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  value={search}
                />
                <InputGroupAddon>
                  <IconSearch />
                </InputGroupAddon>
              </InputGroup>
            </SidebarMenuItem>
            <div className="w-full h-2" />
            {searching && visibleChannels.length === 0 ? (
              <p className="px-2 py-3 text-xs text-sidebar-foreground/45">
                No conversation matches “{search.trim()}”.
              </p>
            ) : null}
            {!searching && channels.data?.length === 0 ? (
              <p className="px-2 py-3 text-xs text-sidebar-foreground/45">
                Your conversations will appear here.
              </p>
            ) : null}
            <AnimatePresence initial={false}>
              {visibleChannels.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  animateOrder={animateOrder}
                  channel={channel}
                />
              ))}
            </AnimatePresence>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-2">
        <SidebarMenu className="gap-px">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
                }
              >
                <UserAvatar />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {currentUser?.name || currentUser?.email}
                  </span>
                  <span className="block text-[11px] capitalize text-sidebar-foreground/50">
                    {currentUser?.role ?? "Administrator"}
                  </span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="p-1.5"
                side="top"
                sideOffset={8}
              >
                {/* Admin routes are server-guarded; hide the entry for users who cannot open them. */}
                {currentUser?.role === "admin" ? (
                  <DropdownMenuItem
                    className={userMenuItemClassName}
                    render={<Link {...adminLinkOptions} />}
                  >
                    <IconShieldLock />
                    Admin
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className={userMenuItemClassName}
                  render={<Link {...settingsLinkOptions} />}
                >
                  <IconSettings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={userMenuItemClassName}
                  disabled={signOut.isPending}
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  <IconLogout />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
