# RTPU Engineering Principles

1. **Evidence before assertion.** A component is called live, healthy, authorized, or verified only when a measurable check supports that statement.
2. **Fail closed.** Missing credentials, invalid OAuth state, failed authorization, or unsupported maintenance actions deny access rather than silently continuing.
3. **Least privilege.** Request only the Google scopes and application permissions required for the current workflow; expand scopes through reviewed changes.
4. **Secrets stay out of source.** OAuth client secrets, refresh tokens, operations keys, and similar credentials live in deployment secret stores, never in Git-tracked files or evidence artifacts.
5. **Deterministic release gates.** Source validation, TypeScript production build, route compilation, deployment status, and live smoke checks are distinct gates with explicit PASS/PENDING/BLOCKED outcomes.
6. **Observable production.** Health, security, topology, optimization, quota, maintenance, and support surfaces expose non-secret operational evidence.
7. **Idempotent automation.** Provisioning and synchronization routines should be safe to retry and must use stable external IDs to prevent duplicate courses, users, enrollments, or assignments.
8. **Human authorization for external authority.** Google consent, Workspace administrator approval, billing changes, IAM ownership changes, and destructive infrastructure operations require the appropriate authorized human action.
9. **No inferred success.** Redirect generation is not token authorization; token authorization is not Classroom provisioning; course creation is not roster synchronization. Each lifecycle stage is validated independently.
10. **Rollbackability.** Production changes should be traceable to a commit/deploy pair and reversible without destroying records.
11. **Data minimization.** Student and staff integrations store only data needed for instructional and operational purposes, with stronger controls for student records.
12. **Test the negative path.** Invalid OAuth state, missing credentials, unsupported actions, authorization failures, and malformed inputs receive explicit tests alongside happy paths.
13. **Performance follows measurement.** Instance size, caching, worker concurrency, and background processing are changed based on measured utilization and latency rather than assumption.
14. **Versioned contracts.** API routes, provisioning manifests, integration schemas, and evidence formats should evolve through source-controlled versions.
15. **Production evidence is immutable history.** Evidence files record what was verified at a point in time; later changes create new evidence rather than rewriting history to imply past success.
