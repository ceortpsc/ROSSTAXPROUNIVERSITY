# Andreaa Channel Governance, RBAC and Execution Policy

## Purpose

This document defines who may do what, under which conditions, and with which evidence requirements across Andreaa Channel, LMS integrations, production operations and provider connections.

## Policy hierarchy

1. applicable law and contractual obligations
2. provider platform rules and tenant restrictions
3. organization security and privacy policy
4. this Andreaa Channel governance policy
5. implementation-specific runbooks and procedures

A lower-level instruction may not override a higher-level restriction.

## Roles

### Platform Administrator

**Scope:** application runtime, configuration, deployments, provider adapters, operational policy.  
**Allowed:** non-secret configuration, deployment orchestration, integration setup, production evidence, rollback.  
**Approval required:** destructive data actions, paid infrastructure changes, ownership/IAM escalation, credential revocation/rotation affecting production.

### LMS Administrator

**Scope:** LMS provider configuration, course provisioning, rosters, sync and audit.  
**Allowed:** configure provider adapters, validate tenant connectivity, provision courses and enrollment workflows when authorized.  
**Not allowed by role alone:** infrastructure ownership, production secrets export, billing commitments.

### Instructor

**Scope:** assigned instructional resources.  
**Allowed:** view assigned courses and rosters, manage coursework and permitted grading flows.  
**Not allowed:** platform-level provider credentials, organization-wide roster exports unless separately authorized.

### Registrar

**Scope:** student enrollment, academic records, roster reconciliation.  
**Allowed:** roster read/sync, records reconciliation, audit evidence.  
**Not allowed:** code deployment or provider-secret administration.

### Student

**Scope:** own account and enrolled instructional resources.  
**Allowed:** self-service course access and submissions exposed by the application.  
**Not allowed:** other learners' private records, administrative APIs, provider credentials.

### Auditor

**Scope:** read-only evidence and operational records.  
**Allowed:** inspect non-secret configuration state, release evidence, audit output.  
**Not allowed:** mutate production state.

## Permission registry

| Permission | Platform admin | LMS admin | Instructor | Registrar | Student | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| `lms:read` | yes | yes | yes | yes | no | yes |
| `lms:read:self` | yes | yes | yes | yes | yes | no |
| `lms:configure` | yes | yes | no | no | no | no |
| `lms:provision` | yes | yes | no | no | no | no |
| `lms:sync` | yes | yes | limited | yes | no | no |
| `lms:coursework:write` | yes | yes | yes | no | no | no |
| `lms:grades:write` | yes | yes | yes | no | no | no |
| `lms:records:sync` | yes | yes | no | yes | no | no |
| `lms:audit` | yes | yes | no | yes | no | yes |
| `ops:read` | yes | limited | no | no | no | yes |
| `ops:deploy` | yes | no | no | no | no | no |
| `ops:maintenance` | yes | no | no | no | no | no |
| `secrets:reference` | yes | limited | no | no | no | no |
| `secrets:read-value` | never through UI/API | never | never | never | never | never |

`secrets:read-value` is intentionally excluded from application-level interfaces. Secret values should be managed in the hosting/provider secret store.

## Action classes

### Class A - safe/read-only

May execute without separate approval when already within the user's authorized scope:

- read health metadata
- read capability/LMS registries
- generate blueprints
- generate documentation
- compile/build source
- inspect source-controlled configuration
- create non-secret evidence summaries

### Class B - controlled mutation

May execute when the user has already asked for the change and the action is reversible and scoped:

- commit source code
- update non-secret configuration
- deploy a code release
- enable an application feature flag where provider entitlement is already verified

Execution must still record evidence and preserve rollback.

### Class C - explicit approval required

Require specific user approval immediately before execution:

- deleting production data/resources
- rotating/revoking credentials
- changing organization ownership or high-privilege IAM
- enabling paid/billable resources or subscriptions
- disabling security controls
- irreversible bulk mutations
- transmitting external regulated/legal filings

A blanket statement such as "allow all high risk actions" does not remove this requirement.

## Provider boundaries

Andreaa Channel must never claim to:

- bypass Google, LMS or model-provider quotas
- bypass age or regional eligibility
- fabricate an OAuth authorization
- create a provider subscription that was not actually purchased/entitled
- treat an OAuth redirect as proof of successful authorization
- expose or persist a refresh token in source-control evidence

## Evidence states

Use these exact operational distinctions where applicable:

- **DRAFTED** - content exists but has not been committed/applied
- **CONFIGURED** - configuration exists in the target system
- **BUILT** - compilation/build succeeded
- **DEPLOYED** - deployment was created
- **LIVE** - platform reports release active and runtime is reachable
- **AUTHORIZED** - external provider authorization is confirmed
- **VERIFIED** - claim-specific evidence was observed
- **BLOCKED** - dependency or authorization is missing
- **FAILED** - attempted action returned a failure

## Secret-handling rules

1. Never commit secret values.
2. Never include OAuth refresh/access tokens in documentation, screenshots or evidence files.
3. Log secret presence/readiness only as boolean state or non-reversible fingerprint where necessary.
4. Mask deployment hooks, API tokens and client secrets.
5. Rotate a secret exposed publicly; do not simply delete the visible copy and assume compromise risk is gone.

## Production release authority

A production release may be marked complete only when:

- source is committed
- production build succeeds
- deployment platform reports `live` or equivalent
- required runtime checks pass
- external-provider states are separately identified as active, pending or blocked
- no simulated provider state is represented as production evidence

## Audit requirements

Each material release should preserve:

- commit SHA
- deployment ID
- build status
- deploy final state
- timestamp
- changed surfaces
- known pending dependencies
- rollback commit

Audit evidence must exclude secrets and unnecessary personal information.
