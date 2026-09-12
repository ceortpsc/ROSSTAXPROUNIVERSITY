# RTPU Render Operations Implementation

This repository implements application-side controls corresponding to the operational areas used in Render: deployments, health/troubleshooting, security/compliance, optimization, quotas/reservations, maintenance, support and application topology.

## Production surfaces

- `/admin/operations`
- `/api/ops/overview`
- `/api/ops/health`
- `/api/ops/security`
- `/api/ops/optimization`
- `/api/ops/quotas`
- `/api/ops/maintenance`
- `/api/ops/support`
- `/api/ops/topology`

## Guardrails

- Secrets stay in deployment environment variables and are never returned by operational endpoints.
- Mutating maintenance actions require `x-ops-key` matching `OPS_ADMIN_KEY`.
- The maintenance API exposes only non-destructive actions.
- Paid reservations, instance upgrades or other billable resources are not created automatically.
- Security headers are applied globally through `next.config.mjs`.

## Deployment model

`main` is the production branch. The connected Render service is configured for automatic deploys on commits to `main`. Build/deploy state must be verified in Render before treating a release as live.
