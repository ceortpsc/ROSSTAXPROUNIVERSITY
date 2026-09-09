# RTPU Teacher & Student Access Gates

## Production rule
The gate selected by a user is only navigation. It never grants a role. The identity provider and server-side registry must resolve account status, roles, class/program scopes and permissions.

## Student gate
Identity → active account → student role → enrollment → class scope → resource permission. Proctored exams add release-window, prerequisite, attempt, identity and proctor checks.

## Teacher/faculty gate
Identity → active staff status → staff role → MFA → assigned scope → resource permission. Sensitive actions require step-up authentication and audit logging.

## SSO handoff
The deployed UI reads `NEXT_PUBLIC_STUDENT_SSO_ENTRYPOINT` and `NEXT_PUBLIC_STAFF_SSO_ENTRYPOINT`. Until those are configured, users are routed to `/access-pending`. Authentication credentials and client secrets must never be stored in Git.

## Data boundary
Public portal shells must never render student records, grades, secure assessment banks, answer keys, transcripts or private messages. Those resources require authenticated server-side authorization.
