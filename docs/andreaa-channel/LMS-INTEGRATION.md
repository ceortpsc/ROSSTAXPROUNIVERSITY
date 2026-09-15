# RTPU Native AI LMS — Architecture and Operations Guide

## Scope

Ross Tax Pro University now uses a first-party learning runtime rather than an external classroom provider. The active production LMS is the **RTPU Native AI LMS**, coordinated by Andreaa Channel and a specialized AI university agent mesh.

Core implementation:

```text
lib/ai-university.ts
lib/lms-integration.ts
server/ai-lms-routes.ts
web/src/AiUniversityPages.tsx
```

Runtime inventory:

```bash
curl -sS https://rosstaxprouniversity.onrender.com/api/lms
curl -sS https://rosstaxprouniversity.onrender.com/api/lms/agents
curl -sS https://rosstaxprouniversity.onrender.com/api/lms/programs
```

## Learning runtime

The native LMS provides:

```text
course catalog
program pathways
AI lecture simulation
adaptive tutoring architecture
practice generation
assessment blueprints
rubrics and remediation planning
student dashboard
faculty dashboard
records routing
admissions routing
accessibility support
academic quality checks
career coaching
agent orchestration
```

The active runtime has no external LMS dependency.

## AI university agent mesh

The platform registers specialized agents for:

- academic/provost planning
- lecturing
- tutoring
- advising
- assessment design
- registrar support
- admissions intake support
- student success
- faculty copilot work
- academic quality
- university operations
- accessibility
- career/practice coaching

Agent specialization is used to separate responsibilities and prevent a single assistant from silently assuming authority across unrelated institutional functions.

## Lecture simulation

Create a lecture session:

```bash
curl -sS -X POST https://rosstaxprouniversity.onrender.com/api/lms/lecture \
  -H 'content-type: application/json' \
  -d '{"topic":"Federal tax filing status fundamentals","level":"career / tax practitioner","objectives":["define the rules","work an example","check understanding"]}'
```

The runtime produces a structured instructional flow with orientation, teaching, worked reasoning, practice, retrieval checks, transfer and recap stages. Generated instruction is explicitly labeled as AI-generated or simulated instruction.

## Learning-plan generation

```bash
curl -sS -X POST https://rosstaxprouniversity.onrender.com/api/lms/learning-plan \
  -H 'content-type: application/json' \
  -d '{"goal":"Complete Semester 1 of the Tax Practitioner Diploma","programId":"tax-practitioner-diploma"}'
```

The plan uses the Andreaa Tier-10 engineering/reasoning engine to build sequencing, checkpoints, practice, feedback loops, accessibility and student-success interventions.

## Assessment architecture

```bash
curl -sS -X POST https://rosstaxprouniversity.onrender.com/api/lms/assessment \
  -H 'content-type: application/json' \
  -d '{"topic":"Taxpayer data security and due diligence"}'
```

Assessment output is a formative blueprint. Where institutional rules require human grading, certification or academic judgment, the human/institutional authority remains controlling.

## Roles and access

The native LMS recognizes platform-admin, LMS-admin, instructor, registrar, student and auditor roles. Least privilege applies to every route and future persistence layer.

High-impact actions—including final admissions decisions, employment decisions, credential-authority determinations and other regulated outcomes—must not be delegated solely to an automated agent.

## Data and evidence principles

1. Minimize sensitive student data.
2. Keep operational APIs `no-store` by default.
3. Preserve deterministic identifiers and evidence hashes for generated sessions where applicable.
4. Label generated instruction clearly.
5. Do not represent an external credential, government status or regulated outcome as verified unless the responsible authority verified it.
6. Require human authorization for high-impact decisions.
7. Keep release and runtime evidence separate from marketing claims.

## Performance model

The AI LMS uses the same Fastify/Vite/React production runtime as the institution shell. Current performance budgets are registered in `lib/platform-evolution.ts` and production build sizes are captured in release evidence.

## Persistence boundary

The current AI lecture, assessment and learning-plan APIs are stateless generation services. Admissions already uses the separate RTPU enrollment service. Durable student-progress, gradebook, submissions and transcript persistence require an authorized production datastore before those features may be represented as persistent.

This boundary is deliberate: the platform does not claim durable records that it has not actually stored.

## Production verification

Verify the active runtime with:

```text
GET /api/health
GET /api/lms
GET /api/lms/agents
GET /api/platform/evidence
GET /api/ops/health
```

A source commit alone is not production evidence. A release is production-live only after the Render build succeeds, the service reaches `live`, startup completes and the root/API probes succeed.
