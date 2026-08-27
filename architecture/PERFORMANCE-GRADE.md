# Performance Grade & Trust Artifact Standard

## Engineering grade targets
- Availability target: define per service/SLO before production launch.
- Error budget: calculated from the approved SLO, not guessed from a single deployment.
- Web performance: measure Core Web Vitals for critical LMS routes.
- API performance: track p50/p95/p99 latency, error rate, throughput and saturation.
- Data: monitor query latency, connection pools, cache hit ratio and migration duration.

## Release grade
A release is Ready only when build, type checks, security scan, route checks, accessibility checks, smoke tests and required integration checks pass.

## Trusted artifacts
Every release produces:
- immutable build/version identifier
- source commit SHA
- dependency lockfile snapshot
- test report
- security scan report
- accessibility report
- route inventory
- migration version
- deployment ID
- rollback reference

## Quality scorecard
| Domain | Evidence | Gate |
|---|---|---|
| Correctness | automated tests + review | Pass |
| Reliability | SLO/error budget | Pass |
| Security | scan + access review | Pass |
| Accessibility | automated + manual review | Pass |
| UX | responsive route review | Pass |
| Data integrity | migration + reconciliation | Pass |
| Academic integrity | human gates + audit | Pass |
