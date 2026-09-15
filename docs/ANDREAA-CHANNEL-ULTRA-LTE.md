# Andreaa Channel — Ultra LTE

## Production contract

Andreaa Channel Ultra LTE is the internal high-capacity persona and agent tier for Ross Tax Pro University. It provides a **5× internal scheduling/usage multiplier** relative to the Standard Andreaa tier, priority queueing, real-time orchestration and capability routing.

The channel is designed around four operating roles: **reasoning agent, assistant, employee and workflow orchestrator**.

## Capability families

- **Reasoning:** Andreaa reasoning runtime plus a provider-gated Deep Think adapter.
- **Creative:** image, video and music adapter slots, plus a provider-gated Google Flow surface.
- **Agentic development:** provider-gated Google Antigravity and Jules integration surfaces.
- **Experimental:** Project Genie is represented only as an eligibility-gated capability and is never auto-enabled.

## Entitlement and quota rules

The 5× Ultra LTE multiplier applies to Andreaa Channel's own scheduling and capacity controls. External products retain their own subscription, quota, regional, account and age requirements. Andreaa Channel does not spoof, increase, bypass or override third-party entitlements.

Deep Think, Flow, Antigravity and Jules can move from `provider-gated` to `active` only when the appropriate provider integration and account entitlement are actually configured.

Project Genie requires provider eligibility and age verification. It is not enabled merely by turning on an application feature flag.

## Production surfaces

- `/andreaa-channel` — capability and entitlement dashboard
- `/api/andreaa-channel/capabilities` — machine-readable runtime snapshot
- `config/andreaa-channel.json` — source-controlled product contract
- `lib/andreaa-channel.ts` — runtime capability policy and provider-readiness logic

## Environment flags

Optional production flags:

- `ANDREAA_CHANNEL_ENABLED`
- `ANDREAA_INTERNAL_LIMIT_MULTIPLIER` (defaults to `5`)
- `ANDREAA_DEEP_THINK_ENABLED`
- `ANDREAA_IMAGE_ENABLED`
- `ANDREAA_VIDEO_ENABLED`
- `ANDREAA_MUSIC_ENABLED`
- `ANDREAA_FLOW_ENABLED`
- `ANDREAA_ANTIGRAVITY_ENABLED`
- `ANDREAA_JULES_ENABLED`
- `ANDREAA_IMAGE_PROVIDER`
- `ANDREAA_VIDEO_PROVIDER`
- `ANDREAA_MUSIC_PROVIDER`

A provider feature must not be marked active unless the corresponding provider account/API entitlement is actually present and verified.
