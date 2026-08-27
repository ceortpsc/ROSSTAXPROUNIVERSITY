# Ross Tax Pro University — Production LMS Foundation

## Scope
100% online accounting and taxation LMS with desktop/mobile interfaces, eTextbook delivery, assessment, enrollment, registrar, faculty, staff, developer, and administration workspaces.

## Experience map
- Public: landing, programs, catalog, textbook store, Founder CTA, admissions, contact.
- Student: dashboard, courses, eTextbook reader, assignments, quizzes, exams, grades, calendar, messages, resources, degree audit.
- Educator: course builder, lesson manager, assignments, rubrics, gradebook, discussions, analytics, office hours.
- Registrar: enrollment, sections, academic records, transcripts, degree audits, completion review, credential workflow.
- Administration: identity, roles, policy, finance, reporting, compliance, audit, system configuration.
- Staff/Support: tickets, onboarding, student services, communications, case management.
- Developer: APIs, route atlas, integration status, deployments, logs, feature flags, schema versions.

## Environment model
feature/* -> Preview; develop -> Staging; release/* -> RC; main -> Production.

## Production gates
Identity, access control, data migration validation, curriculum versioning, accessibility, security, backup/recovery,
policy approval, publication metadata, and smoke tests must pass before production promotion.
