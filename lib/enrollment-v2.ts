import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export type EnrollmentAudience =
  | 'prospective-student'
  | 'transfer-student'
  | 'foreign-exchange-student'
  | 'rtpsc-new-hire-student'
  | 'valid-ptin-holder';

export type AgeGroup = 'under-18' | '18-plus';

export type EnrollmentProgram = {
  id: string;
  title: string;
  category: 'secondary' | 'college-readiness' | 'tax-professional' | 'workforce-training';
  active: boolean;
  audiences: EnrollmentAudience[];
  semesters?: number;
  credential?: string;
  eligibilityNotes?: string[];
};

export const enrollmentPrograms: EnrollmentProgram[] = [
  { id: 'adult-hs-diploma', title: 'Adult Education High School Diploma', category: 'secondary', active: true, audiences: ['prospective-student', 'transfer-student'] },
  { id: 'texas-homeschool-diploma', title: 'Texas Homeschool Diploma', category: 'secondary', active: true, audiences: ['prospective-student', 'transfer-student'] },
  { id: 'early-college-readiness', title: 'Early College & College Readiness', category: 'college-readiness', active: true, audiences: ['prospective-student', 'transfer-student', 'foreign-exchange-student'] },
  { id: 'foreign-exchange-academic-track', title: 'Foreign Exchange Academic Track', category: 'college-readiness', active: true, audiences: ['foreign-exchange-student'], eligibilityNotes: ['Institutional review and any applicable immigration/sponsor documentation are separate controlled processes.'] },
  { id: 'rtpsc-new-hire-tax-training', title: 'RTPSC New Hire Tax Practitioner Training', category: 'workforce-training', active: true, audiences: ['rtpsc-new-hire-student'] },
  { id: 'tax-professional-certificate-i', title: 'Tax Professional Certificate I', category: 'tax-professional', active: true, audiences: ['prospective-student', 'transfer-student', 'rtpsc-new-hire-student', 'valid-ptin-holder'] },
  { id: 'tax-professional-certificate-ii', title: 'Tax Professional Certificate II', category: 'tax-professional', active: true, audiences: ['prospective-student', 'transfer-student', 'rtpsc-new-hire-student', 'valid-ptin-holder'] },
  { id: 'tax-practitioner-4-semester-diploma', title: 'Tax Practitioner Diploma — 4 Semester Program', category: 'tax-professional', active: true, audiences: ['valid-ptin-holder', 'rtpsc-new-hire-student', 'prospective-student'], semesters: 4, credential: 'Institutional Diploma', eligibilityNotes: ['PTIN-holder track requires a PTIN in P######## format and applicant attestation. PTIN status remains pending verification until independently confirmed.'] },
  { id: 'enrolled-agent-prep', title: 'Enrolled Agent Preparation', category: 'tax-professional', active: true, audiences: ['prospective-student', 'rtpsc-new-hire-student', 'valid-ptin-holder'] }
];

