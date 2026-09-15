import { createHash, randomUUID } from 'node:crypto';

export type ScreeningPurpose = 'employment' | 'education-program-safety' | 'credentialing-review';
export type ScreeningLevel = 'federal' | 'state' | 'county';

export const usStateAndTerritoryCodes = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','AS','GU','MP','PR','VI'
] as const;

export const backgroundScreeningPolicy = {
  schemaVersion: '1.0',
  institution: 'Ross Tax Pro University / Ross Tax Pro Software Co.',
  purpose: 'Authorization and workflow evidence only. This module does not itself retrieve criminal, credit, driving, medical, genetic, or other consumer-report data.',
  controls: {
    writtenAuthorizationRequired: true,
    standaloneDisclosureRequiredForThirdPartyConsumerReports: true,
    adverseActionWorkflowRequiredWhenApplicable: true,
    equalTreatmentRequired: true,
    stateAndLocalLawReviewRequired: true,
    automatedAdmissionOrEmploymentDenialFromScreeningData: false,
    medicalOrGeneticInformationCollection: false,
    ssnCollectionInGeneralEnrollmentForm: false,
    governmentIdDocumentCollectionInGeneralEnrollmentForm: false,
    minorScreeningRequiresSeparateLegalReview: true
  },
  jurisdictionModel: {
    federal: true,
    stateAndTerritoryCodes: usStateAndTerritoryCodes,
    countyCoverage: 'provider-and-jurisdiction-derived-by-state-or-FIPS',
    nationwideCountyClaimAllowedWithoutProviderEvidence: false
  }
} as const;

export type BackgroundAuthorizationInput = {
  applicationId?: unknown;
  applicantName?: unknown;
  applicantEmail?: unknown;
  ageGroup?: unknown;
  purpose?: unknown;
  requestedLevels?: unknown;
  requestedStates?: unknown;
  requestedCounties?: unknown;
  authorizationConsent?: unknown;
  disclosureAcknowledgment?: unknown;
  continuousAuthorizationRequested?: unknown;
  typedSignature?: unknown;
  signedDate?: unknown;
  guardianName?: unknown;
  guardianConsent?: unknown;
  minorLegalReviewComplete?: unknown;
};

function requiredText(value: unknown, field: string, max = 300) {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result) throw new Error(`${field} is required`);
  if (result.length > max) throw new Error(`${field} exceeds ${max} characters`);
  return result;
}

function validEmail(value: unknown) {
  const result = requiredText(value, 'applicantEmail', 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('applicantEmail is invalid');
  return result;
}

function stringArray(value: unknown, max = 500) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, max) : [];
}

export function createBackgroundAuthorization(input: BackgroundAuthorizationInput) {
  const purpose = String(input.purpose || '') as ScreeningPurpose;
  if (!['employment','education-program-safety','credentialing-review'].includes(purpose)) throw new Error('purpose is invalid');
  const ageGroup = input.ageGroup === 'under-18' ? 'under-18' : input.ageGroup === '18-plus' ? '18-plus' : (() => { throw new Error('ageGroup is required'); })();
  const requestedLevels = stringArray(input.requestedLevels, 3).filter((item): item is ScreeningLevel => ['federal','state','county'].includes(item));
  if (!requestedLevels.length) throw new Error('at least one screening level is required');
  const requestedStates = stringArray(input.requestedStates, usStateAndTerritoryCodes.length).map((item) => item.toUpperCase());
  const invalidStates = requestedStates.filter((code) => !(usStateAndTerritoryCodes as readonly string[]).includes(code));
  if (invalidStates.length) throw new Error(`unsupported state or territory codes: ${invalidStates.join(', ')}`);
  const requestedCounties = stringArray(input.requestedCounties, 500);
  if (requestedLevels.includes('county') && !requestedCounties.length) throw new Error('county-level scope requires named county/state or FIPS entries');
  if (input.authorizationConsent !== true || input.disclosureAcknowledgment !== true) throw new Error('written authorization and disclosure acknowledgment are required');
  if (ageGroup === 'under-18') {
    if (input.guardianConsent !== true || !String(input.guardianName || '').trim()) throw new Error('guardian authorization is required for a minor');
    if (input.minorLegalReviewComplete !== true) throw new Error('minor background screening is blocked until separate jurisdiction-specific legal review is complete');
  }
  const record = {
    schemaVersion: '1.0',
    authorizationId: randomUUID(),
    applicationId: requiredText(input.applicationId, 'applicationId', 100),
    applicant: {
      name: requiredText(input.applicantName, 'applicantName', 200),
      email: validEmail(input.applicantEmail),
      ageGroup
    },
    purpose,
    requestedScope: {
      levels: requestedLevels,
      federal: requestedLevels.includes('federal'),
      states: requestedStates,
      counties: requestedCounties,
      countyCoverageStatus: requestedLevels.includes('county') ? 'pending-provider-jurisdiction-resolution' : 'not-requested'
    },
    consents: {
      disclosureAcknowledgment: true,
      authorizationConsent: true,
      continuousAuthorizationRequested: input.continuousAuthorizationRequested === true,
      guardianName: ageGroup === 'under-18' ? requiredText(input.guardianName, 'guardianName', 200) : null,
      guardianConsent: ageGroup === 'under-18' ? true : null,
      minorLegalReviewComplete: ageGroup === 'under-18' ? true : null
    },
    electronicSignature: {
      typedName: requiredText(input.typedSignature, 'typedSignature', 180),
      signedDate: requiredText(input.signedDate, 'signedDate', 40)
    },
    screeningStatus: 'authorized-awaiting-compliant-provider',
    legalReviewStatus: 'state-local-provider-review-required',
    decisionAutomation: 'prohibited',
    createdAtUtc: new Date().toISOString()
  };
  return { ...record, evidenceSha256: createHash('sha256').update(JSON.stringify(record)).digest('hex') };
}

export function backgroundScreeningReadiness() {
  return {
    schemaVersion: '1.0',
    authorizationFormReady: true,
    federalScopeModelReady: true,
    allStateTerritoryCodeModelReady: true,
    countyScopeModelReady: true,
    actualConsumerReportingAgencyConnected: false,
    liveFederalStateCountySearchExecuted: false,
    adverseActionAutomationEnabled: false,
    jurisdictionSpecificLegalReviewRequired: true,
    note: 'The system is ready to capture authorization and scope. Actual searches require a compliant consumer reporting provider or public-record workflow with applicable state/local review.'
  };
}
