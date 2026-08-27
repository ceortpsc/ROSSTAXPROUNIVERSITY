# Ross Tax Pro University Control-Plane Organ Map

The dashboard shown in the approved UI is the presentation layer. The registry below maps the visible modules to their operational engines, routes, capabilities, integrations and automation triggers.

| Presentation module | Operational system | Brain/engine | Primary routes | Key capabilities | Background triggers |
|---|---|---|---|---|---|
| Overview | deployment | release-engine | `/dashboard`, `/engineering/deployments` | `release.validate`, `release.promote` | release pipeline, security health |
| Tax Platform | tax-platform | integration-engine | `/tax-platform/*` | connector sync | integration reconciliation |
| University | lms | academic-engine | `/university/*` | course read/manage | course progress, content index |
| Students | student-services | student-success-engine | `/students/*` | enrollment, tutoring, messaging | onboarding, deadline scan |
| Faculty | faculty | academic-engine | `/faculty/*` | course/assignment/grade management | grade review queue |
| Registrar | registrar | records-engine | `/registrar/*` | registration, transcript, degree review | audit refresh, transcript reconciliation |
| Integrations | integration boundary | integration-engine | `/engineering/integrations` | connector sync | scheduled reconciliation |
| Security | identity | security-engine | `/engineering/security` | security checks | 15-minute security health |
| Audit Trail | audit | governance-engine | `/engineering/audit-trail` | audit record | backup evidence |
| AI / Reasoning | ai + reasoning | reasoning-engine | `/api/ai`, `/api/control-plane` | tutoring, decision review | AI quality scan |

## Execution pattern

`UI action -> route -> capability check -> brain/engine -> connector -> provider -> acknowledgement -> audit event`

High-impact actions stop at a human-review gate unless an authorized human approval is supplied.

## Automation pattern

`event/cron -> automation registry -> ordered steps -> idempotent adapter -> outcome -> audit`

Background automation does not invent external state. Missing credentials or provider availability should produce a safe no-op or exception event rather than a fabricated success.
