# Advanced Design & Engineering Techniques

## Visual system
- Navy/gold/white/ivory enterprise palette
- 12-column desktop grid; single-column mobile fallback
- Progressive disclosure for complex registrar, faculty and tax workflows
- Consistent empty/loading/error/success states
- Accessible focus rings, semantic landmarks and keyboard-first navigation

## Interaction design
- Command/action registry for every mutation
- Optimistic UI only for reversible low-risk actions
- Confirmation + reason for sensitive changes
- Idempotency keys on retriable writes
- Correlation IDs across browser, API, job and provider layers

## Performance technique
- Server-render stable content
- Lazy-load charts, editors and large eTextbook assets
- Route-level caching with explicit invalidation
- Paginate analytics and record-heavy views
- Measure p50/p95/p99 latency and Core Web Vitals

## Architecture technique
- Domain-driven module boundaries
- Contract-first APIs
- Adapter pattern for external systems
- Event-oriented analytics
- Separate transactional, analytical and evidence concerns

## UX quality technique
- Every workflow is modeled as state → action → validation → outcome.
- Every failure includes recovery instructions.
- Every high-impact workflow has a visible human owner.
