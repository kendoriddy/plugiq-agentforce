/**
 * Which coworker in a room should take this turn.
 *
 * A mention that names a member is the whole decision. Without one, the intent router chooses
 * among those members, and anything it cannot decide — including being unreachable — lands on
 * the first member. A channel of one never asks: that coworker is the channel.
 */
export async function roomTurnAgent(input: {
  members: readonly string[];
  mentioned: string | undefined;
  text: string;
  route: (
    text: string,
    candidates: readonly string[],
  ) => Promise<{ agentId: string }>;
}): Promise<string> {
  const first = input.members[0];
  if (!first) throw new Error("A room has no coworkers.");
  if (input.members.length === 1) return first;
  if (input.mentioned && input.members.includes(input.mentioned)) {
    return input.mentioned;
  }
  const text = input.text.trim();
  if (!text) return first;
  try {
    const decision = await input.route(text, input.members);
    if (input.members.includes(decision.agentId)) return decision.agentId;
  } catch {
    // Unsure, or the router is down: the first member still answers.
  }
  return first;
}
