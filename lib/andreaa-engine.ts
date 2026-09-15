import { createHash } from 'node:crypto';

export type AndreaaTierLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type AndreaaTier = {
  level: AndreaaTierLevel;
  name: string;
  speedClass: string;
  internalCapacityMultiplier: number;
  maxParallelStages: number;
  planningDepth: number;
  maxBlueprintNodes: number;
  operatingMode: string;
};

export type AndreaaCompetency = {
  id: string;
  label: string;
  mission: string;
  minimumTier: AndreaaTierLevel;
};

export type AndreaaBlueprintStage = {
  order: number;
  id: string;
  owner: string;
  mission: string;
  outputs: string[];
  parallelGroup: number;
  gate: 'automatic' | 'evidence' | 'human-approval';
};

export const ANDREAA_ENGINE_VERSION = '10.0.0';

export const andreaaTiers: AndreaaTier[] = [
  { level: 1, name: 'Core', speedClass: 'foundational', internalCapacityMultiplier: 1, maxParallelStages: 1, planningDepth: 1, maxBlueprintNodes: 8, operatingMode: 'single-path reasoning' },
  { level: 2, name: 'Rapid', speedClass: 'accelerated', internalCapacityMultiplier: 2, maxParallelStages: 2, planningDepth: 2, maxBlueprintNodes: 12, operatingMode: 'reason + plan' },
  { level: 3, name: 'Builder', speedClass: 'fast', internalCapacityMultiplier: 3, maxParallelStages: 3, planningDepth: 3, maxBlueprintNodes: 18, operatingMode: 'plan + build' },
  { level: 4, name: 'Architect', speedClass: 'high-throughput', internalCapacityMultiplier: 4, maxParallelStages: 4, planningDepth: 4, maxBlueprintNodes: 24, operatingMode: 'architecture-led delivery' },
  { level: 5, name: 'Studio', speedClass: 'priority', internalCapacityMultiplier: 5, maxParallelStages: 6, planningDepth: 5, maxBlueprintNodes: 32, operatingMode: 'multi-discipline production' },
  { level: 6, name: 'Professional', speedClass: 'priority-plus', internalCapacityMultiplier: 6, maxParallelStages: 8, planningDepth: 6, maxBlueprintNodes: 40, operatingMode: 'full software lifecycle' },
  { level: 7, name: 'Expert', speedClass: 'expert', internalCapacityMultiplier: 7, maxParallelStages: 12, planningDepth: 7, maxBlueprintNodes: 52, operatingMode: 'expert parallel engineering' },
  { level: 8, name: 'Enterprise', speedClass: 'enterprise', internalCapacityMultiplier: 8, maxParallelStages: 16, planningDepth: 8, maxBlueprintNodes: 64, operatingMode: 'portfolio-scale orchestration' },
  { level: 9, name: 'Pioneer', speedClass: 'pioneer', internalCapacityMultiplier: 9, maxParallelStages: 24, planningDepth: 9, maxBlueprintNodes: 80, operatingMode: 'innovation + systems engineering' },
  { level: 10, name: 'Apex', speedClass: 'apex', internalCapacityMultiplier: 10, maxParallelStages: 32, planningDepth: 10, maxBlueprintNodes: 100, operatingMode: 'maximum Andreaa internal orchestration' }
];

export const andreaaCompetencies: AndreaaCompetency[] = [
  { id: 'reasoning-agent', label: 'Reasoning Agent', mission: 'Analyze objectives, constraints, dependencies, ambiguity and decision paths.', minimumTier: 1 },
  { id: 'ai-persona', label: 'AI Persona', mission: 'Maintain Andreaa Channel operating identity, communication discipline and task context.', minimumTier: 1 },
  { id: 'architect', label: 'Architect', mission: 'Define system boundaries, contracts, topology, data flow, security and deployment architecture.', minimumTier: 2 },
  { id: 'blueprint-planner', label: 'Blueprint Planner', mission: 'Convert objectives into ordered work packages, gates, dependencies and acceptance criteria.', minimumTier: 2 },
  { id: 'builder', label: 'Builder', mission: 'Assemble application structure, components, routes, services, configuration and integration surfaces.', minimumTier: 3 },
  { id: 'code-writer', label: 'Code Writer', mission: 'Produce maintainable implementation code that follows repository and runtime conventions.', minimumTier: 3 },
  { id: 'generator', label: 'Generator', mission: 'Generate schemas, contracts, documentation, assets, templates and repeatable implementation artifacts.', minimumTier: 4 },
  { id: 'executionist', label: 'Executionist', mission: 'Drive approved work through source control, deployment, operational gates and evidence-backed completion.', minimumTier: 5 },
  { id: 'client-app-developer', label: 'Client Application Developer', mission: 'Engineer usable client-facing interfaces, responsive interaction, accessibility and application flows.', minimumTier: 5 },
  { id: 'fundamentals-principles', label: 'Fundamentals & Principles Guardian', mission: 'Enforce correctness, simplicity, security, observability, maintainability and evidence-before-assertion.', minimumTier: 6 },
  { id: 'pioneer', label: 'Pioneer', mission: 'Explore higher-leverage architecture and product patterns without bypassing provider or safety boundaries.', minimumTier: 9 },
  { id: 'sde-expert', label: 'Software Development Engineer Expert', mission: 'Integrate architecture, implementation, reliability, performance, release engineering and operations.', minimumTier: 7 }
];