export type EnrollmentInvite = {
  schemaVersion: '2.0';
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

export type EnrollmentApplicationInput = Record<string, unknown>;

export type CanonicalEnrollmentApplication = {
  schemaVersion: '3.0';
  applicationId: string;
  inviteId: string;
  audience: EnrollmentAudience;
  status: 'signed-awaiting-delivery';
  program: { id: string; title: string; semesters: number | null; credential: string | null };
  applicant: {
    firstName: string;
    lastName: string;
    preferredName: string | null;
    email: string;
    phone: string;
    address: { line1: string; line2: string | null; city: string; state: string; postalCode: string; country: string };
    ageGroup: AgeGroup;
    guardian: { name: string; email: string } | null;
    previousSchoolOrEmployer: string | null;
    educationLevel: string | null;
    goals: string | null;
    accommodationsRequested: boolean;
    accommodationsNotes: string | null;
  };
  transferStudent: null | {
    transferInstitution: string;
    transferProgram: string | null;
    creditsAttempted: number | null;
    creditsCompleted: number | null;
    transcriptRequested: boolean;
    transcriptEvaluationStatus: 'pending-review';
  };
  foreignExchange: null | {
    homeCountry: string;
    homeInstitution: string;
    exchangeSponsor: string | null;
    currentVisaOrProgramStatus: string;
    plannedStartTerm: string;
    immigrationDocumentReviewStatus: 'separate-controlled-review';
  };
  rtpscNewHire: null | {
    desiredRole: string;
    workAuthorizationAttested: true;
    employeeOrCandidateId: string | null;
    onboardingStatus: 'training-application-received';
  };
  ptinHolder: null | {
    ptin: string;
    applicantAttestedActive: true;
    formatValidated: true;
    verificationStatus: 'pending-independent-verification';
  };
  electronicSignature: {
    typedName: string;
    signedAtUtc: string;
    consentTextVersion: 'rtpu-esign-2.0';
    electronicSignatureConsent: true;
    accuracyCertification: true;
    privacyAcknowledgment: true;
    evidenceFingerprintSha256: string;
    integrityHmacSha256: string;
    requestEvidenceSha256Prefix: string;
  };
  createdAtUtc: string;
};

const allowedAudiences = new Set<EnrollmentAudience>([
  'prospective-student',
  'transfer-student',
  'foreign-exchange-student',
  'rtpsc-new-hire-student',
  'valid-ptin-holder'
]);

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

function optionalNumber(value: unknown, field: string) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number`);
  return number;
}

function normalizeEmail(value: unknown, field = 'email') {
  const email = cleanString(value, field, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${field} is invalid`);
  return email;
}

function normalizePtin(value: unknown) {
  const ptin = cleanString(value, 'ptin', 9).toUpperCase();
  if (!/^P\d{8}$/.test(ptin)) throw new Error('ptin must use the IRS PTIN format P########');
  return ptin;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const source = value as Record<string, unknown>;
  return `{${Object.keys(source).sort().map((key) => `${JSON.stringify(key)}:${stableJson(source[key])}`).join(',')}}`;
}

function base64url(value: string) { return Buffer.from(value, 'utf8').toString('base64url'); }
function unbase64url(value: string) { return Buffer.from(value, 'base64url').toString('utf8'); }
function sign(value: string, secretName: string) { return createHmac('sha256', requiredEnv(secretName)).update(value).digest('base64url'); }
function secureEqual(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }

export function getEnrollmentProgram(programId: string) {
  return enrollmentPrograms.find((program) => program.id === programId && program.active) || null;
}

export function createEnrollmentInvite(input: Record<string, unknown>) {
  const audience = String(input.audience || '') as EnrollmentAudience;
  if (!allowedAudiences.has(audience)) throw new Error('unsupported enrollment audience');
  const programId = cleanString(input.programId, 'programId', 120);
  const program = getEnrollmentProgram(programId);
  if (!program || !program.audiences.includes(audience)) throw new Error('program is not available for this audience');
  const daysRaw = Number(input.expiresDays ?? 14);
  const expiresDays = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.round(daysRaw))) : 14;
  const issued = new Date();
  const invite: EnrollmentInvite = {
    schemaVersion: '2.0',
    inviteId: randomUUID(),
    audience,
    recipientName: cleanString(input.recipientName, 'recipientName', 160),
    recipientEmail: normalizeEmail(input.recipientEmail, 'recipientEmail'),
    programId: program.id,
    programTitle: program.title,
    issuedAtUtc: issued.toISOString(),
    expiresAtUtc: new Date(issued.getTime() + expiresDays * 86_400_000).toISOString(),
    inviterLabel: optionalString(input.inviterLabel, 160) || 'Ross Tax Pro University Enrollment Office'
  };
  const payload = base64url(stableJson(invite));
  return { invite, token: `${payload}.${sign(payload, 'ENROLLMENT_INVITE_SECRET')}` };
}

