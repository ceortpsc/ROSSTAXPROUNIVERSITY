export type LmsProviderId = 'google-classroom' | 'canvas' | 'moodle' | 'blackboard';
export type LmsStatus = 'active' | 'configured' | 'adapter-ready' | 'disabled';

export type LmsProvider = {
  id: LmsProviderId;
  label: string;
  status: LmsStatus;
  auth: 'oauth2' | 'token' | 'oauth2-or-token';
  apiBase: string;
  capabilities: string[];
  requiredEnvironment: string[];
  notes: string[];
};

export type LmsRole = 'platform-admin' | 'lms-admin' | 'instructor' | 'registrar' | 'student' | 'auditor';

export const lmsPermissions: Record<LmsRole, string[]> = {
  'platform-admin': ['lms:read', 'lms:configure', 'lms:provision', 'lms:sync', 'lms:audit', 'lms:secrets:reference'],
  'lms-admin': ['lms:read', 'lms:configure', 'lms:provision', 'lms:sync', 'lms:audit'],
  instructor: ['lms:read', 'lms:coursework:write', 'lms:roster:read', 'lms:grades:write'],
  registrar: ['lms:read', 'lms:roster:read', 'lms:records:sync', 'lms:audit'],
  student: ['lms:read:self', 'lms:coursework:submit'],
  auditor: ['lms:read', 'lms:audit']
};

function enabled(name: string) {
  return process.env[name]?.toLowerCase() === 'true';
}

function hasAll(names: string[]) {
  return names.every((name) => Boolean(process.env[name]));
}

export function getLmsProviders(): LmsProvider[] {
  const classroomEnv = ['GOOGLE_CLASSROOM_CLIENT_ID', 'GOOGLE_CLASSROOM_CLIENT_SECRET', 'GOOGLE_CLASSROOM_REDIRECT_URI'];
  const canvasEnv = ['CANVAS_API_BASE_URL', 'CANVAS_ACCESS_TOKEN'];
  const moodleEnv = ['MOODLE_API_BASE_URL', 'MOODLE_TOKEN'];
  const blackboardEnv = ['BLACKBOARD_API_BASE_URL', 'BLACKBOARD_CLIENT_ID', 'BLACKBOARD_CLIENT_SECRET'];

  return [
    {
      id: 'google-classroom',
      label: 'Google Classroom',
      status: hasAll(classroomEnv) ? 'active' : 'adapter-ready',
      auth: 'oauth2',
      apiBase: 'https://classroom.googleapis.com',
      capabilities: ['courses', 'rosters', 'coursework', 'profiles', 'grades', 'provisioning'],
      requiredEnvironment: classroomEnv,
      notes: [
        'OAuth consent and Google account entitlement remain provider-managed.',
        'The RTPU callback must exactly match the authorized redirect URI configured on the Google OAuth client.'
      ]
    },
    {
      id: 'canvas',
      label: 'Canvas LMS',
      status: hasAll(canvasEnv) && enabled('LMS_CANVAS_ENABLED') ? 'configured' : 'adapter-ready',
      auth: 'token',
      apiBase: process.env.CANVAS_API_BASE_URL || 'https://<tenant>.instructure.com/api/v1',
      capabilities: ['courses', 'enrollments', 'assignments', 'submissions', 'grades'],
      requiredEnvironment: [...canvasEnv, 'LMS_CANVAS_ENABLED'],
      notes: ['Tenant-level API access is required. No token is committed to source control.']
    },
    {
      id: 'moodle',
      label: 'Moodle',
      status: hasAll(moodleEnv) && enabled('LMS_MOODLE_ENABLED') ? 'configured' : 'adapter-ready',
      auth: 'token',
      apiBase: process.env.MOODLE_API_BASE_URL || 'https://<tenant>/webservice/rest/server.php',
      capabilities: ['courses', 'users', 'enrollments', 'assignments', 'grades'],
      requiredEnvironment: [...moodleEnv, 'LMS_MOODLE_ENABLED'],
      notes: ['Moodle web services must be enabled by the LMS administrator.']
    },
    {
      id: 'blackboard',
      label: 'Blackboard Learn',
      status: hasAll(blackboardEnv) && enabled('LMS_BLACKBOARD_ENABLED') ? 'configured' : 'adapter-ready',
      auth: 'oauth2-or-token',
      apiBase: process.env.BLACKBOARD_API_BASE_URL || 'https://<tenant>/learn/api/public/v1',
      capabilities: ['courses', 'users', 'memberships', 'content', 'grades'],
      requiredEnvironment: [...blackboardEnv, 'LMS_BLACKBOARD_ENABLED'],
      notes: ['Registration with the tenant and appropriate REST scopes are required.']
    }
  ];
}

export function getLmsSnapshot() {
  const providers = getLmsProviders();
  return {
    schemaVersion: '1.0',
    system: 'ROSSTAXPROUNIVERSITY',
    integrationPlane: 'Andreaa Channel LMS Integration Plane',
    providers,
    roles: lmsPermissions,
    controls: {
      leastPrivilege: true,
      secretsInSourceControl: false,
      destructiveProvisioningRequiresApproval: true,
      providerEntitlementsRemainProviderManaged: true,
      auditEvidenceRequired: true,
      simulationCountsAsProductionEvidence: false
    },
    observedAtUtc: new Date().toISOString()
  };
}
