# Product Engineer (coding factory)

Linear ticket → Cursor cloud Product Engineer → PR → human feedback → resume → approve.

## Where it lives

| Surface                                                                                  | Role                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AgentForce chat**                                                                      | Any granted coworker can start, check, resume, or certify a run with Product Engineer tools. The home composer suggestion "Implement Linear ticket…" opens that chat. |
| **AgentForce** (`/product-engineer`)                                                     | Authenticated **dispatch UI**: start a run, poll status, submit feedback, approve. Browser talks only to `/api/product-engineer/*` with session cookies.              |
| **AgentForce server**                                                                    | Holds `CURSOR_API_KEY` / `LINEAR_API_KEY`, calls `@cursor/sdk`, persists runs in Postgres (`product_engineer_runs`).                                                  |
| **Cursor cloud**                                                                         | Does the coding work (`Agent.create` / `Agent.resume`, `autoCreatePR`).                                                                                               |
| **[`product-engineer-loop`](../product-engineer-loop)** (workspace package in this repo) | Shared library + CLI (`pe-loop`) for local debugging of the same loop.                                                                                                |

AgentForce chat can **dispatch** the coding loop. Coding still runs on Cursor cloud, not in the browser. Approve certifies the run in AgentForce; **merge stays in GitHub**.

## Prerequisites

1. Set `CURSOR_API_KEY`, `LINEAR_API_KEY`, and `PE_REPOS` on the AgentForce server (see `.env.example`). Without them, `/api/product-engineer` is unmounted.
2. Grant the Cursor GitHub App access to any **private** repos in `PE_REPOS` (Dashboard → Integrations). Branch-verification failures usually mean App access, not a wrong `PE_STARTING_REF`.