export function verifyEnrollmentInvite(token: string) {
  const [payload, signature, extra] = String(token || '').split('.');
  if (!payload || !signature || extra) throw new Error('invite token is malformed');
  if (!secureEqual(signature, sign(payload, 'ENROLLMENT_INVITE_SECRET'))) throw new Error('invite token signature is invalid');
  let invite: EnrollmentInvite;
  try { invite = JSON.parse(unbase64url(payload)) as EnrollmentInvite; } catch { throw new Error('invite token payload is invalid'); }
  if (!allowedAudiences.has(invite.audience) || !invite.inviteId || !invite.recipientEmail || !invite.programId) throw new Error('invite token payload is incomplete');
  if (Date.parse(invite.expiresAtUtc) <= Date.now()) throw new Error('invite has expired');
  const program = getEnrollmentProgram(invite.programId);
  if (!program || program.title !== invite.programTitle || !program.audiences.includes(invite.audience)) throw new Error('invite program is no longer valid');
  return invite;
}

export function buildCanonicalEnrollmentApplication(invite: EnrollmentInvite, input: EnrollmentApplicationInput, requestEvidenceSource: string): CanonicalEnrollmentApplication {
  const email = normalizeEmail(input.email);
  if (email !== invite.recipientEmail) throw new Error('application email must match the invitation recipient');
  const program = getEnrollmentProgram(invite.programId);
  if (!program) throw new Error('program is no longer active');
  const ageGroup: AgeGroup = input.ageGroup === 'under-18' ? 'under-18' : input.ageGroup === '18-plus' ? '18-plus' : (() => { throw new Error('ageGroup is required'); })();
  const guardian = ageGroup === 'under-18'
    ? { name: cleanString(input.guardianName, 'guardianName', 160), email: normalizeEmail(input.guardianEmail, 'guardianEmail') }
    : null;

  const transferStudent = invite.audience === 'transfer-student' ? {
    transferInstitution: cleanString(input.transferInstitution, 'transferInstitution', 240),
    transferProgram: optionalString(input.transferProgram, 240),
    creditsAttempted: optionalNumber(input.creditsAttempted, 'creditsAttempted'),
    creditsCompleted: optionalNumber(input.creditsCompleted, 'creditsCompleted'),
    transcriptRequested: input.transcriptRequested === true,
    transcriptEvaluationStatus: 'pending-review' as const
  } : null;

  const foreignExchange = invite.audience === 'foreign-exchange-student' ? {
    homeCountry: cleanString(input.homeCountry, 'homeCountry', 120),
    homeInstitution: cleanString(input.homeInstitution, 'homeInstitution', 240),
    exchangeSponsor: optionalString(input.exchangeSponsor, 240),
    currentVisaOrProgramStatus: cleanString(input.currentVisaOrProgramStatus, 'currentVisaOrProgramStatus', 160),
    plannedStartTerm: cleanString(input.plannedStartTerm, 'plannedStartTerm', 100),
    immigrationDocumentReviewStatus: 'separate-controlled-review' as const
  } : null;

  const rtpscNewHire = invite.audience === 'rtpsc-new-hire-student' ? {
    desiredRole: cleanString(input.desiredRole, 'desiredRole', 200),
    workAuthorizationAttested: input.workAuthorizationAttested === true ? true as const : (() => { throw new Error('work authorization attestation is required'); })(),
    employeeOrCandidateId: optionalString(input.employeeOrCandidateId, 100),
    onboardingStatus: 'training-application-received' as const
  } : null;

  const ptinRequired = invite.audience === 'valid-ptin-holder';
  const ptinHolder = ptinRequired ? {
    ptin: normalizePtin(input.ptin),
    applicantAttestedActive: input.ptinActiveAttestation === true ? true as const : (() => { throw new Error('PTIN active-status attestation is required'); })(),
    formatValidated: true as const,
    verificationStatus: 'pending-independent-verification' as const
  } : null;

  if (input.electronicSignatureConsent !== true) throw new Error('electronic signature consent is required');
  if (input.accuracyCertification !== true) throw new Error('accuracy certification is required');
  if (input.privacyAcknowledgment !== true) throw new Error('privacy acknowledgment is required');

  const typedSignature = cleanString(input.typedSignature, 'typedSignature', 180);
  const firstName = cleanString(input.firstName, 'firstName', 100);
  const lastName = cleanString(input.lastName, 'lastName', 100);
  const signedAtUtc = new Date().toISOString();
  const applicationId = randomUUID();
  const evidencePayload = { applicationId, inviteId: invite.inviteId, email, typedSignature, signedAtUtc, audience: invite.audience, programId: invite.programId };
  const evidenceFingerprintSha256 = createHmac('sha256', 'rtpu-public-fingerprint-v2').update(stableJson(evidencePayload)).digest('hex');
  const integrityHmacSha256 = createHmac('sha256', requiredEnv('ENROLLMENT_SIGNATURE_SECRET')).update(stableJson(evidencePayload)).digest('hex');
  const requestEvidenceSha256Prefix = createHmac('sha256', requiredEnv('ENROLLMENT_SIGNATURE_SECRET')).update(requestEvidenceSource).digest('hex').slice(0, 24);

  return {
    schemaVersion: '3.0',
    applicationId,
    inviteId: invite.inviteId,
    audience: invite.audience,
    status: 'signed-awaiting-delivery',
    program: { id: program.id, title: program.title, semesters: program.semesters ?? null, credential: program.credential ?? null },
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
        postalCode: cleanString(input.postalCode, 'postalCode', 24),
        country: cleanString(input.country || 'United States', 'country', 120)
      },
      ageGroup,
      guardian,
      previousSchoolOrEmployer: optionalString(input.previousSchoolOrEmployer, 240),
      educationLevel: optionalString(input.educationLevel, 200),
      goals: optionalString(input.goals, 2000),
      accommodationsRequested: input.accommodationsRequested === true,
      accommodationsNotes: input.accommodationsRequested === true ? optionalString(input.accommodationsNotes, 1200) : null
    },
    transferStudent,
    foreignExchange,
    rtpscNewHire,
    ptinHolder,
    electronicSignature: {
      typedName: typedSignature,
      signedAtUtc,
      consentTextVersion: 'rtpu-esign-2.0',
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
  const intendedRole = application.audience === 'rtpsc-new-hire-student' ? 'learner-new-hire' : 'student';
  return {
    schemaVersion: '2.0',
    conversionId: `rtpu-${application.applicationId}`,
    destinationInstitution: 'Ross Tax Pro University',
    sourceApplicationId: application.applicationId,
    recordType: application.audience,
    identity: {
      firstName: application.applicant.firstName,
      lastName: application.applicant.lastName,
      preferredName: application.applicant.preferredName,
      email: application.applicant.email,
      phone: application.applicant.phone
    },
    programEnrollment: {
      ...application.program,
      lifecycleStatus: 'application-received',
      admissionDecision: 'pending-review'
    },
    transferEvaluation: application.transferStudent,
    foreignExchangeReview: application.foreignExchange,
    employmentOnboarding: application.rtpscNewHire,
    practitionerCredentialReview: application.ptinHolder,
    lmsProvisioning: {
      provider: 'google-classroom',
      provisioningStatus: 'pending-program-course-mapping-and-approval',
      intendedRole,
      email: application.applicant.email,
      programId: application.program.id
    },
    signatureEvidence: application.electronicSignature,
    convertedAtUtc: new Date().toISOString()
  };
}

