import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type EnrollmentAudience = 'prospective-student' | 'new-hire';
export type AgeGroup = 'under-18' | '18-plus';

export type EnrollmentProgram = {
  id: string;
  title: string;
  category: 'secondary' | 'college-readiness' | 'tax-professional';
  active: boolean;
  audiences: EnrollmentAudience[];
};

export const enrollmentPrograms: EnrollmentProgram[] = [
  { id: 'adult-hs-diploma', title: 'Adult Education High School Diploma', category: 'secondary', active: true, audiences: ['prospective-student', 'new-hire'] },
  { id: 'texas-homeschool-diploma', title: 'Texas Homeschool Diploma', category: 'secondary', active: true, audiences: ['prospective-student'] },
  { id: 'early-college-readiness', title: 'Early College & College Readiness', category: 'college-readiness', active: true, audiences: ['prospective-student'] },
  { id: 'tax-professional-certificate-i', title: 'Tax Professional Certificate I', category: 'tax-professional', active: true, audiences: ['prospective-student', 'new-hire'] },
  { id: 'tax-professional-certificate-ii', title: 'Tax Professional Certificate II', category: 'tax-professional', active: true, audiences: ['prospective-student', 'new-hire'] },
  { id: 'tax-practitioner-diploma', title: 'Tax Practitioner Diploma', category: 'tax-professional', active: true, audiences: ['prospective-student', 'new-hire'] },
  { id: 'enrolled-agent-prep', title: 'Enrolled Agent Preparation', category: 'tax-professional', active: true, audiences: ['prospective-student', 'new-hire'] }
];

export type EnrollmentInvite = {
  schemaVersion: '1.0';
  inviteId: string;
  audience: EnrollmentAudience;
  recipientName: string;
  recipientEmail: string;
  programId: string;
  programTitle: string;
  issuedAtUtc: string;
  expiresAtUtc: string;
  inviterLabel: string;
};

export type EnrollmentApplicationInput = {
  firstName?: unknown;
  lastName?: unknown;
  preferredName?: unknown;
  email?: unknown;
  phone?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  ageGroup?: unknown;
  guardianName?: unknown;
  guardianEmail?: unknown;
  previousSchoolOrEmployer?: unknown;
  educationLevel?: unknown;
  goals?: unknown;
  desiredRole?: unknown;
  workAuthorizationAttested?: unknown;
  accommodationsRequested?: unknown;
  accommodationsNotes?: unknown;
  typedSignature?: unknown;
  electronicSignatureConsent?: unknown;
  accuracyCertification?: unknown;
  privacyAcknowledgment?: unknown;
};

export type CanonicalEnrollmentApplication = {
  schemaVersion: '2.0';
  applicationId: string;
  inviteId: string;
  audience: EnrollmentAudience;
  status: 'signed-awaiting-delivery';
  program: { id: string; title: string };
  applicant: {
    firstName: string;
    lastName: string;
    preferredName: string | null;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postalCode: string;
    };
    ageGroup: AgeGroup;
    guardian: { name: string; email: string } | null;
    previousSchoolOrEmployer: string | null;
    educationLevel: string | null;
    goals: string | null;
    desiredRole: string | null;
    workAuthorizationAttested: boolean | null;
    accommodationsRequested: boolean;
    accommodationsNotes: string | null;
  };
  electronicSignature: {
    typedName: string;
    signedAtUtc: string;
    consentTextVersion: 'rtpu-esign-1.0';
    electronicSignatureConsent: true;
    accuracyCertification: true;
    privacyAcknowledgment: true;
    evidenceFingerprintSha256: string;
    integrityHmacSha256: string;
    requestEvidenceSha256Prefix: string;
  };
  createdAtUtc: string;
};

const signatureConsentText = 'I consent to use an electronic signature for this application and certify that the information provided is accurate to the best of my knowledge.';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function cleanString(value: unknown, field: string, max = 300) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(`${field} is required`);
  if (text.length > max) throw new Error(`${field} exceeds ${max} characters`);
  return text;
}

function optionalString(value: unknown, max = 1200) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  if (text.length > max) throw new Error(`field exceeds ${max} characters`);
  return text;
}

