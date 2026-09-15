# Andreaa Channel Production Runbook

## Objective

Operate, diagnose, release, verify and recover the Andreaa Channel production runtime without confusing configuration, deployment, provider authorization or simulation with verified production success.

## Known production target

```text
Repository: ceortpsc/ROSSTAXPROUNIVERSITY
Branch: main
Production URL: https://rosstaxprouniversity.onrender.com
Render service: srv-dagtjeht0dsc73fokt20
Runtime: Next.js / Node.js
Build: npm install && npm run build
Start: npm start
```

## 1. Local preparation

```bash
git pull --ff-only
npm install
RTPU_DEPLOY_ENV=production npm run preflight
npm run build
```

Expected result:

```text
PREFLIGHT RESULT: READY
Next.js optimized production build succeeds
TypeScript succeeds
```

A warning for a provider-specific environment variable may be acceptable when that provider is intentionally not enabled. A missing required production variable is blocking.

## 2. Development verification

```bash
npm run dev
```

In another terminal:

```bash
npm run andreaa -- health
npm run andreaa -- engine --tier 10
npm run andreaa -- lms
npm run andreaa -- blueprint --objective "Build a production-ready LMS enrollment workflow" --tier 10
```

## 3. Commit discipline

Before push:

```bash
git status
git diff --check
git diff
```

Commit example:

```bash
git add .
git commit -m "feat: publish Andreaa production engineering platform"
git push origin main
```

Never include secrets in staged changes.

## 4. Render auto-deploy

A push to `main` triggers the configured Render auto-deploy. Do not manually trigger an additional deploy unless the existing service is configured not to auto-deploy or a deliberate redeploy is required.

Deployment states should be interpreted as:

```text
queued -> build_in_progress -> update_in_progress -> live
```

A build success message is not the same as a live deployment.

## 5. Live verification

After Render reports live:

```bash
BASE=https://rosstaxprouniversity.onrender.com
curl -fsS "$BASE/api/health"
curl -fsS "$BASE/api/andreaa-channel/engine?tier=10"
curl -fsS "$BASE/api/lms/integrations"
curl -fsSI "$BASE/andreaa-channel/platform"
```

Or:

```bash
npm run andreaa -- health --base-url https://rosstaxprouniversity.onrender.com
npm run andreaa -- engine --tier 10 --base-url https://rosstaxprouniversity.onrender.com
npm run andreaa -- lms --base-url https://rosstaxprouniversity.onrender.com
```

## 6. Google Classroom OAuth verification

Start only from a browser:

```text
https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/start
```

Success requires:

```text
signed state accepted
token exchange successful
offline refresh token issued
userProfiles/me authorized read succeeds
courses.list authorized read succeeds
sanitized evidence receipt generated
```

An HTTP 302 from the start route proves only that the authorization URL was generated.

### redirect_uri_mismatch

Check the same OAuth client used by production and register exactly:

```text
https://rosstaxprouniversity.onrender.com/api/integrations/google-classroom/oauth/callback
```

Then start a new authorization flow. Do not reuse stale OAuth state.

## 7. Runtime incident triage

### Application not reachable

Check:

```text
Render service status
deploy final status
application start logs
port binding
DNS/TLS if custom domain is involved
```

### Build failure

Classify the failure:

```text
dependency installation
TypeScript
Next.js compilation
static generation
configuration/module resolution
```

Reproduce locally with:

```bash
npm install
npm run build
```

### OAuth failure

Separate:

```text
redirect URI mismatch
invalid/stale state
token exchange rejection
missing refresh token
provider permission denial
Classroom API authorization failure
```

### LMS provider failure

Read registry first:

```bash
curl -fsS https://rosstaxprouniversity.onrender.com/api/lms/integrations
```

Do not attempt writes when provider status is only `adapter-ready`.

## 8. Rollback

Identify the last known-good commit and redeploy it through the established source-control workflow.

Recommended sequence:

```bash
git log --oneline -n 10
git revert <bad-commit>
git push origin main
```

Prefer a normal revert over force-pushing `main` because it preserves history.

If a deployment is live but provider authorization is broken, do not roll back unrelated application code unless evidence links the failure to the release.

## 9. Maintenance controls

Maintenance endpoints remain protected by the server-side operations key. Never place `OPS_ADMIN_KEY` in a client bundle, Markdown file, URL or browser-visible configuration.

Use maintenance mode only when required by an operational action. Maintenance must not become a substitute for fixing a failing provider integration.

## 10. Secrets incident

If a secret is exposed:

```text
1. determine which secret and provider are affected
2. revoke/rotate through the provider/host
3. update the deployment secret store
4. redeploy if required
5. invalidate or remove exposed artifacts
6. record non-secret evidence of rotation
7. review logs/usage for abuse where supported
```

Deleting a secret from Git history or chat after exposure is not sufficient by itself; rotation/revocation is the remediation.

## 11. Release evidence template

```json
{
  "system": "ROSSTAXPROUNIVERSITY",
  "release": {
    "commit": "<sha>",
    "deployId": "<render-deploy-id>",
    "deployStatus": "live",
    "productionUrl": "https://rosstaxprouniversity.onrender.com",
    "observedAtUtc": "<timestamp>"
  },
  "runtime": {
    "build": "pass",
    "typescript": "pass",
    "health": "pass",
    "engine": "pass",
    "lmsRegistry": "pass"
  },
  "providers": {
    "googleClassroom": "pending|authorized|blocked"
  },
  "secretsIncluded": false
}
```

## 12. Completion language

Use precise states:

```text
CONFIGURED
BUILT
DEPLOYED
LIVE
AUTHORIZED
VERIFIED
BLOCKED
FAILED
```

Never collapse these into a single "done" status when the underlying evidence differs.
