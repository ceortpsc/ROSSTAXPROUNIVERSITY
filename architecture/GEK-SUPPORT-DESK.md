# Geek-Squad-Style Technical Support Architecture

## Support tiers
- T0: self-service diagnostics, status pages, knowledge base, guided fixes.
- T1: student/faculty support for browser, access, course, submission and notification issues.
- T2: application engineering for API, database, integration and performance incidents.
- T3: security/platform escalation for identity, infrastructure, incident response and vendor failures.

## Ticket lifecycle
Intake → identity/context check → classify → reproduce → diagnose → remediate → verify → document → close.

## Evidence attached to each incident
Ticket ID, role, environment, route, correlation ID, timestamps, sanitized logs, reproduction steps, remediation, validation result and owner.

## Guardrails
Support personnel never request passwords, MFA codes, recovery codes, API secrets or payment credentials. Production data is minimized in tickets. High-impact academic or financial changes require authorized workflows.
