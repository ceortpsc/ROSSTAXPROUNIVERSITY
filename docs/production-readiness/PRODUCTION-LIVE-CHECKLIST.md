# RTPU Production Live Checklist

Status vocabulary: **PASS** = directly verified, **READY** = implemented and build-validated, **PENDING** = requires an external or interactive dependency, **BLOCKED** = known failure prevents release.

## Release gate

- [x] PASS — GitHub default production branch is `main`.
- [x] PASS — Render service is linked to `ceortpsc/ROSSTAXPROUNIVERSITY` and auto-deploys commits from `main`.
- [x] PASS — Latest signed OAuth-state deployment reached Render `live` status.
- [x] PASS — Render service is not suspended and maintenance mode is disabled.
- [x] PASS — Runtime is Node and build command is `npm install && npm run build`.
- [x] PASS — TypeScript production build completed successfully on the operations release immediately preceding the OAuth state fix.
- [x] READY — Repository includes repeatable production smoke test at `scripts/production-smoke.mjs`.
- [x] READY — CI workflow validates source and production build on every `main` push.
- [ ] PENDING — Interactive Google OAuth consent/token exchange must be completed by an authorized Google account; automated tests intentionally do not impersonate a user or bypass consent.
- [ ] PENDING — Google Classroom refresh token presence must be confirmed after successful consent and secure handoff.

## OAuth / Google Classroom gate

- [x] PASS — OAuth start route is implemented.
- [x] PASS — OAuth callback route is implemented.
- [x] PASS — OAuth state is HMAC-signed and time-bounded.
- [x] PASS — Invalid/tampered state is rejected before token exchange.
- [x] PASS — Authorization requests ask for offline access and explicit consent.
- [x] PASS — Classroom scopes include courses, rosters, student coursework, and profile email access.
- [x] PASS — Redirect URI is application-controlled and environment-configurable.
- [ ] PENDING — Browser consent must be restarted from a fresh `/oauth/start` URL after the signed-state deployment.
- [ ] PENDING — Course creation/roster provisioning is not considered verified until a real authorized Classroom API call succeeds.

## Security gate

- [x] READY — Secrets are referenced through server environment variables rather than committed source.
- [x] READY — OAuth state verification uses HMAC SHA-256 and timing-safe comparison.
- [x] READY — State expiry is 10 minutes with limited clock-skew tolerance.
- [x] READY — Maintenance mutation endpoint is protected by a server-side operations key.
- [x] READY — Destructive maintenance actions are disabled in the operations API.
- [x] READY — Operational endpoints avoid displaying secret values.
- [ ] PENDING — Rotate any OAuth client secret that has been exposed outside the deployment secret store, then update Render directly.

## Operations gate

- [x] PASS — `/admin/operations` was compiled into the production route set.
- [x] PASS — `/api/ops/health` was compiled into the production route set.
- [x] PASS — `/api/ops/security` was compiled into the production route set.
- [x] PASS — `/api/ops/optimization` was compiled into the production route set.
- [x] PASS — `/api/ops/quotas` was compiled into the production route set.
- [x] PASS — `/api/ops/maintenance` was compiled into the production route set.
- [x] PASS — `/api/ops/support` was compiled into the production route set.
- [x] PASS — `/api/ops/topology` was compiled into the production route set.

## Performance / capacity evidence

Recent Render observations showed low steady-state CPU utilization and memory around the high-70 MB range on the active instance after deployment. This is evidence of current behavior only, not a capacity guarantee. HTTP request-count and latency series were not returned in the sampled metrics window, so no latency SLA is asserted.

## Release decision

**Application runtime: LIVE.**  
**Google Classroom OAuth initiation: IMPLEMENTED.**  
**Google Classroom authorization: PENDING INTERACTIVE CONSENT.**  
**Classroom provisioning: NOT YET VERIFIED END-TO-END.**

Do not mark Classroom provisioning as production-verified until the consent flow succeeds, the refresh token is securely stored, and at least one authorized read operation against the Classroom API returns successfully.
