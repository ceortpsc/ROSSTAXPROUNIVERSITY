export type AndreaaPlanId = 'standard' | 'ultra-lte';
export type CapabilityStatus = 'active' | 'adapter-ready' | 'provider-gated' | 'age-gated' | 'disabled';

export type AndreaaCapability = {
  id: string;
  label: string;
  category: 'reasoning' | 'creative' | 'development' | 'experimental';
  description: string;
  internalLimitMultiplier: number;
  provider: string;
  providerManagedQuota: boolean;
  status: CapabilityStatus;
  minimumAge?: number;
  notes?: string;
};

export const andreaaPlans = {
  standard: {
    id: 'standard' as const,
    label: 'Andreaa Channel Standard',
    internalLimitMultiplier: 1,
    queuePriority: 'standard',
    reasoningMode: 'standard'
  },
  'ultra-lte': {
    id: 'ultra-lte' as const,
    label: 'Andreaa Channel Ultra LTE',
    internalLimitMultiplier: 5,
    queuePriority: 'priority',
    reasoningMode: 'deep-capable'
  }
};

function envTrue(name: string) {
  return process.env[name]?.toLowerCase() === 'true';
}

function googleCoreConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export function getAndreaaCapabilities(): AndreaaCapability[] {
  const channelEnabled = process.env.ANDREAA_CHANNEL_ENABLED !== 'false';
  const ultraMultiplier = Number(process.env.ANDREAA_INTERNAL_LIMIT_MULTIPLIER || '5');
  const multiplier = Number.isFinite(ultraMultiplier) && ultraMultiplier > 0 ? ultraMultiplier : 5;
  const googleConfigured = googleCoreConfigured();

  return [
    {
      id: 'reasoning-agent',
      label: 'Andreaa Reasoning Agent',
      category: 'reasoning',
      description: 'Primary persona/orchestrator for planning, reasoning, assistance and employee-style workflow execution.',
      internalLimitMultiplier: multiplier,
      provider: 'Andreaa runtime',
      providerManagedQuota: false,
      status: channelEnabled ? 'active' : 'disabled'
    },
    {
      id: 'deep-think',
      label: 'Deep Think',
      category: 'reasoning',
      description: 'Deep reasoning adapter. Availability depends on the connected model provider and its account-level entitlement.',
      internalLimitMultiplier: multiplier,
      provider: 'Google Gemini / configured reasoning provider',
      providerManagedQuota: true,
      status: googleConfigured && envTrue('ANDREAA_DEEP_THINK_ENABLED') ? 'active' : 'provider-gated',
      notes: 'Andreaa Channel never manufactures or overrides provider-side usage limits.'
    },
    {
      id: 'image-generation',
      label: 'Image Generation',
      category: 'creative',
      description: 'Creative image-generation adapter with Ultra LTE priority scheduling inside Andreaa Channel.',
      internalLimitMultiplier: multiplier,
      provider: process.env.ANDREAA_IMAGE_PROVIDER || 'provider adapter',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_IMAGE_ENABLED') ? 'active' : 'adapter-ready'
    },
    {
      id: 'video-generation',
      label: 'Video Generation',
      category: 'creative',
      description: 'Video-generation adapter for provider-backed video models and creative workflows.',
      internalLimitMultiplier: multiplier,
      provider: process.env.ANDREAA_VIDEO_PROVIDER || 'provider adapter',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_VIDEO_ENABLED') ? 'active' : 'adapter-ready'
    },
    {
      id: 'music-generation',
      label: 'Music Generation',
      category: 'creative',
      description: 'Music-generation adapter slot for a supported provider. It remains inactive until a provider connection is configured.',
      internalLimitMultiplier: multiplier,
      provider: process.env.ANDREAA_MUSIC_PROVIDER || 'provider adapter',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_MUSIC_ENABLED') ? 'active' : 'adapter-ready'
    },
    {
      id: 'google-flow',
      label: 'Google Flow',
      category: 'creative',
      description: 'Provider-aware Flow integration surface for creative workflows and account-managed credits.',
      internalLimitMultiplier: multiplier,
      provider: 'Google Flow',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_FLOW_ENABLED') ? 'active' : 'provider-gated',
      notes: 'Flow credits and limits are controlled by Google subscription entitlements.'
    },
    {
      id: 'google-antigravity',
      label: 'Google Antigravity',
      category: 'development',
      description: 'Agentic-development adapter slot for Antigravity CLI/SDK workflows and development orchestration.',
      internalLimitMultiplier: multiplier,
      provider: 'Google Antigravity',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_ANTIGRAVITY_ENABLED') ? 'active' : 'provider-gated'
    },
    {
      id: 'google-jules',
      label: 'Google Jules',
      category: 'development',
      description: 'Asynchronous coding-agent integration surface for repository tasks and provider-managed usage tiers.',
      internalLimitMultiplier: multiplier,
      provider: 'Google Jules',
      providerManagedQuota: true,
      status: envTrue('ANDREAA_JULES_ENABLED') ? 'active' : 'provider-gated'
    },
    {
      id: 'project-genie',
      label: 'Project Genie',
      category: 'experimental',
      description: 'Experimental world-model capability. Access is controlled by Google eligibility requirements and must not be bypassed.',
      internalLimitMultiplier: multiplier,
      provider: 'Google Project Genie',
      providerManagedQuota: true,
      status: 'age-gated',
      minimumAge: 18,
      notes: 'Requires provider eligibility and verified age. Andreaa Channel does not bypass age or subscription restrictions.'
    }
  ];
}

export function getAndreaaRuntimeSnapshot(plan: AndreaaPlanId = 'ultra-lte') {
  const selectedPlan = andreaaPlans[plan];
  const capabilities = getAndreaaCapabilities();
  return {
    schemaVersion: '1.0',
    channel: 'Andreaa Channel',
    persona: {
      name: 'Andreaa Chan’nel',
      roles: ['reasoning agent', 'assistant', 'employee', 'workflow orchestrator'],
      mode: 'real-time orchestration',
      subscriberTier: selectedPlan.label
    },
    plan: selectedPlan,
    policy: {
      internalLimitRule: `${selectedPlan.internalLimitMultiplier}x Andreaa Channel scheduling/usage multiplier`,
      providerQuotaRule: 'passthrough',
      providerEntitlementsRequired: true,
      noQuotaBypass: true,
      ageEligibilityEnforced: true
    },
    capabilities,
    observedAtUtc: new Date().toISOString()
  };
}
