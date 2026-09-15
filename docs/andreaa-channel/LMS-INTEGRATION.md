# Andreaa Channel LMS Integration Guide

## Scope

Andreaa Channel exposes a provider-neutral LMS integration plane with a live Google Classroom connector and source-controlled adapter contracts for Canvas, Moodle and Blackboard Learn.

The registry is implemented in:

```text
lib/lms-integration.ts
app/api/lms/integrations/route.ts
```

Runtime inventory:

```bash
curl -sS https://rosstaxprouniversity.onrender.com/api/lms/integrations
```

## Provider status semantics

- `active` - required production configuration is present and the adapter is considered runtime-ready; external authorization must still be evaluated separately where applicable.
- `configured` - tenant endpoint and required credentials/flags are present for the adapter.
- `adapter-ready` - code contract exists but required provider configuration is absent.
- `disabled` - the provider was intentionally disabled.

## Google Classroom

### Required environment

```bash
GOOGLE_CLASSROOM_CLIENT_ID=<oauth-client-id>
GOOGLE_CLASSROOM_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_CLASSROOM_REDIRECT_URI=https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/callback
```

### OAuth sequence

```text
1. Browser opens /api/integrations/google-classroom/oauth/start
2. RTPU creates signed state and redirects to Google
3. User signs into the intended Google account
4. User approves requested Classroom scopes
5. Google redirects to the RTPU callback
6. RTPU validates signed state
7. RTPU exchanges authorization code for tokens
8. RTPU verifies userProfiles/me and courses.list
9. RTPU creates sanitized consent evidence
10. RTPU creates short-lived one-time refresh-token handoff
```

Start authorization:

```text
https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/start
```

The authorization must be initiated in the same browser session used to complete consent. Do not initiate the stateful flow with `curl` and then finish in a different browser session.

### Redirect URI rule

The Google OAuth client must include this exact authorized redirect URI:

```text
https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/callback
```

A mismatch in scheme, hostname, path or trailing slash produces `redirect_uri_mismatch`.

### Requested scopes

The connector requests Classroom course, roster, coursework and profile-email access. Scope approval remains controlled by Google and the Workspace administrator/account policy.

### Horizontal-scaling caveat

The current one-time credential handoff store is process-memory based. In a multi-instance or ephemeral/serverless deployment, callback and handoff consumption can land on different instances. Before relying on horizontal scale for the OAuth handoff, move the handoff store to a durable encrypted secret store or database with TTL semantics.

## Canvas LMS

Adapter environment:

```bash
LMS_CANVAS_ENABLED=true
CANVAS_API_BASE_URL=https://tenant.instructure.com/api/v1
CANVAS_ACCESS_TOKEN=<secret>
```

Expected capabilities:

```text
courses
enrollments
assignments
submissions
grades
```

Production activation requires a tenant-issued API token or OAuth application with the permissions required for the intended actions. Tokens must not be committed to the repository.

## Moodle

Adapter environment:

```bash
LMS_MOODLE_ENABLED=true
MOODLE_API_BASE_URL=https://tenant.example.edu/webservice/rest/server.php
MOODLE_TOKEN=<secret>
```

Expected capabilities:

```text
courses
users
enrollments
assignments
grades
```

Moodle web services must be enabled by the Moodle administrator and the token must be bound to a service/function set that follows least privilege.

## Blackboard Learn

Adapter environment:

```bash
LMS_BLACKBOARD_ENABLED=true
BLACKBOARD_API_BASE_URL=https://tenant.example.edu/learn/api/public/v1
BLACKBOARD_CLIENT_ID=<client-id>
BLACKBOARD_CLIENT_SECRET=<secret>
```

Expected capabilities:

```text
courses
users
memberships
content
grades
```

The application must be registered with the Blackboard tenant and granted the minimum REST privileges required by the intended workflow.

## Course provisioning model

Andreaa uses provider-neutral metadata as the source representation:

```json
{
  "code": "ELA-1",
  "title": "English I",
  "term": "Fall 2026",
  "program": "Adult HS Diploma",
  "section": "A",
  "state": "active"
}
```

Provider-specific adapters translate that representation into the LMS provider's course schema.

Recommended Google Classroom display format:

```text
[CODE] - [COURSE TITLE] | [TERM] | [PROGRAM]
```

Example:

```text
ELA-1 - English I | Fall 2026 | Adult HS Diploma
```

## Enrollment and roster rules

1. Student identity must be resolved before enrollment mutation.
2. Duplicate enrollment operations should be idempotent.
3. Withdrawal/deletion is treated as a higher-impact mutation and should preserve an audit trail.
4. Instructor and registrar permissions are distinct.
5. Bulk roster actions require explicit scope and a preview/reconciliation step when supported.
6. Provider errors must be retained as provider errors; Andreaa must not translate a failed provider mutation into success.

## Grade synchronization

Grade writes should include:

- provider course ID
- provider assignment/coursework ID
- learner provider ID
- source grade
- normalized grade if transformation occurs
- timestamp
- initiating role
- provider response identifier where available

Grade synchronization should not be enabled until the provider adapter and authorization state have been verified end-to-end.

## Privacy and security

- Retrieve only fields needed for the workflow.
- Avoid storing provider tokens in browser storage.
- Avoid logging student records unnecessarily.
- Separate application role authorization from provider authorization.
- Apply tenant/provider restrictions in addition to local RBAC.
- Do not infer an academic outcome from incomplete LMS data.

## Integration test sequence

Development and production verification should follow:

```text
1. registry reports expected provider state
2. authentication/authorization succeeds
3. read-only profile/tenant probe succeeds
4. course-list read succeeds
5. scoped sandbox or authorized course mutation succeeds where applicable
6. roster read/reconciliation succeeds
7. coursework/grade operation succeeds where enabled
8. audit record captures non-secret evidence
```

Do not skip from configuration presence directly to "fully integrated" status.
