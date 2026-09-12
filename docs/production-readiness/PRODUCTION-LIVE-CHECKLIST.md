# RTPU Production Live Checklist

This checklist governs the live production release. Simulation, sandbox-only behavior, test fixtures, smoke-test scripts, CI validation artifacts, and temporary verification files are not part of the production source tree after cutover.

Status vocabulary: **PASS** = directly observed or confirmed; **PENDING** = requires an external interactive dependency; **BLOCKED** = known condition prevents the stated capability.

## Production cutover

- [x] PASS — Production repository branch is `main`.
- [x] PASS — Render service `ROSSTAXPROUNIVERSITY` is connected to `ceortpsc/ROSSTAXPROUNIVERSITY`.
- [x] PASS — Render auto-deploy is enabled for `main`.
- [x] PASS — Service environment is production, maintenance mode is disabled, and the service is not suspended.
- [x] PASS — Build command is `npm install && npm run build` and start command is `npm start`.
- [x] PASS — Testing, validation, smoke-test, and verification workflow artifacts were removed from the production source tree during cutover.
- [x] PASS — Package scripts retain only runtime/development/build/lint commands required by the application.

## Runtime and operations

- [x] PASS — `/api/health` is part of the production application.
- [x] PASS — `/admin/operations` is part of the production application.
- [x] PASS — Operations health, security, optimization, quota, maintenance, support, and topology endpoints are part of the production application.
- [x] PASS — Maintenance mutation actions remain server-key protected and destructive maintenance operations remain disabled by application policy.
- [x] PASS — Production security headers and no-store handling remain configured.

## Google Classroom production connector

- [x] PASS — OAuth start and callback routes are production routes.
- [x] PASS — OAuth state uses HMAC SHA-256, timing-safe verification, and a 10-minute maximum age.
- [x] PASS — Requested scopes cover Classroom courses, rosters, student coursework, and profile email access.
- [x] PASS — OAuth requests require explicit consent and offline access.
- [ ] PENDING — An authorized Google account must complete a fresh browser-initiated consent flow.
- [ ] PENDING — A refresh token must be securely handed off and stored after successful consent.
- [ ] PENDING — A real authorized Classroom API read must succeed before the connector is classified as end-to-end authorized.
- [ ] PENDING — Course/roster provisioning must return successful Google Classroom API responses before provisioning is classified as live.

## Engineering principles

- [x] PASS — Evidence-before-assertion is enforced in status reporting.
- [x] PASS — Missing credentials and invalid OAuth state fail closed.
- [x] PASS — Secrets remain outside source control.
- [x] PASS — External authority actions are not simulated or bypassed.
- [x] PASS — Production changes remain traceable to Git commits and Render deploys.
- [x] PASS — Student/staff data minimization remains an architectural requirement.

## Release decision

**RTPU application runtime: PRODUCTION LIVE.**  
**Google Classroom OAuth connector code: PRODUCTION LIVE.**  
**Google Classroom user authorization: PENDING INTERACTIVE GOOGLE CONSENT.**  
**Google Classroom provisioning: NOT YET END-TO-END AUTHORIZED.**

No sandbox or simulated success may be substituted for the pending Google authorization steps.
