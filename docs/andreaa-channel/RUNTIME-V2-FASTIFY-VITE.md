# Andreaa Channel Runtime v2 — Fastify + Vite

## Decision

ROSSTAXPROUNIVERSITY runtime v2 removes Next.js from the active production dependency graph and replaces it with:

- **Fastify** — HTTP server, API routing, operational controls, OAuth callbacks and static delivery
- **Vite** — React client build pipeline
- **React** — client rendering
- **tsup** — production server bundling
- **TypeScript** — static type checking

The migration preserves the public application and API paths required by Andreaa Channel, Operations and Google Classroom.

## Why this architecture

The upgrade is intended to make the runtime more explicit and less framework-coupled:

1. the server lifecycle is directly controlled by the application
2. API routes are ordinary Fastify routes rather than file-system framework handlers
3. the client and server build products are independently inspectable
4. Render, Docker and ordinary Node servers share the same production entrypoint
5. OAuth callback behavior remains on the existing production URL
6. security middleware, compression and cache policy are applied centrally
7. OpenAPI contracts map directly to explicit HTTP handlers

This is an architectural migration, not a claim that every Fastify/Vite workload is universally faster than every Next.js workload. Performance claims require measurement.

## Runtime topology

```text
Browser
  |
  +--> React SPA (Vite build)
  |
  +--> Fastify
          |
          +--> Andreaa engine
          +--> capability registry
          +--> LMS integration plane
          +--> Google Classroom OAuth/API
          +--> operations APIs
          +--> health/security controls
```

## Compatibility routes

Client routes preserved:

```text
/
/signin
/signin/student
/signin/teacher
/student
/teacher
/access-pending
/credentials
/degree-authority
/andreaa-channel
/andreaa-channel/engine
/andreaa-channel/platform
/admin/operations
/admin/integrations/google-classroom
```

API routes preserved or advanced:

```text
GET  /api/health
GET  /api/andreaa-channel/engine
POST /api/andreaa-channel/engine
GET  /api/andreaa-channel/capabilities
GET  /api/lms/integrations
GET  /api/integrations/google-classroom
GET  /api/integrations/google-classroom/courses
POST /api/integrations/google-classroom/courses
GET  /api/integrations/google-classroom/courses/:courseId/students
POST /api/integrations/google-classroom/courses/:courseId/students
GET  /api/integrations/google-classroom/courses/:courseId/teachers
POST /api/integrations/google-classroom/courses/:courseId/teachers
GET  /api/integrations/google-classroom/courses/:courseId/coursework
POST /api/integrations/google-classroom/courses/:courseId/coursework
GET  /api/integrations/google-classroom/oauth/start
GET  /api/integrations/google-classroom/oauth/callback
POST /api/integrations/google-classroom/oauth/handoff
GET  /api/ops/overview
GET  /api/ops/health
GET  /api/ops/security
GET  /api/ops/optimization
GET  /api/ops/quotas
GET  /api/ops/topology
GET  /api/ops/support
GET  /api/ops/maintenance
POST /api/ops/maintenance
```

## Security controls

Fastify runtime v2 centralizes:

- Helmet security headers
- production HSTS
- content security policy
- referrer policy
- response compression
- API no-store cache policy
- request log secret redaction
- timing-safe admin-key comparisons
- body-size limits
- provider credential isolation

## Build pipeline

```bash
npm install
npm run typecheck
npm run build
```

Build products:

```text
web/dist/           # browser application

dist-server/        # bundled Fastify server
```

Production start:

```bash
npm start
```

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

This runs:

```text
Fastify API: http://localhost:8787
Vite client: http://localhost:5173
```

Vite proxies `/api` to the local Fastify process.

## Render

The existing Render command contract can remain:

```text
Build: npm install && npm run build
Start: npm start
```

The package scripts now point those commands to Vite + tsup + Fastify rather than Next.js.

## Docker

```bash
docker build -t rtpu-andreaa:v2 .
docker run --rm -p 10000:10000 --env-file .env rtpu-andreaa:v2
```

## Rollback

The pre-migration Next.js commit remains available in Git history. A rollback should be implemented using a source-control revert or a known-good commit deployment rather than a force rewrite of `main`.

## Known provider boundary

Google Classroom OAuth depends on the exact callback URL already registered with Google:

```text
https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/callback
```

The runtime migration intentionally preserves this URL to avoid an unnecessary OAuth contract change.

## Definition of completion

The migration is not considered production complete until all of the following are observed:

```text
package has no Next.js runtime dependency
TypeScript passes
Vite client build passes
Fastify server bundle passes
parallel runtime service starts
/api/health succeeds on runtime v2
Andreaa engine endpoint succeeds
LMS registry endpoint succeeds
production service deploy reaches LIVE after cutover
post-cutover runtime checks succeed
```
