import { describe, expect, test } from "bun:test";
import type { RunAgentInput } from "@ag-ui/client";
import {
  GENERAL_ASSISTANT_LEARNING_CONTAINER_ID,
  learningContainerIdForRun,
} from "../src/learning-container";
import { createIntelligenceClient } from "../src/intelligence-client";

const input = {
  threadId: "11111111-1111-4111-8111-111111111111",
  runId: "22222222-2222-4222-8222-222222222222",
  messages: [],
} as unknown as RunAgentInput;

const user = { id: "person-1", name: "Ada" };

describe("Learning container assignment", () => {
  test("assigns General Assistant threads to the stable container", () => {
    expect(
      learningContainerIdForRun({
        surface: "web",
        user,
        agentId: "general-assistant",
        input,
      }),
    ).toBe(GENERAL_ASSISTANT_LEARNING_CONTAINER_ID);
  });

  test("leaves every other Bot unassigned", () => {
    for (const agentId of ["knowledge", "developer", "picked-harness"]) {
      expect(
        learningContainerIdForRun({
          surface: "web",
          user,
          agentId,
          input,
        }),
      ).toBeUndefined();
    }
  });

  test("the Intelligence client used beside the runtime holds the same selector", () => {
    const client = createIntelligenceClient({
      apiUrl: "http://localhost:7100",
      gatewayWsUrl: "ws://localhost:7103",
      apiKey: "test-key",
    });

    expect(client.ɵgetLearningContainerId()).toBe(learningContainerIdForRun);
  });
});
