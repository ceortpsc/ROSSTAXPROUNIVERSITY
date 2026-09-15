# Ross Tax Pro University — Admissions, Enrollment & Clearance Standard

**Status:** Institutional operating standard and implementation specification.  
**Scope:** Enrollment intake, transfer review, foreign-exchange intake, RTPSC new-hire training enrollment, PTIN-holder practitioner intake, references, employment history, prior education, FAFSA status tracking, background-screening authorization, record conversion and evidence controls.

> This document is not legal advice and does not represent that one form is sufficient in every U.S. jurisdiction. Federal, state, county, municipal, immigration, education, employment, consumer-reporting and financial-aid requirements remain subject to the governing authority and current law.

## 1. Application tracks

The admissions system supports five standardized application tracks:

1. Prospective student
2. Transfer student
3. Foreign exchange student
4. RTPSC new-hire student
5. Valid PTIN holder / tax practitioner

Every track begins with a signed, time-limited invitation and produces a canonical RTPU application package with electronic-signature evidence, a conversion payload and export-ready JSON/HTML artifacts.

## 2. Tax Practitioner Diploma — 4 Semester Program

Program ID: `tax-practitioner-4-semester-diploma`

- Semester 1 — Foundations & Individual Taxation
- Semester 2 — Business, Payroll & Applied Tax Preparation
- Semester 3 — ERO Operations, e-File & Practice Security
- Semester 4 — Representation, Notices, Collections & Capstone

The credential is an **institutional diploma**. It does not itself confer Enrolled Agent status, CPA licensure, attorney status, IRS enrollment or another government credential.

### PTIN-holder track

The system accepts PTIN-format data only in `P########` format, requires applicant attestation, and records status as `pending-independent-verification`. A format match is never treated as proof that a PTIN is valid, current or belongs to the applicant.

## 3. Standardized data-entry package

### Common applicant data

- Application ID
- Legal/preferred name
- Email and phone
- Mailing address and country
- Age group
- Guardian name/email when required
- Previous school/employer
- Education level
- Program goals
- Accommodation-contact request
- Program selection
- Electronic signature
- Accuracy certification
- Privacy acknowledgment

The general enrollment form intentionally excludes Social Security numbers, bank data, StudentAid.gov credentials, tax-return details, passport numbers, visa numbers, SEVIS numbers, government identity-document numbers and passwords.

### Transfer student application

- Transfer institution
- Prior program/major
- Credits attempted
- Credits completed
- Transcript request authorization
- Prior-education verification authorization
- Official transcript status
- Transfer-credit evaluation status

Transfer credits remain pending until evaluated; self-reported credits are never automatically accepted.

### Foreign exchange student application

- Home country
- Home institution
- Exchange sponsor/organization
- Current visa or exchange-program status (descriptive only)
- Planned start term
- Home-institution verification
- International-document review status

Passport, visa, SEVIS and other immigration-document numbers are handled outside the general enrollment record. Any SEVP/immigration eligibility determination requires the applicable authorized process.

### RTPSC new-hire student application

- Desired/assigned role
- Employee or candidate ID
- Work-authorization attestation
- Employment history
- Reference-check authorization
- Employment-verification authorization
- Training enrollment status

Form I-9, E-Verify where applicable, W-4, payroll, background reports and other employment records remain separate controlled workflows.

## 4. Reference-check standard

For each reference:

- Name
- Relationship
- Email
- Phone
- Organization
- Permission to contact
- Verification status
- Reviewer notes/evidence reference

A reference record begins as `pending`. It is changed to `verified` only after actual contact/evidence is documented.

## 5. Employment-history verification standard

For each employer:

- Employer name
- Role/title
- Start date
- End date
- Supervisor/contact name
- Supervisor email/phone
- Permission to contact
- Verification status

The system must not fabricate verification, infer employment from an applicant statement, or automatically make a hiring decision from background information.

## 6. Prior-education / transcript verification

For each institution:

- Institution name
- Location
- Education level
- Program/major
- Attendance dates
- Credential claimed
- Transcript requested flag
- Verification status
- Transfer-credit status

Official transcript evidence and transfer-credit decisions remain separate from self-reported education history.

## 7. FAFSA / financial-aid status tracking

The RTPU record tracks only institutional workflow status:

- Not applicable
- Not started
- Submitted / awaiting school
- School code added (applicant attestation)
- Verification required
- Institutional clearance complete

Applicants complete FAFSA through Federal Student Aid. The RTPU enrollment record must not collect StudentAid.gov passwords, FSA ID credentials, SSNs, tax-return data or banking credentials.

A FAFSA status field does **not** represent that RTPU participates in federal Title IV student-aid programs. Federal school eligibility or a federal school code must be independently verified before the institution represents such eligibility.

## 8. Background-screening authorization

The implemented module creates authorization and evidence records only. It does **not** retrieve or score criminal, credit, driving, federal, state, county or other consumer-report information.

### Scope model

- Federal scope
- State/territory scope
- County/county-equivalent scope entered by county/state or FIPS
- U.S. state/territory code support: AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY, DC, AS, GU, MP, PR, VI

County searches are provider/jurisdiction specific. The system must not claim "all counties searched" until a compliant provider returns evidence identifying the jurisdictions actually searched.

### Authorization controls

- Permissible-purpose field
- Standalone disclosure acknowledgment
- Written authorization
- Requested federal/state/county scope
- State/territory codes
- Named counties or FIPS values
- Electronic signature/date
- Guardian authorization for a minor when applicable
- Mandatory jurisdiction-specific legal review before any minor background screening
- No automated admission or employment denial based on screening data

For third-party employment consumer reports, FCRA disclosure/authorization and applicable pre-adverse/adverse-action processes must be handled according to current law and provider requirements. State and local restrictions must be reviewed separately.

## 9. Admissions-clearance statuses

Standard statuses:

- `not-started`
- `pending`
- `received`
- `verified`
- `waived`
- `not-applicable`
- `needs-review`

The admissions decision stays `pending` until an authorized reviewer completes the required review. No background, reference, education, FAFSA or PTIN input automatically grants or denies admission/employment.

## 10. Production routes

Enrollment service:

- `/`
- `/admin/enrollment`
- `/enroll?token=...`
- `/admissions`
- `/api/enrollment/readiness`
- `/api/enrollment/programs`
- `POST /api/enrollment/invites`
- `GET /api/enrollment/invite`
- `POST /api/enrollment/applications`
- `POST /api/enrollment/applications/convert`
- `GET /api/admissions/seed`
- `GET /api/admissions/background-policy`
- `POST /api/admissions/verification-records`
- `POST /api/admissions/background-authorizations`

## 11. Governing implementation principles

- Evidence before status change
- Least data necessary
- Separate high-sensitivity workflows
- No fabricated verification
- No automatic high-impact decision from background data
- Explicit consent/authorization
- Fail closed when a destination/provider is not configured
- Record source, timestamp and reviewer for verification events
- Keep employment, education, immigration, financial-aid and practitioner-credential determinations distinct
- Maintain state/local legal review for background-screening scope

## 12. Current federal reference points

Implementation should be reviewed against current official guidance, including:

- Federal Trade Commission: Background Checks — What Employers Need to Know
- Equal Employment Opportunity Commission: Background Checks
- USCIS: Form I-9 / Employment Eligibility Verification
- Federal Student Aid: FAFSA and FAFSA verification guidance

The legal/compliance layer must be re-reviewed whenever applicable federal, state or local requirements change.