export function createApplicationExportBundle(application: CanonicalEnrollmentApplication) {
  const converted = convertApplicationToRtpu(application);
  const payload = {
    schemaVersion: '2.0',
    exportType: 'rtpu-enrollment-application-package',
    source: 'Ross Tax Pro University Enrollment Conversion System',
    application,
    convertedRecord: converted,
    replication: {
      canonicalJsonReady: true,
      printableHtmlReady: true,
      lmsProvisioningPayloadReady: true,
      sourceApplicationRetainedInPackage: true,
      transferEvaluationPayloadReady: Boolean(application.transferStudent),
      foreignExchangeReviewPayloadReady: Boolean(application.foreignExchange),
      employmentTrainingPayloadReady: Boolean(application.rtpscNewHire),
      ptinReviewPayloadReady: Boolean(application.ptinHolder)
    }
  };
  const checksumSha256 = createHmac('sha256', 'rtpu-export-checksum-v2').update(stableJson(payload)).digest('hex');
  return { ...payload, checksumSha256, exportedAtUtc: new Date().toISOString() };
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function renderEnrollmentApplicationHtml(bundle: ReturnType<typeof createApplicationExportBundle>) {
  const app = bundle.application;
  const special = app.transferStudent
    ? `<div class="field"><div class="label">Transfer institution</div>${escapeHtml(app.transferStudent.transferInstitution)}</div>`
    : app.foreignExchange
      ? `<div class="field"><div class="label">Home country / institution</div>${escapeHtml(app.foreignExchange.homeCountry)} — ${escapeHtml(app.foreignExchange.homeInstitution)}</div>`
      : app.rtpscNewHire
        ? `<div class="field"><div class="label">RTPSC role</div>${escapeHtml(app.rtpscNewHire.desiredRole)}</div>`
        : app.ptinHolder
          ? `<div class="field"><div class="label">PTIN</div>${escapeHtml(app.ptinHolder.ptin)} — ${escapeHtml(app.ptinHolder.verificationStatus)}</div>`
          : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RTPU Application ${escapeHtml(app.applicationId)}</title><style>body{font-family:Arial,sans-serif;color:#111827;background:#f7f2e8;margin:0;padding:32px}.sheet{max-width:900px;margin:auto;background:#fff;border:1px solid #c9a227;padding:32px}.brand{background:#0b1f3a;color:#fff;padding:20px;margin:-32px -32px 26px}.brand h1{margin:4px 0}.label{font-size:12px;text-transform:uppercase;color:#8a6a10;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{border-bottom:1px solid #d1d5db;padding:8px 0}.sig{margin-top:24px;padding:16px;background:#f9fafb;border:1px solid #d1d5db}.mono{font-family:monospace;font-size:11px;word-break:break-all}@media print{body{background:#fff;padding:0}.sheet{border:0}}</style></head><body><main class="sheet"><header class="brand"><div>ROSS TAX PRO UNIVERSITY</div><h1>Enrollment / Program Application</h1><div>Application ID ${escapeHtml(app.applicationId)}</div></header><div class="grid"><div class="field"><div class="label">Applicant</div>${escapeHtml(`${app.applicant.firstName} ${app.applicant.lastName}`)}</div><div class="field"><div class="label">Application track</div>${escapeHtml(app.audience)}</div><div class="field"><div class="label">Program</div>${escapeHtml(app.program.title)}</div><div class="field"><div class="label">Email</div>${escapeHtml(app.applicant.email)}</div>${special}</div><section class="sig"><div class="label">Electronic signature</div><strong>${escapeHtml(app.electronicSignature.typedName)}</strong><div>Signed ${escapeHtml(app.electronicSignature.signedAtUtc)}</div><div class="mono">Evidence fingerprint: ${escapeHtml(app.electronicSignature.evidenceFingerprintSha256)}</div><div class="mono">Integrity proof: ${escapeHtml(app.electronicSignature.integrityHmacSha256)}</div></section><p class="mono">Export checksum: ${escapeHtml(bundle.checksumSha256)}</p><p>Admission, transfer-credit acceptance, exchange-program eligibility, employment, PTIN validity, licensing, and external regulatory determinations remain subject to the applicable independent review process.</p></main></body></html>`;
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
    schemaVersion: '2.0',
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
      transferStudentApplication: true,
      foreignExchangeStudentApplication: true,
      rtpscNewHireStudentApplication: true,
      validPtinHolderApplication: true,
      fourSemesterTaxPractitionerDiploma: true,
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
      : 'Forms and conversion are live, but final submission fails closed until a webhook or institutional email destination is configured.'
  };
}
