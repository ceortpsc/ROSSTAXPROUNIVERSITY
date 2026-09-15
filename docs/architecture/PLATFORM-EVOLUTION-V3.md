# Ross Tax Pro University — Platform Evolution v3

## Purpose

RTPU v3 is the production evolution of the online institution runtime. It standardizes release channels, route ownership, module boundaries, AI engineering assistance, evidence, design-system behavior and provider-safe integrations.

## Runtime

- Client: React + Vite + TypeScript
- Server/API: Fastify + TypeScript
- Build: Vite + tsup + TypeScript typecheck
- Deployment: GitHub source control → Render production service
- LMS provider adapter: Google Classroom
- AI engineering plane: Andreaa Channel 10-tier deterministic blueprint engine

## Release channels

RTPU supports `alpha`, `beta`, `rc`, `stable`, and `next`. Only `stable` is the production default. Promotion requires the gate defined in `config/release-channels.json`; release labels do not override provider authorization, security review, or deployment evidence.

## Product surfaces

### Public and learner-facing

- `/` — institutional home
- `/institution` — online campus
- `/programs` — program catalog
- `/programs/:program` — program detail
- `/admissions` — admissions gateway
- `/student/dashboard` — student workspace
- `/faculty/dashboard` — faculty workspace
- `/records` — records/transcript center
- `/help` — support center

### Engineering and operations

- `/ai-assist` — Andreaa engineering assist
- `/engineering` — engineering principles
- `/releases` — release-channel model
- `/evidence` — live production evidence
- `/andreaa-channel` — AI operations
- `/andreaa-channel/engine` — Tier-10 engineering engine
- `/andreaa-channel/platform` — platform control plane
- `/admin/operations` — operations center
- `/admin/integrations/google-classroom` — LMS provider control surface

## API contracts

- `GET /api/platform` — full platform snapshot
- `GET /api/platform/releases` — release channels
- `GET /api/platform/routes` — route registry
- `GET /api/platform/modules` — module registry
- `GET /api/platform/principles` — engineering principles
- `GET /api/platform/evidence` — runtime/release evidence
- `POST /api/andreaa-channel/assist` — deterministic Tier-10 architecture/execution blueprint

Existing Andreaa, operations, LMS, Classroom and OAuth APIs remain supported.

## Engineering principles

1. Evidence before assertion.
2. Fail closed for provider writes and missing authorization.
3. Least-privilege access and role separation.
4. Version API and data contracts.
5. Promote releases through deterministic gates.
6. Observe health, provider status and failures explicitly.
7. Make provider provisioning idempotent.
8. Keep deployments rollbackable.
9. Build responsive and accessible interfaces.
10. Enforce performance budgets and measure production latency.
11. Minimize collection of sensitive data.
12. Require explicit human authorization for high-impact operations.

## Design system

The institutional design system uses navy, gold, cream and silver with high-contrast CTAs, responsive card grids, consistent focus states, reduced-motion support and reusable dashboard, release, journey, evidence and workspace components. The canonical institutional mark is `web/public/rtpu-institution-mark.svg`.

## Provider truth boundary

RTPU may prepare manifests, requests and launch workflows. Google Classroom creation, OAuth authorization, roster changes and coursework writes are complete only after Google returns success evidence. RTPU must not synthesize provider success.

## Production completion rule

A source commit is not a production completion claim by itself. Production completion requires a successful Render build, a live deployment state, healthy service startup and route/API evidence where applicable.
