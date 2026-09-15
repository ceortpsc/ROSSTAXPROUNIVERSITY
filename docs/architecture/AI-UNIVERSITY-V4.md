# Ross Tax Pro University — AI University Runtime v4

## Executive architecture

RTPU v4 replaces the active external classroom/LMS dependency with a first-party **RTPU Native AI LMS**. The university remains 100% online and uses Andreaa Channel as its reasoning, planning and engineering control plane.

## Runtime stack

- Fastify API runtime
- Vite + React client
- TypeScript contracts and typecheck gate
- tsup server bundle
- Andreaa Channel 10-tier reasoning and blueprint engine
- RTPU Native AI LMS
- Separate RTPU enrollment/admissions service
- Render production deployment from GitHub `main`

## AI university agent mesh

The active agent registry includes:

1. AI Provost
2. AI Lecturer
3. AI Tutor
4. AI Academic Advisor
5. AI Assessment Designer
6. AI Registrar Assistant
7. AI Admissions Assistant
8. AI Student Success Coach
9. AI Faculty Copilot
10. AI Academic Quality Agent
11. AI University Operations Agent
12. AI Accessibility Agent
13. AI Career & Practice Coach

These are specialized workflow/reasoning roles. They do not independently acquire legal, governmental, accreditation, licensing or employment authority.

## Active learning routes

```text
/ai-campus
/ai-lecture
/ai-assessment
/ai-agents
/student/dashboard
/faculty/dashboard
/programs
/records
/help
```

## Native AI LMS APIs

```text
GET  /api/lms
GET  /api/lms/agents
GET  /api/lms/programs
POST /api/lms/lecture
POST /api/lms/learning-plan
POST /api/lms/assessment
```

The formal API contract is `openapi/ai-lms.openapi.yaml`.

## Lecture engine

The lecture engine creates a structured instructional simulation with:

- orientation and prior-knowledge activation
- concise concept blocks
- worked reasoning example
- active practice
- graduated hints
- retrieval/misconception checks
- transfer/application activity
- recap and next-step plan

Lecture responses include an evidence hash and the Andreaa engineering blueprint used to structure the session.

## Assessment engine

The assessment service generates formative assessment architecture with learning targets, evidence requirements, item types, rubric dimensions, feedback, retry/remediation logic, accessibility and integrity safeguards.

Final grades, credentials and other institutionally authoritative outcomes remain governed by approved institutional policy and authorized human review where required.

## Student and faculty experiences

The student workspace routes learners into program plans, AI lectures, records and student services. The faculty workspace routes instructors into the AI LMS, assessment studio, curriculum map, quality standards and agent directory.

## Governance

The platform applies:

- evidence before assertion
- explicit labeling of generated/simulated instruction
- least privilege
- human approval for high-impact decisions
- no automated admissions or employment decisions
- data minimization
- accessible responsive interfaces
- versioned contracts
- deterministic release gates
- production health evidence
- rollbackable deployments

## Persistence boundary

The AI lecture, learning-plan and assessment services are currently stateless generation APIs. Admissions/application persistence is provided by the separate RTPU enrollment service.

Durable course progress, submissions, gradebook and transcript storage must not be represented as persistent until a production datastore is explicitly provisioned and verified. This is a release boundary, not a simulated capability.

## Production completion

A v4 release is complete only when:

1. TypeScript typecheck passes.
2. Vite client build passes.
3. tsup server build passes.
4. Render deploy status becomes `live`.
5. Server startup succeeds.
6. Root health probe succeeds.
7. `/api/health` and `/api/lms` return successful runtime evidence.

