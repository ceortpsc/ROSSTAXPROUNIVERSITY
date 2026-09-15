export type LmsRole = 'platform-admin' | 'lms-admin' | 'instructor' | 'registrar' | 'student' | 'auditor';

export const lmsPermissions: Record<LmsRole, string[]> = {
  'platform-admin': ['lms:read', 'lms:configure', 'lms:provision', 'lms:orchestrate', 'lms:audit', 'lms:agents:manage'],
  'lms-admin': ['lms:read', 'lms:configure', 'lms:provision', 'lms:orchestrate', 'lms:audit'],
  instructor: ['lms:read', 'lms:lesson:write', 'lms:assessment:write', 'lms:roster:read', 'lms:feedback:write'],
  registrar: ['lms:read', 'lms:records:read', 'lms:records:route', 'lms:audit'],
  student: ['lms:read:self', 'lms:practice', 'lms:lecture:request', 'lms:plan:request'],
  auditor: ['lms:read', 'lms:audit']
};

export function getLmsSnapshot() {
  return {
    schemaVersion: '2.0',
    system: 'ROSSTAXPROUNIVERSITY',
    integrationPlane: 'RTPU Native AI Learning Management System',
    provider: {
      id: 'rtpu-ai-lms',
      label: 'RTPU AI LMS',
      status: 'active',
      ownership: 'first-party',
      externalLmsDependency: false,
      capabilities: [
        'programs', 'courses', 'lessons', 'lecture-simulation', 'adaptive-tutoring', 'learning-plans',
        'assessment-blueprints', 'student-experience', 'faculty-experience', 'records-routing', 'agent-orchestration'
      ]
    },
    roles: lmsPermissions,
    controls: {
      leastPrivilege: true,
      secretsInSourceControl: false,
      highImpactActionsRequireHumanApproval: true,
      auditEvidenceRequired: true,
      generatedInstructionClearlyLabeled: true,
      automatedAdmissionsDecision: false,
      automatedEmploymentDecision: false,
      externalProviderSuccessClaims: false
    },
    observedAtUtc: new Date().toISOString()
  };
}
