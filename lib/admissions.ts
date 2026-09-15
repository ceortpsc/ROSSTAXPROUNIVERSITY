import { createHash, randomUUID } from 'node:crypto';

export type ApplicationTrack =
  | 'prospective-student'
  | 'transfer-student'
  | 'foreign-exchange-student'
  | 'rtpsc-new-hire-student'
  | 'valid-ptin-holder';

export type ClearanceStatus = 'not-started' | 'pending' | 'received' | 'verified' | 'waived' | 'not-applicable' | 'needs-review';

export const admissionsRequirementCatalog = {
  schemaVersion: '1.0',
  institution: 'Ross Tax Pro University',
  policyNotice: 'Institution-standardized admissions controls. External legal, immigration, financial-aid, licensing, employment and accreditation requirements remain subject to the governing authority and must not be represented as verified until evidence is received.',
  universal: [
    'identity-and-contact-data',
    'program-selection',
    'education-history',
    'electronic-signature-and-certification',
    'privacy-acknowledgment',
    'admissions-review'
  ],
  tracks: {
    'prospective-student': ['education-history', 'reference-check-if-required', 'financial-aid-clearance-if-applicable'],
    'transfer-student': ['prior-education-verification', 'official-transcript-review', 'transfer-credit-evaluation', 'reference-check-if-required', 'financial-aid-clearance-if-applicable'],
    'foreign-exchange-student': ['home-institution-verification', 'exchange-sponsor-review', 'international-document-review', 'english-readiness-review-if-applicable', 'financial-aid-clearance-if-applicable'],
    'rtpsc-new-hire-student': ['employment-history-check', 'reference-check', 'work-authorization-attestation', 'separate-i9-workflow', 'separate-payroll-tax-workflow'],
    'valid-ptin-holder': ['ptin-format-check', 'ptin-independent-verification', 'prior-tax-education-review', 'professional-reference-check-if-required']
  }
} as const;

export const taxPractitionerDiploma4Semester = {
  schemaVersion: '1.0',
  programId: 'tax-practitioner-4-semester-diploma',
  title: 'Tax Practitioner Diploma — 4 Semester Program',
  credential: 'Institutional Diploma',
  admissionTracks: ['prospective-student', 'rtpsc-new-hire-student', 'valid-ptin-holder'],
  semesters: [
    {
      number: 1,
      title: 'Foundations & Individual Taxation',
      modules: ['Tax law foundations', 'Form 1040 workflow', 'Filing status and dependents', 'Income and adjustments', 'Credits and due diligence', 'Ethics and records']
    },
    {
      number: 2,
      title: 'Business, Payroll & Applied Tax Preparation',
      modules: ['Schedule C', 'Business expenses and records', 'Depreciation fundamentals', 'Payroll fundamentals', 'Information returns', 'Applied tax preparation cases']
    },
    {
      number: 3,
      title: 'ERO Operations, e-File & Practice Security',
      modules: ['ERO responsibilities', 'IRS e-file workflow', 'MeF concepts', 'Identity verification', 'Security and WISP principles', 'Practice operations and quality control']
    },
    {
      number: 4,
      title: 'Representation, Notices, Collections & Capstone',
      modules: ['IRS notices and response workflow', 'Transcript interpretation fundamentals', 'Collections overview', 'Representation boundaries', 'Research and documentation', 'Capstone practicum']
    }
  ],
  ptinTrack: {
    acceptedFormat: 'P########',
    applicantAttestationRequired: true,
    independentVerificationRequired: true,
    automaticAdmissionOnFormatMatch: false,
    note: 'A correctly formatted PTIN is not proof of current validity. Verification status remains pending until checked through an authorized process.'
  },
  regulatoryNotice: 'This is an institutional education program. It does not itself confer IRS enrollment, EA status, CPA licensure, attorney status, or any government credential.'
} as const;

export type AdmissionsVerificationInput = {
  applicationId?: unknown;
  track?: unknown;
  applicantName?: unknown;
  applicantEmail?: unknown;
  references?: unknown;
  employmentHistory?: unknown;
  priorEducation?: unknown;
  fafsa?: unknown;
  transcriptConsent?: unknown;
  referenceCheckConsent?: unknown;
  employmentCheckConsent?: unknown;
  educationVerificationConsent?: unknown;
};

function text(value: unknown, field: string, max = 500) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result) throw new Error(`${field} is required`);
  if (result.length > max) throw new Error(`${field} exceeds ${max} characters`);
  return result;
}

function optionalText(value: unknown, max = 1000) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result) return null;
  if (result.length > max) throw new Error(`field exceeds ${max} characters`);
  return result;
}

