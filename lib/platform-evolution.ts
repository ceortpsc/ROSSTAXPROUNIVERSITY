import { createHash } from 'node:crypto';

export type ReleaseChannel = 'alpha' | 'beta' | 'rc' | 'stable' | 'next';

export const releaseChannels = [
  { id: 'alpha', label: 'Alpha', purpose: 'Architecture experiments and internal capability discovery', promotionGate: 'design-reviewed + security-reviewed', publicDefault: false },
  { id: 'beta', label: 'Beta', purpose: 'Integrated feature validation with production-safe provider gates', promotionGate: 'contract-stable + observability-ready', publicDefault: false },
  { id: 'rc', label: 'Release Candidate', purpose: 'Production candidate with frozen interfaces and rollback evidence', promotionGate: 'release-checklist-complete', publicDefault: false },
  { id: 'stable', label: 'Stable', purpose: 'Current production campus', promotionGate: 'deployed + health-evidence', publicDefault: true },
  { id: 'next', label: 'Next', purpose: 'Forward-compatible roadmap and staged enhancements', promotionGate: 'explicit promotion only', publicDefault: false }
] as const;

export const routeRegistry = [
  ['/', 'public', 'Institution home'],
  ['/institution', 'public', 'Online institution campus'],
  ['/programs', 'public', 'Program catalog'],
  ['/programs/tax-practitioner-diploma', 'public', '4-semester tax practitioner diploma'],
  ['/admissions', 'public', 'Admissions and enrollment gateway'],
  ['/student/dashboard', 'student', 'Student portal dashboard'],
  ['/faculty/dashboard', 'faculty', 'Faculty portal dashboard'],
  ['/records', 'student|registrar', 'Records and transcript center'],
  ['/help', 'public', 'Student services and support'],
  ['/engineering', 'staff', 'Engineering principles and platform architecture'],
  ['/releases', 'staff', 'Release channel and promotion center'],
  ['/ai-assist', 'staff', 'Andreaa Channel AI assist console'],
  ['/andreaa-channel', 'staff', 'Andreaa Channel capabilities'],
  ['/andreaa-channel/engine', 'staff', '10-tier reasoning and engineering engine'],
  ['/andreaa-channel/platform', 'staff', 'Platform control plane'],
  ['/admin/operations', 'admin', 'Production operations'],
  ['/admin/integrations/google-classroom', 'admin', 'Google Classroom control surface'],
  ['/signin', 'public', 'Secure sign-in gateway'],
  ['/signin/student', 'public', 'Student sign-in'],
  ['/signin/teacher', 'public', 'Faculty sign-in']
].map(([path, access, label]) => ({ path, access, label }));

export const moduleRegistry = [
  { id: 'academic-catalog', domain: 'academic', status: 'operational', capabilities: ['program catalog', 'course manifest', 'term metadata'] },
  { id: 'admissions', domain: 'student-lifecycle', status: 'operational', capabilities: ['invite', 'application', 'e-signature', 'clearance', 'conversion', 'export'] },
  { id: 'google-classroom', domain: 'lms', status: 'provider-gated', capabilities: ['courses', 'rosters', 'teachers', 'coursework', 'oauth evidence'] },
  { id: 'student-experience', domain: 'portal', status: 'operational', capabilities: ['dashboard', 'program progress', 'records', 'support navigation'] },
  { id: 'faculty-experience', domain: 'portal', status: 'operational', capabilities: ['course operations', 'roster navigation', 'instructional workflow'] },
  { id: 'andreaa-channel', domain: 'ai-engineering', status: 'operational', capabilities: ['reasoning', 'blueprints', 'architecture', 'execution plans', 'evidence policy'] },
  { id: 'operations', domain: 'platform', status: 'operational', capabilities: ['health', 'security', 'topology', 'maintenance boundaries', 'support'] },
  { id: 'records', domain: 'registrar', status: 'interface-ready', capabilities: ['record views', 'transcript requests', 'document status'] },
  { id: 'release-engineering', domain: 'platform', status: 'operational', capabilities: ['alpha', 'beta', 'rc', 'stable', 'next', 'promotion gates'] }
] as const;

export const engineeringPrinciples = [
  'evidence-before-assertion',
  'fail-closed-provider-writes',
  'least-privilege-access',
  'versioned-contracts',
  'deterministic-release-gates',
  'observability-by-default',
  'idempotent-provider-provisioning',
  'rollbackable-deployments',
  'responsive-accessible-interfaces',
  'performance-budget-enforcement',
  'privacy-and-data-minimization',
  'explicit-human-approval-for-high-impact-actions'
] as const;

export const performanceBudgets = {
  clientInitialJsKbGzipTarget: 110,
  clientCssKbGzipTarget: 20,
  p95ApiLatencyMsTarget: 750,
  availabilityObjective: 'provider-aware; no synthetic provider success',
  cachePolicy: 'static-assets-cacheable; APIs no-store by default'
};

export function platformSnapshot() {
  const payload = {
    schemaVersion: '3.0',
    platform: 'Ross Tax Pro University',
    runtime: 'Fastify + Vite + React + TypeScript',
    activeChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable',
    releaseChannels,
    routeRegistry,
    moduleRegistry,
    engineeringPrinciples,
    performanceBudgets,
    generatedAtUtc: new Date().toISOString()
  };
  return {
    ...payload,
    evidenceSha256: createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  };
}

export function releaseEvidence() {
  return {
    schemaVersion: '1.0',
    sourceCommit: process.env.RENDER_GIT_COMMIT || null,
    sourceBranch: process.env.RENDER_GIT_BRANCH || 'main',
    serviceId: process.env.RENDER_SERVICE_ID || null,
    environment: process.env.RTPU_DEPLOY_ENV || 'development',
    releaseChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable',
    providerSuccessPolicy: 'External provider actions are complete only with provider-returned evidence.',
    observedAtUtc: new Date().toISOString()
  };
}
