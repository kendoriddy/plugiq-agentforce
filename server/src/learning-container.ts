import type { GetLearningContainerId } from "@copilotkit/runtime/v2";

/**
 * The Learning container that receives General Assistant threads.
 *
 * Stable and lowercase because Intelligence assigns a Thread on first run and never moves it.
 * Matches the existing `general-assistant` agent id so the mapping cannot drift.
 */
export const GENERAL_ASSISTANT_LEARNING_CONTAINER_ID = "general-assistant";

/**
 * Which Learning container a run belongs in, if any.
 *
 * Only the everyday assistant is assigned. Other Bots stay unassigned so their work is not mixed
 * into the same evidence set.
 */
export const learningContainerIdForRun: GetLearningContainerId = ({
  agentId,
}) =>
  agentId === "general-assistant"
    ? GENERAL_ASSISTANT_LEARNING_CONTAINER_ID
    : undefined;