export const andreaaEngineeringPrinciples = [
  'Evidence before assertion',
  'Fail closed on missing authority, credentials or required configuration',
  'Least privilege and explicit provider boundaries',
  'Deterministic contracts and versioned interfaces',
  'Idempotent automation and safe retries',
  'Observability before optimization',
  'Rollbackable, source-controlled production changes',
  'Secure-by-default secret and identity handling',
  'Human approval for destructive, billing, ownership and external-authority changes',
  'Accessible, responsive and maintainable client applications',
  'Measured capacity instead of invented performance claims',
  'No simulated success in production evidence'
] as const;

function normalizeTier(level: number): AndreaaTierLevel {
  const parsed = Math.round(Number(level));
  return Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 10)) as AndreaaTierLevel;
}

export function getAndreaaTier(level: number = 10) {
  const normalized = normalizeTier(level);
  return andreaaTiers.find((tier) => tier.level === normalized)!;
}

function classifyObjective(objective: string) {
  const value = objective.toLowerCase();
  if (/deploy|production|render|vercel|release|cutover/.test(value)) return 'release-engineering';
  if (/api|integration|oauth|connector|webhook/.test(value)) return 'integration-engineering';
  if (/ui|ux|page|client|frontend|dashboard|portal/.test(value)) return 'client-application';
  if (/schema|database|data|query|migration/.test(value)) return 'data-engineering';
  if (/security|auth|rbac|permission|compliance/.test(value)) return 'security-engineering';
  if (/bug|error|failure|debug|fix/.test(value)) return 'diagnostics';
  return 'software-engineering';
}

function outputsFor(id: string) {
  const outputMap: Record<string, string[]> = {
    'reasoning-agent': ['objective model', 'constraints', 'dependency map'],
    'ai-persona': ['operating context', 'communication contract'],
    architect: ['architecture decision record', 'topology', 'interface contracts'],
    'blueprint-planner': ['implementation blueprint', 'ordered work graph', 'acceptance criteria'],
    builder: ['application structure', 'integrated components'],
    'code-writer': ['source implementation', 'configuration changes'],
    generator: ['schemas', 'documentation', 'generated artifacts'],
    executionist: ['execution ledger', 'deployment actions', 'completion evidence'],
    'client-app-developer': ['client interface', 'responsive flows', 'accessibility controls'],
    'fundamentals-principles': ['engineering gate review', 'risk and quality findings'],
    pioneer: ['innovation options', 'tradeoff analysis'],
    'sde-expert': ['integrated engineering review', 'production-readiness decision']
  };
  return outputMap[id] || ['work product'];
}

export function createAndreaaBlueprint(objectiveInput: string, requestedTier: number = 10) {
  const objective = String(objectiveInput || '').trim();
  if (!objective) throw new Error('objective is required');
  if (objective.length > 20000) throw new Error('objective exceeds 20,000 characters');

  const tier = getAndreaaTier(requestedTier);
  const activeCompetencies = andreaaCompetencies.filter((item) => item.minimumTier <= tier.level);
  const stages: AndreaaBlueprintStage[] = activeCompetencies.map((item, index) => {
    const parallelGroup = Math.floor(index / tier.maxParallelStages) + 1;
    const approvalRequired = item.id === 'executionist';
    const evidenceGate = item.id === 'fundamentals-principles' || item.id === 'sde-expert';
    return {
      order: index + 1,
      id: item.id,
      owner: item.label,
      mission: item.mission,
      outputs: outputsFor(item.id),
      parallelGroup,
      gate: approvalRequired ? 'human-approval' : evidenceGate ? 'evidence' : 'automatic'
    };
  });

  const fingerprint = createHash('sha256')
    .update(`${ANDREAA_ENGINE_VERSION}|${tier.level}|${objective}`)
    .digest('hex');

  return {
    schemaVersion: '1.0',
    engineVersion: ANDREAA_ENGINE_VERSION,
    blueprintId: `andreaa-${fingerprint.slice(0, 20)}`,
    createdAtUtc: new Date().toISOString(),
    objective,
    classification: classifyObjective(objective),
    tier,
    capacityContract: {
      multiplier: tier.internalCapacityMultiplier,
      maxParallelStages: tier.maxParallelStages,
      planningDepth: tier.planningDepth,
      maxBlueprintNodes: tier.maxBlueprintNodes,
      meaning: 'Andreaa Channel internal orchestration budget only; not a third-party model or subscription quota.'
    },
    activeCompetencies: activeCompetencies.map((item) => item.id),
    principles: andreaaEngineeringPrinciples,
    stages,
    executionPolicy: {
      sourceControlled: true,
      evidenceRequiredForCompletion: true,
      destructiveActionsRequireExplicitApproval: true,
      externalProviderEntitlementsRemainProviderManaged: true,
      simulatedProductionSuccessForbidden: true
    }
  };
}

export function getAndreaaEngineSnapshot(level: number = 10) {
  const tier = getAndreaaTier(level);
  return {
    schemaVersion: '1.0',
    engine: 'Andreaa Channel Standalone Engineering Engine',
    engineVersion: ANDREAA_ENGINE_VERSION,
    mode: 'standalone-control-plane',
    tier,
    tiers: andreaaTiers,
    competencies: andreaaCompetencies,
    principles: andreaaEngineeringPrinciples,
    guarantees: {
      internalTierCount: 10,
      maximumInternalCapacityMultiplier: 10,
      providerQuotaBypass: false,
      providerDependencyForCorePlanner: false,
      productionEvidenceRequired: true
    },
    observedAtUtc: new Date().toISOString()
  };
}
