# Government Forms Engine

Three governed modes are supported:

1. Official Form Mode — authoritative current government form is the source of truth; never silently substitute an obsolete revision.
2. Guided Completion Mode — Ross Tax Pro UI collects answers, validates them, and maps them to fields in the selected official revision.
3. Training Simulation Mode — synthetic training forms clearly labeled as simulations and never represented as government-issued forms.

## AI assistance
AI may explain field purposes, identify missing required information, summarize official instructions, and provide training guidance. AI may not invent form revisions, citations, government approvals, signatures, identity attestations, or filing outcomes.

## Production gate
Every production submission requires: source/version verification, field validation, identity/access controls, authorized signature workflow where applicable, audit event, and human review for high-impact or ambiguous cases.

## Data rule
Government-form templates, field mappings, and user submissions must remain versioned. Secrets and production credentials are never committed to source control.