function email(value: unknown, field: string) {
  const result = text(value, field, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error(`${field} is invalid`);
  return result;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeReferences(value: unknown) {
  return asArray(value).slice(0, 4).map((item, index) => {
    const source = (item || {}) as Record<string, unknown>;
    return {
      referenceId: `ref-${index + 1}`,
      name: text(source.name, `references[${index}].name`, 160),
      relationship: text(source.relationship, `references[${index}].relationship`, 160),
      email: source.email ? email(source.email, `references[${index}].email`) : null,
      phone: optionalText(source.phone, 40),
      organization: optionalText(source.organization, 200),
      permissionToContact: source.permissionToContact === true,
      status: 'pending' as ClearanceStatus
    };
  });
}

function normalizeEmployment(value: unknown) {
  return asArray(value).slice(0, 8).map((item, index) => {
    const source = (item || {}) as Record<string, unknown>;
    return {
      employmentId: `emp-${index + 1}`,
      employer: text(source.employer, `employmentHistory[${index}].employer`, 240),
      role: optionalText(source.role, 200),
      startDate: optionalText(source.startDate, 40),
      endDate: optionalText(source.endDate, 40),
      supervisorName: optionalText(source.supervisorName, 160),
      supervisorEmail: source.supervisorEmail ? email(source.supervisorEmail, `employmentHistory[${index}].supervisorEmail`) : null,
      supervisorPhone: optionalText(source.supervisorPhone, 40),
      permissionToContact: source.permissionToContact === true,
      status: 'pending' as ClearanceStatus
    };
  });
}

function normalizeEducation(value: unknown) {
  return asArray(value).slice(0, 8).map((item, index) => {
    const source = (item || {}) as Record<string, unknown>;
    return {
      educationId: `edu-${index + 1}`,
      institution: text(source.institution, `priorEducation[${index}].institution`, 240),
      cityStateCountry: optionalText(source.cityStateCountry, 240),
      level: optionalText(source.level, 160),
      programOrMajor: optionalText(source.programOrMajor, 240),
      attendanceStart: optionalText(source.attendanceStart, 40),
      attendanceEnd: optionalText(source.attendanceEnd, 40),
      credentialEarned: optionalText(source.credentialEarned, 240),
      transcriptRequested: source.transcriptRequested === true,
      verificationStatus: 'pending' as ClearanceStatus,
      transferCreditStatus: 'pending' as ClearanceStatus
    };
  });
}

function normalizeFafsa(value: unknown) {
  const source = (value || {}) as Record<string, unknown>;
  const allowed = new Set(['not-applicable', 'not-started', 'submitted-awaiting-school', 'school-code-added', 'verification-required', 'institutional-clearance-complete']);
  const status = typeof source.status === 'string' && allowed.has(source.status) ? source.status : 'not-started';
  return {
    requested: source.requested === true,
    status,
    aidYear: optionalText(source.aidYear, 20),
    schoolCodeAddedAttestation: source.schoolCodeAddedAttestation === true,
    verificationDocumentsOutstanding: source.verificationDocumentsOutstanding === true,
    institutionalClearanceNote: optionalText(source.institutionalClearanceNote, 500),
    prohibitedDataNotice: 'Do not store FAFSA login credentials, FSA ID credentials, Social Security numbers, tax-return data, or bank data in this enrollment record.'
  };
}

export function createAdmissionsVerificationRecord(input: AdmissionsVerificationInput) {
  const track = String(input.track || '') as ApplicationTrack;
  if (!(track in admissionsRequirementCatalog.tracks)) throw new Error('track is invalid');
  const references = normalizeReferences(input.references);
  const employmentHistory = normalizeEmployment(input.employmentHistory);
  const priorEducation = normalizeEducation(input.priorEducation);
  const fafsa = normalizeFafsa(input.fafsa);

  if ((track === 'rtpsc-new-hire-student') && input.employmentCheckConsent !== true) throw new Error('employment check consent is required for RTPSC new-hire applications');
  if ((track === 'transfer-student' || track === 'foreign-exchange-student') && input.educationVerificationConsent !== true) throw new Error('education verification consent is required for this application track');

  const record = {
    schemaVersion: '1.0',
    verificationRecordId: randomUUID(),
    applicationId: text(input.applicationId, 'applicationId', 100),
    track,
    applicant: { name: text(input.applicantName, 'applicantName', 200), email: email(input.applicantEmail, 'applicantEmail') },
    consents: {
      transcriptConsent: input.transcriptConsent === true,
      referenceCheckConsent: input.referenceCheckConsent === true,
      employmentCheckConsent: input.employmentCheckConsent === true,
      educationVerificationConsent: input.educationVerificationConsent === true
    },
    references,
    employmentHistory,
    priorEducation,
    fafsa,
    clearances: {
      referenceCheck: references.length ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      employmentCheck: track === 'rtpsc-new-hire-student' ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      priorEducationCheck: priorEducation.length ? 'pending' as ClearanceStatus : 'needs-review' as ClearanceStatus,
      transcriptCheck: track === 'transfer-student' ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      foreignExchangeReview: track === 'foreign-exchange-student' ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      fafsaClearance: fafsa.requested ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      ptinVerification: track === 'valid-ptin-holder' ? 'pending' as ClearanceStatus : 'not-applicable' as ClearanceStatus,
      admissionsDecision: 'pending' as ClearanceStatus
    },
    createdAtUtc: new Date().toISOString()
  };

  return {
    ...record,
    evidenceSha256: createHash('sha256').update(JSON.stringify(record)).digest('hex')
  };
}

export function admissionsSeedSnapshot() {
  return {
    schemaVersion: '1.0',
    requirementCatalog: admissionsRequirementCatalog,
    taxPractitionerDiploma4Semester,
    forms: [
      'institutional-application',
      'transfer-student-application',
      'foreign-exchange-student-application',
      'rtpsc-new-hire-student-application',
      'valid-ptin-holder-practitioner-application',
      'reference-check-authorization',
      'employment-verification-authorization',
      'prior-education-verification-authorization',
      'transcript-release-and-evaluation',
      'fafsa-clearance-status',
      'admissions-clearance-checklist',
      'electronic-signature-evidence'
    ]
  };
}