function normalizeEmail(value: unknown, field = 'email') {
  const email = cleanString(value, field, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${field} is invalid`);
  return email;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const source = value as Record<string, unknown>;
  return `{${Object.keys(source).sort().map((key) => `${JSON.stringify(key)}:${stableJson(source[key])}`).join(',')}}`;
}

function base64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function unbase64url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value: string, secretName: string) {
  return createHmac('sha256', requiredEnv(secretName)).update(value).digest('base64url');
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getEnrollmentProgram(programId: string) {
  return enrollmentPrograms.find((program) => program.id === programId && program.active) || null;
}

export function createEnrollmentInvite(input: {
  audience: unknown;
  recipientName: unknown;
  recipientEmail: unknown;
  programId: unknown;
  expiresDays?: unknown;
  inviterLabel?: unknown;
}) {
  const audience = input.audience === 'new-hire' ? 'new-hire' : input.audience === 'prospective-student' ? 'prospective-student' : null;
  if (!audience) throw new Error('audience must be prospective-student or new-hire');
  const programId = cleanString(input.programId, 'programId', 100);
  const program = getEnrollmentProgram(programId);
  if (!program || !program.audiences.includes(audience)) throw new Error('program is not available for this audience');
  const daysRaw = Number(input.expiresDays ?? 14);
  const expiresDays = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.round(daysRaw))) : 14;
  const issued = new Date();
  const expires = new Date(issued.getTime() + expiresDays * 86_400_000);
  const invite: EnrollmentInvite = {
    schemaVersion: '1.0',
    inviteId: randomUUID(),
    audience,
    recipientName: cleanString(input.recipientName, 'recipientName', 160),
    recipientEmail: normalizeEmail(input.recipientEmail, 'recipientEmail'),
    programId: program.id,
    programTitle: program.title,
    issuedAtUtc: issued.toISOString(),
    expiresAtUtc: expires.toISOString(),
    inviterLabel: optionalString(input.inviterLabel, 160) || 'Ross Tax Pro University Enrollment Office'
  };
  const payload = base64url(stableJson(invite));
  return { invite, token: `${payload}.${sign(payload, 'ENROLLMENT_INVITE_SECRET')}` };
}

export function verifyEnrollmentInvite(token: string) {
  const [payload, signature, extra] = String(token || '').split('.');
  if (!payload || !signature || extra) throw new Error('invite token is malformed');
  const expected = sign(payload, 'ENROLLMENT_INVITE_SECRET');
  if (!secureEqual(signature, expected)) throw new Error('invite token signature is invalid');
  let invite: EnrollmentInvite;
  try {
    invite = JSON.parse(unbase64url(payload)) as EnrollmentInvite;
  } catch {
    throw new Error('invite token payload is invalid');
  }
  if (!invite.inviteId || !invite.recipientEmail || !invite.programId || !invite.expiresAtUtc) throw new Error('invite token payload is incomplete');
  if (Date.parse(invite.expiresAtUtc) <= Date.now()) throw new Error('invite has expired');
  const program = getEnrollmentProgram(invite.programId);
  if (!program || program.title !== invite.programTitle || !program.audiences.includes(invite.audience)) throw new Error('invite program is no longer valid');
  return invite;
}

export function buildCanonicalEnrollmentApplication(
  invite: EnrollmentInvite,
  input: EnrollmentApplicationInput,
  requestEvidenceSource: string
): CanonicalEnrollmentApplication {
  const email = normalizeEmail(input.email);
  if (email !== invite.recipientEmail) throw new Error('application email must match the invitation recipient');
  const ageGroup: AgeGroup = input.ageGroup === 'under-18' ? 'under-18' : input.ageGroup === '18-plus' ? '18-plus' : (() => { throw new Error('ageGroup is required'); })();
  const guardian = ageGroup === 'under-18'
    ? { name: cleanString(input.guardianName, 'guardianName', 160), email: normalizeEmail(input.guardianEmail, 'guardianEmail') }
    : null;
  const desiredRole = invite.audience === 'new-hire' ? cleanString(input.desiredRole, 'desiredRole', 200) : optionalString(input.desiredRole, 200);
  const workAuthorizationAttested = invite.audience === 'new-hire' ? input.workAuthorizationAttested === true : null;
  if (invite.audience === 'new-hire' && workAuthorizationAttested !== true) throw new Error('new-hire applicants must complete the work authorization attestation');
  if (input.electronicSignatureConsent !== true) throw new Error('electronic signature consent is required');
  if (input.accuracyCertification !== true) throw new Error('accuracy certification is required');
  if (input.privacyAcknowledgment !== true) throw new Error('privacy acknowledgment is required');
  const typedSignature = cleanString(input.typedSignature, 'typedSignature', 180);
  const firstName = cleanString(input.firstName, 'firstName', 100);
  const lastName = cleanString(input.lastName, 'lastName', 100);
  const signedAtUtc = new Date().toISOString();
  const applicationId = randomUUID();
  const evidencePayload = {
    applicationId,
    inviteId: invite.inviteId,
    email,
    typedSignature,
    signedAtUtc,
    consentTextVersion: 'rtpu-esign-1.0',
    signatureConsentText,
    electronicSignatureConsent: true,
    accuracyCertification: true,
    privacyAcknowledgment: true
  };
  const evidenceFingerprintSha256 = createHmac('sha256', 'rtpu-public-fingerprint-v1').update(stableJson(evidencePayload)).digest('hex');
  const integrityHmacSha256 = createHmac('sha256', requiredEnv('ENROLLMENT_SIGNATURE_SECRET')).update(stableJson(evidencePayload)).digest('hex');
  const requestEvidenceSha256Prefix = createHmac('sha256', requiredEnv('ENROLLMENT_SIGNATURE_SECRET')).update(requestEvidenceSource).digest('hex').slice(0, 24);

  return {
    schemaVersion: '2.0',
    applicationId,
    inviteId: invite.inviteId,
    audience: invite.audience,
    status: 'signed-awaiting-delivery',
    program: { id: invite.programId, title: invite.programTitle },
    applicant: {
      firstName,
      lastName,
      preferredName: optionalString(input.preferredName, 100),
      email,
      phone: cleanString(input.phone, 'phone', 40),
      address: {
        line1: cleanString(input.addressLine1, 'addressLine1', 200),
        line2: optionalString(input.addressLine2, 200),
        city: cleanString(input.city, 'city', 100),
        state: cleanString(input.state, 'state', 100),
        postalCode: cleanString(input.postalCode, 'postalCode', 24)
      },
      ageGroup,
      guardian,
      previousSchoolOrEmployer: optionalString(input.previousSchoolOrEmployer, 240),
      educationLevel: optionalString(input.educationLevel, 200),
      goals: optionalString(input.goals, 2000),
      desiredRole,
      workAuthorizationAttested,
      accommodationsRequested: input.accommodationsRequested === true,
      accommodationsNotes: input.accommodationsRequested === true ? optionalString(input.accommodationsNotes, 1200) : null
    },
    electronicSignature: {
      typedName: typedSignature,
      signedAtUtc,
      consentTextVersion: 'rtpu-esign-1.0',
      electronicSignatureConsent: true,
      accuracyCertification: true,
      privacyAcknowledgment: true,
      evidenceFingerprintSha256,
      integrityHmacSha256,
      requestEvidenceSha256Prefix
    },
    createdAtUtc: signedAtUtc
  };
}

export function convertApplicationToRtpu(application: CanonicalEnrollmentApplication) {
  const recordType = application.audience === 'new-hire' ? 'new-hire-training-candidate' : 'student-enrollment-candidate';
  return {
    schemaVersion: '1.0',
    conversionId: `rtpu-${application.applicationId}`,
    destinationInstitution: 'Ross Tax Pro University',
    sourceApplicationId: application.applicationId,
    recordType,
    identity: {
      firstName: application.applicant.firstName,
      lastName: application.applicant.lastName,
      preferredName: application.applicant.preferredName,
      email: application.applicant.email,
      phone: application.applicant.phone
    },
    programEnrollment: {
      programId: application.program.id,
      programTitle: application.program.title,
      lifecycleStatus: 'application-received',
      admissionDecision: 'pending-review'
    },
    lmsProvisioning: {
      provider: 'google-classroom',
      provisioningStatus: 'pending-program-course-mapping-and-approval',
      intendedRole: application.audience === 'new-hire' ? 'learner-new-hire' : 'student',
      email: application.applicant.email,
      programId: application.program.id
    },
    employmentOnboarding: application.audience === 'new-hire'
      ? {
          desiredRole: application.applicant.desiredRole,
          workAuthorizationAttested: application.applicant.workAuthorizationAttested,
          note: 'I-9, W-4, payroll, background checks and other employment forms remain separate controlled workflows.'
        }
      : null,
    signatureEvidence: application.electronicSignature,
    convertedAtUtc: new Date().toISOString()
  };
}

export function createApplicationExportBundle(application: CanonicalEnrollmentApplication) {
  const converted = convertApplicationToRtpu(application);
  const payload = {
    schemaVersion: '1.0',
    exportType: 'rtpu-enrollment-application-package',
    source: 'Ross Tax Pro University Enrollment Conversion System',
    application,
    convertedRecord: converted,
    replication: {
      canonicalJsonReady: true,
      printableHtmlReady: true,
      lmsProvisioningPayloadReady: true,
      sourceApplicationRetainedInPackage: true
    }
  };
  const checksumSha256 = createHmac('sha256', 'rtpu-export-checksum-v1').update(stableJson(payload)).digest('hex');
  return { ...payload, checksumSha256, exportedAtUtc: new Date().toISOString() };
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderEnrollmentApplicationHtml(bundle: ReturnType<typeof createApplicationExportBundle>) {
  const app = bundle.application;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RTPU Application ${escapeHtml(app.applicationId)}</title><style>body{font-family:Arial,sans-serif;color:#111827;background:#f7f2e8;margin:0;padding:32px}.sheet{max-width:900px;margin:auto;background:#fff;border:1px solid #c9a227;padding:32px}.brand{background:#0b1f3a;color:#fff;padding:20px;margin:-32px -32px 26px}.brand h1{margin:4px 0}.label{font-size:12px;text-transform:uppercase;color:#8a6a10;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{border-bottom:1px solid #d1d5db;padding:8px 0}.sig{margin-top:24px;padding:16px;background:#f9fafb;border:1px solid #d1d5db}.mono{font-family:monospace;font-size:11px;word-break:break-all}@media print{body{background:#fff;padding:0}.sheet{border:0}}</style></head><body><main class="sheet"><header class="brand"><div>ROSS TAX PRO UNIVERSITY</div><h1>Enrollment / Program Application</h1><div>Application ID ${escapeHtml(app.applicationId)}</div></header><div class="grid"><div class="field"><div class="label">Applicant</div>${escapeHtml(`${app.applicant.firstName} ${app.applicant.lastName}`)}</div><div class="field"><div class="label">Audience</div>${escapeHtml(app.audience)}</div><div class="field"><div class="label">Program</div>${escapeHtml(app.program.title)}</div><div class="field"><div class="label">Email</div>${escapeHtml(app.applicant.email)}</div><div class="field"><div class="label">Phone</div>${escapeHtml(app.applicant.phone)}</div><div class="field"><div class="label">Age group</div>${escapeHtml(app.applicant.ageGroup)}</div></div><div class="field"><div class="label">Address</div>${escapeHtml(`${app.applicant.address.line1}${app.applicant.address.line2 ? `, ${app.applicant.address.line2}` : ''}, ${app.applicant.address.city}, ${app.applicant.address.state} ${app.applicant.address.postalCode}`)}</div><div class="field"><div class="label">Goals</div>${escapeHtml(app.applicant.goals || '')}</div>${app.applicant.desiredRole ? `<div class="field"><div class="label">Desired role</div>${escapeHtml(app.applicant.desiredRole)}</div>` : ''}<section class="sig"><div class="label">Electronic signature</div><strong>${escapeHtml(app.electronicSignature.typedName)}</strong><div>Signed ${escapeHtml(app.electronicSignature.signedAtUtc)}</div><div class="mono">Evidence fingerprint: ${escapeHtml(app.electronicSignature.evidenceFingerprintSha256)}</div><div class="mono">Integrity proof: ${escapeHtml(app.electronicSignature.integrityHmacSha256)}</div></section><p class="mono">Export checksum: ${escapeHtml(bundle.checksumSha256)}</p><p>This document is an application package generated from electronically submitted data. Admission, employment, financial aid, accreditation, licensing, and other external determinations remain subject to the applicable review process.</p></main></body></html>`;
}

export function enrollmentReadiness() {
  const inviteSecretConfigured = Boolean(process.env.ENROLLMENT_INVITE_SECRET);
  const signatureSecretConfigured = Boolean(process.env.ENROLLMENT_SIGNATURE_SECRET);
  const adminGateConfigured = Boolean(process.env.ENROLLMENT_ADMIN_KEY);
  const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY && process.env.ENROLLMENT_FROM_EMAIL);
  const submissionWebhookConfigured = Boolean(process.env.ENROLLMENT_SUBMISSION_WEBHOOK_URL);
  const exportEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.ENROLLMENT_FROM_EMAIL && process.env.ENROLLMENT_RECEIVER_EMAIL);
  const submissionDestinationConfigured = submissionWebhookConfigured || exportEmailConfigured;
  return {
    schemaVersion: '1.0',
    inviteSecretConfigured,
    signatureSecretConfigured,
    adminGateConfigured,
    emailProviderConfigured,
    submissionWebhookConfigured,
    exportEmailConfigured,
    submissionDestinationConfigured,
    durableApplicationDatabaseConfigured: false,
    forms: {
      inviteForm: true,
      prospectiveStudentApplication: true,
      newHireApplication: true,
      minorGuardianFields: true,
      electronicSignatureCapture: true,
      canonicalConversion: true,
      jsonExport: true,
      printableHtmlExport: true,
      lmsProvisioningPayload: true
    },
    productionSubmissionReady: inviteSecretConfigured && signatureSecretConfigured && adminGateConfigured && submissionDestinationConfigured,
    note: submissionDestinationConfigured
      ? 'Applications can be dispatched to the configured RTPU destination.'
      : 'Forms and conversion are available, but final submission must fail closed until a webhook or institutional email destination is configured.'
  };
}
