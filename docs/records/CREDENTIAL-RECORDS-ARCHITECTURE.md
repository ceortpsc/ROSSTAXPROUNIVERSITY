# RTPU Credential, Transcript & Academic Records Architecture

## Purpose

This subsystem registers the RTPU credential/document template library and defines the canonical PostgreSQL model and named-query contract for academic records, transcripts, transfer-credit evaluation, degree audits, credentials, document requests, delivery evidence, verification, signatures, human approvals, and audit events.

The source-controlled contract is intentionally separated into four layers:

1. **Artifact registry** — `config/credential-artifact-registry.json`
2. **Data/query registry** — `config/credential-records-registry.json`
3. **PostgreSQL schema** — `db/migrations/001_credential_records.sql`
4. **Named query catalog** — `db/queries/credential_records.sql`

The read-only API contract is in `openapi/credential-records.openapi.yaml`.

## Current operational state

The registry/API layer is deployable without a database. The API reports either `schema-ready-not-provisioned` or `connection-configured-schema-application-unverified` based on database configuration. A database connection alone is never treated as evidence that migrations or seed data were applied.

No API in this release performs credential issuance, transcript persistence, gradebook persistence, or student-record mutation. Those operations require an authorized production database plus access control, migration evidence, and the human approval gates described below.

## Artifact inventory

The template library contains 24 DOCX templates with stable artifact identifiers `RTPU-DOC-001` through `RTPU-DOC-024`. Each registry entry records title, file name, category, version, issuance class, SHA-256 digest and placeholder fields.

Categories:

- diplomas
- certificates/completion records
- official and unofficial transcripts
- transfer-credit evaluation
- program/degree audit
- student record summary
- enrollment/good-standing/completion verification letters
- transcript/replacement requests
- credential verification
- registrar certification
- prior-education evaluation
- admission decision notice
- graduation-clearance checklist

Every template remains `template-not-issued` until an authorized workflow verifies the canonical data and an authorized human approves issuance where required.

## Canonical table domains

### Identity and catalog

- `rtpu_students`
- `rtpu_programs`
- `rtpu_terms`
- `rtpu_courses`
- `rtpu_program_requirements`

The student table intentionally excludes Social Security numbers, FSA IDs, government passwords, bank credentials, tax-return data and other unnecessary sensitive identifiers.

### Enrollment and academic record

- `rtpu_student_programs`
- `rtpu_course_enrollments`
- `rtpu_course_results`
- `rtpu_student_holds`

### Transfer credit

- `rtpu_transfer_sources`
- `rtpu_transfer_evaluations`
- `rtpu_transfer_credit_items`

### Completion and audit

- `rtpu_degree_audits`
- `rtpu_degree_audit_items`

### Document generation

- `rtpu_document_templates`
- `rtpu_document_template_versions`
- `rtpu_document_template_fields`
- `rtpu_document_instances`
- `rtpu_document_instance_values`

### Credentials and transcripts

- `rtpu_credential_awards`
- `rtpu_credential_registry`
- `rtpu_transcripts`
- `rtpu_transcript_lines`

### Requests, verification and evidence

- `rtpu_document_requests`
- `rtpu_document_deliveries`
- `rtpu_verification_requests`
- `rtpu_signatures`
- `rtpu_approvals`
- `rtpu_audit_events`

## Views

`rtpu_v_student_academic_summary` provides program/credit/GPA summary data.

`rtpu_v_graduation_clearance` combines the most recent degree-audit state with credential-blocking holds.

`rtpu_v_credential_verification_public` exposes only minimal credential verification attributes and intentionally omits sensitive student data.

`rtpu_v_document_request_queue` provides the registrar service queue.

## Query contract

The named query catalog Q01–Q20 covers:

- active template inventory and fields
- student academic summary
- transcript header and lines
- latest degree audit
- graduation clearance
- issuance gates
- full and public credential verification
- registrar document queue
- transfer evaluations
- student document inventory
- audit timelines
- draft document creation
- human approvals
- credential finalization
- credential voiding
- transcript revisions
- delivery completion

Mutation queries are examples of the transaction contract. They are not considered operational until executed through an authorized service against a verified production schema.

## Credential issuance rule

AI may assist with record reconciliation, placeholder mapping and draft rendering. AI must not independently award a credential.

Before an award can move to issued status, the registrar workflow must establish at minimum:

- student identity is resolved
- enrollment/program record is canonical
- program/catalog version is known
- required course and credit rules are satisfied
- applicable assessments/capstone requirements are satisfied
- current degree audit is clear
- credential-blocking holds are clear
- institutional/program authority statements are independently verified where relevant
- an authorized human approval is recorded with an evidence reference

The issuance query intentionally requires an already-approved award and an `approved-for-issuance` document instance.

## Transcript rule

Official and unofficial transcripts are separate records. Each transcript uses a revision number so historical revisions are not silently overwritten. Transcript lines should be generated from canonical course results and approved transfer-credit records, not from document text.

## Verification rule

Public verification must use a credential ID plus a verification code whose stored value is hashed. Public results contain minimal credential information and must not expose date of birth, addresses, SSNs, complete transcripts, or unrelated educational records.

## Template integrity

Template versions are identified by SHA-256. Rendering should capture both the source template digest and the rendered-document digest. A replacement template creates a new version instead of silently changing historical issuance evidence.

## Recommended database cutover sequence

1. Provision an authorized PostgreSQL 15+ database.
2. Set `RTPU_RECORDS_DATABASE_URL` in the deployment secret manager.
3. Apply `db/migrations/001_credential_records.sql` in a controlled migration session.
4. Reconcile all 24 artifact registry entries into document template/version/field tables.
5. Verify table/view counts against `config/credential-records-registry.json`.
6. Run read-only Q01–Q14 against non-sensitive verification data.
7. Validate authorization/RBAC around registrar and approver actions.
8. Exercise document draft generation without issuance.
9. Exercise an authorized human approval record.
10. Only after evidence is retained, enable credential/transcript mutation APIs.

## Required evidence for production persistence

Do not claim the persistence layer is live until evidence contains:

- database resource identifier
- applied migration identifier/hash
- schema/table/view counts
- seed/reconciliation counts for all 24 templates
- successful read-only query probes
- least-privilege service role
- backup/restore policy
- audit-event retention policy
- authorization tests for registrar and approver functions

## Registry APIs

Production-safe read-only registry surfaces:

```text
GET /api/records/registry
GET /api/records/templates
GET /api/records/templates/{artifactId}
GET /api/records/schema
GET /api/records/queries
```

These endpoints describe the contracts and template inventory. They do not simulate student records or credential issuance.
