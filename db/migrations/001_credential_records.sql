-- RTPU Credential, Transcript & Academic Records Schema
-- Target: PostgreSQL 15+
-- Status: schema-ready; must be applied only to an authorized production database.
-- Governance: AI may draft records. Credential issuance requires an authorized human approval.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS rtpu_records;

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_students (
  student_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  preferred_name text,
  email text,
  date_of_birth date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('applicant','active','leave','completed','withdrawn','inactive')),
  source_system text,
  source_record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE rtpu_records.rtpu_students IS 'Minimal academic-record identity. Do not store SSNs, FSA IDs, government passwords, banking credentials, or unnecessary sensitive identifiers.';

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_programs (
  program_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id text NOT NULL,
  catalog_version text NOT NULL,
  title text NOT NULL,
  program_type text NOT NULL,
  required_credits numeric(8,2),
  minimum_gpa numeric(4,3),
  active boolean NOT NULL DEFAULT true,
  effective_start date,
  effective_end date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_id, catalog_version)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_terms (
  term_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id text NOT NULL UNIQUE,
  title text NOT NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','open','active','closed','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_courses (
  course_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text NOT NULL,
  catalog_version text NOT NULL,
  title text NOT NULL,
  credits numeric(8,2) NOT NULL DEFAULT 0,
  level text,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_code, catalog_version)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_program_requirements (
  requirement_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_programs(program_uuid),
  requirement_code text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('course','credit-minimum','gpa-minimum','assessment','capstone','other')),
  title text NOT NULL,
  required_course_uuid uuid REFERENCES rtpu_records.rtpu_courses(course_uuid),
  required_credits numeric(8,2),
  rule_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  sequence integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(program_uuid, requirement_code)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_student_programs (
  student_program_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_students(student_uuid),
  program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_programs(program_uuid),
  admit_term_uuid uuid REFERENCES rtpu_records.rtpu_terms(term_uuid),
  start_date date,
  expected_completion_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('admitted','active','leave','completed','withdrawn','dismissed')),
  standing text NOT NULL DEFAULT 'good-standing' CHECK (standing IN ('good-standing','warning','probation','suspended','not-applicable')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_uuid, program_uuid, start_date)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_course_enrollments (
  course_enrollment_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  course_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_courses(course_uuid),
  term_uuid uuid REFERENCES rtpu_records.rtpu_terms(term_uuid),
  section_code text,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('planned','enrolled','in-progress','completed','withdrawn','failed','incomplete')),
  attempted_credits numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_program_uuid, course_uuid, term_uuid, section_code)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_course_results (
  course_result_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_enrollment_uuid uuid NOT NULL UNIQUE REFERENCES rtpu_records.rtpu_course_enrollments(course_enrollment_uuid),
  grade text,
  grade_points numeric(6,3),
  quality_points numeric(10,3),
  earned_credits numeric(8,2) NOT NULL DEFAULT 0,
  result_status text NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending','passed','failed','withdrawn','incomplete','credit-only')),
  completed_at date,
  source text NOT NULL DEFAULT 'rtpu',
  approved_by text,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_student_holds (
  hold_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_students(student_uuid),
  hold_type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','released','expired')),
  blocks_registration boolean NOT NULL DEFAULT false,
  blocks_transcript boolean NOT NULL DEFAULT false,
  blocks_credential boolean NOT NULL DEFAULT false,
  reason text,
  placed_by text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  released_by text,
  released_at timestamptz
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_transfer_sources (
  transfer_source_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_students(student_uuid),
  institution_name text NOT NULL,
  jurisdiction text,
  credential_title text,
  attendance_start date,
  attendance_end date,
  record_type text NOT NULL DEFAULT 'transcript' CHECK (record_type IN ('transcript','credential','course-record','other')),
  officiality text NOT NULL DEFAULT 'unknown' CHECK (officiality IN ('official','unofficial','unknown')),
  received_at timestamptz,
  evidence_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_transfer_evaluations (
  transfer_evaluation_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_source_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_transfer_sources(transfer_source_uuid),
  target_student_program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','partial','denied','withdrawn')),
  credits_presented numeric(8,2) NOT NULL DEFAULT 0,
  credits_accepted numeric(8,2) NOT NULL DEFAULT 0,
  credits_rejected numeric(8,2) NOT NULL DEFAULT 0,
  evaluator text,
  evaluator_notes text,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_transfer_credit_items (
  transfer_credit_item_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_evaluation_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_transfer_evaluations(transfer_evaluation_uuid),
  source_course_code text,
  source_course_title text NOT NULL,
  source_credits numeric(8,2) NOT NULL DEFAULT 0,
  target_course_uuid uuid REFERENCES rtpu_records.rtpu_courses(course_uuid),
  accepted_credits numeric(8,2) NOT NULL DEFAULT 0,
  decision text NOT NULL CHECK (decision IN ('accepted','partial','rejected','pending')),
  rationale text,
  UNIQUE(transfer_evaluation_uuid, source_course_code, source_course_title)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_degree_audits (
  degree_audit_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  audit_version integer NOT NULL,
  status text NOT NULL DEFAULT 'pending-review' CHECK (status IN ('pending-review','in-progress','clear','not-clear','superseded')),
  completed_credits numeric(8,2) NOT NULL DEFAULT 0,
  in_progress_credits numeric(8,2) NOT NULL DEFAULT 0,
  remaining_credits numeric(8,2) NOT NULL DEFAULT 0,
  cumulative_gpa numeric(4,3),
  holds_clear boolean NOT NULL DEFAULT false,
  clearance_status text NOT NULL DEFAULT 'pending' CHECK (clearance_status IN ('pending','clear','not-clear')),
  generated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  UNIQUE(student_program_uuid, audit_version)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_degree_audit_items (
  degree_audit_item_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  degree_audit_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_degree_audits(degree_audit_uuid),
  requirement_uuid uuid REFERENCES rtpu_records.rtpu_program_requirements(requirement_uuid),
  requirement_code text NOT NULL,
  status text NOT NULL CHECK (status IN ('met','in-progress','pending','not-met','waived')),
  satisfied_by text,
  evidence_reference text,
  notes text,
  UNIQUE(degree_audit_uuid, requirement_code)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_templates (
  template_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  issuance_class text NOT NULL CHECK (issuance_class IN ('registrar-controlled','workflow-controlled')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_template_versions (
  template_version_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_document_templates(template_uuid),
  version text NOT NULL,
  file_name text NOT NULL,
  sha256 text NOT NULL CHECK (char_length(sha256) = 64),
  status text NOT NULL DEFAULT 'template-not-issued' CHECK (status IN ('template-not-issued','active','retired','superseded')),
  effective_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(template_uuid, version),
  UNIQUE(sha256)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_template_fields (
  template_field_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_document_template_versions(template_version_uuid),
  field_name text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  data_type text NOT NULL DEFAULT 'text' CHECK (data_type IN ('text','date','number','boolean','json','identifier','url','email','phone')),
  sensitivity text NOT NULL DEFAULT 'institutional' CHECK (sensitivity IN ('public','institutional','student-record','restricted')),
  validation_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  sequence integer NOT NULL DEFAULT 0,
  UNIQUE(template_version_uuid, field_name)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_instances (
  document_instance_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_version_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_document_template_versions(template_version_uuid),
  student_uuid uuid REFERENCES rtpu_records.rtpu_students(student_uuid),
  student_program_uuid uuid REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  document_number text UNIQUE,
  lifecycle_status text NOT NULL DEFAULT 'draft-generated' CHECK (lifecycle_status IN ('draft-generated','pending-review','approved-for-issuance','issued','voided','superseded')),
  rendered_file_reference text,
  rendered_sha256 text CHECK (rendered_sha256 IS NULL OR char_length(rendered_sha256) = 64),
  generated_by text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  issued_by text,
  issued_at timestamptz,
  voided_by text,
  voided_at timestamptz,
  void_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_instance_values (
  document_value_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_instance_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_document_instances(document_instance_uuid) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_value text,
  source_type text NOT NULL DEFAULT 'canonical-record' CHECK (source_type IN ('canonical-record','authorized-user','calculated','external-evidence')),
  source_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_instance_uuid, field_name)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_credential_awards (
  credential_award_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_program_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  document_instance_uuid uuid REFERENCES rtpu_records.rtpu_document_instances(document_instance_uuid),
  credential_id text NOT NULL UNIQUE,
  credential_title text NOT NULL,
  credential_type text NOT NULL CHECK (credential_type IN ('certificate','diploma','completion','honor','other')),
  award_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','issued','voided','superseded')),
  authority_basis text,
  approved_by text,
  approved_at timestamptz,
  issued_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK ((status IN ('approved','issued','voided','superseded') AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR status = 'pending')
);
COMMENT ON TABLE rtpu_records.rtpu_credential_awards IS 'Credential awards require human/institutional approval. AI-generated draft data alone must never satisfy issuance authority.';

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_credential_registry (
  credential_registry_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_award_uuid uuid NOT NULL UNIQUE REFERENCES rtpu_records.rtpu_credential_awards(credential_award_uuid),
  credential_id text NOT NULL UNIQUE,
  verification_code_hash text NOT NULL,
  public_status text NOT NULL DEFAULT 'pending' CHECK (public_status IN ('pending','valid','voided','superseded')),
  verification_url text,
  published_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_transcripts (
  transcript_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id text NOT NULL,
  student_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_students(student_uuid),
  student_program_uuid uuid REFERENCES rtpu_records.rtpu_student_programs(student_program_uuid),
  revision integer NOT NULL,
  officiality text NOT NULL CHECK (officiality IN ('official','unofficial')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending-review','issued','voided','superseded')),
  attempted_credits numeric(8,2) NOT NULL DEFAULT 0,
  earned_credits numeric(8,2) NOT NULL DEFAULT 0,
  transfer_credits numeric(8,2) NOT NULL DEFAULT 0,
  cbe_credits numeric(8,2) NOT NULL DEFAULT 0,
  cumulative_gpa numeric(4,3),
  document_instance_uuid uuid REFERENCES rtpu_records.rtpu_document_instances(document_instance_uuid),
  issued_by text,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(transcript_id, revision)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_transcript_lines (
  transcript_line_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_transcripts(transcript_uuid) ON DELETE CASCADE,
  line_order integer NOT NULL,
  term_label text,
  course_code text,
  course_title text NOT NULL,
  attempted_credits numeric(8,2) NOT NULL DEFAULT 0,
  earned_credits numeric(8,2) NOT NULL DEFAULT 0,
  grade text,
  quality_points numeric(10,3),
  source text NOT NULL DEFAULT 'rtpu',
  status text,
  UNIQUE(transcript_uuid, line_order)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_requests (
  document_request_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  student_uuid uuid NOT NULL REFERENCES rtpu_records.rtpu_students(student_uuid),
  request_type text NOT NULL CHECK (request_type IN ('official-transcript','unofficial-transcript','replacement-credential','verification-letter','records-copy','other')),
  requested_document_id text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','identity-review','pending','approved','processing','fulfilled','denied','cancelled')),
  recipient_name text,
  recipient_contact text,
  delivery_method text,
  copies integer NOT NULL DEFAULT 1 CHECK (copies > 0),
  purpose text,
  special_instructions text,
  signature_evidence_reference text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_document_deliveries (
  delivery_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_request_uuid uuid REFERENCES rtpu_records.rtpu_document_requests(document_request_uuid),
  document_instance_uuid uuid REFERENCES rtpu_records.rtpu_document_instances(document_instance_uuid),
  delivery_method text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','returned','cancelled')),
  provider_message_id text,
  tracking_reference text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_verification_requests (
  verification_request_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  request_type text NOT NULL CHECK (request_type IN ('credential','enrollment','good-standing','completion','other')),
  student_uuid uuid REFERENCES rtpu_records.rtpu_students(student_uuid),
  credential_id text,
  requestor_name text,
  requestor_contact text,
  authorization_reference text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','pending-consent','pending-review','verified','not-verified','closed')),
  result_summary text,
  verified_by text,
  received_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_signatures (
  signature_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  signer_role text NOT NULL,
  signer_identifier text NOT NULL,
  signature_method text NOT NULL,
  signature_evidence_reference text NOT NULL,
  signed_at timestamptz NOT NULL,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subject_type, subject_id, signer_role, signed_at)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_approvals (
  approval_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  approval_type text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','denied','returned','abstained')),
  approver_role text NOT NULL,
  approver_identifier text NOT NULL,
  evidence_reference text,
  notes text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subject_type, subject_id, approval_type, approver_identifier, decided_at)
);

CREATE TABLE IF NOT EXISTS rtpu_records.rtpu_audit_events (
  audit_event_uuid uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text,
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  correlation_id text,
  source_system text NOT NULL DEFAULT 'rtpu',
  evidence_reference text,
  before_hash text,
  after_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_student_programs_student ON rtpu_records.rtpu_student_programs(student_uuid, status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_program ON rtpu_records.rtpu_course_enrollments(student_program_uuid, status);
CREATE INDEX IF NOT EXISTS idx_course_results_status ON rtpu_records.rtpu_course_results(result_status, completed_at);
CREATE INDEX IF NOT EXISTS idx_holds_student_active ON rtpu_records.rtpu_student_holds(student_uuid, status);
CREATE INDEX IF NOT EXISTS idx_transfer_eval_program ON rtpu_records.rtpu_transfer_evaluations(target_student_program_uuid, status);
CREATE INDEX IF NOT EXISTS idx_degree_audit_program ON rtpu_records.rtpu_degree_audits(student_program_uuid, audit_version DESC);
CREATE INDEX IF NOT EXISTS idx_document_instances_student ON rtpu_records.rtpu_document_instances(student_uuid, lifecycle_status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_credential_awards_program ON rtpu_records.rtpu_credential_awards(student_program_uuid, status);
CREATE INDEX IF NOT EXISTS idx_transcripts_student ON rtpu_records.rtpu_transcripts(student_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_requests_queue ON rtpu_records.rtpu_document_requests(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_verification_requests_queue ON rtpu_records.rtpu_verification_requests(status, received_at);
CREATE INDEX IF NOT EXISTS idx_audit_subject ON rtpu_records.rtpu_audit_events(subject_type, subject_id, occurred_at);

CREATE OR REPLACE VIEW rtpu_records.rtpu_v_student_academic_summary AS
SELECT
  s.student_id,
  s.legal_name,
  sp.student_program_uuid,
  p.program_id,
  p.title AS program_title,
  p.catalog_version,
  sp.status AS program_status,
  sp.standing,
  COALESCE(SUM(cr.earned_credits), 0)::numeric(8,2) AS earned_credits,
  CASE WHEN COALESCE(SUM(cr.earned_credits),0) > 0
    THEN ROUND((SUM(COALESCE(cr.quality_points,0)) / NULLIF(SUM(cr.earned_credits),0))::numeric, 3)
    ELSE NULL END AS cumulative_gpa
FROM rtpu_records.rtpu_students s
JOIN rtpu_records.rtpu_student_programs sp ON sp.student_uuid = s.student_uuid
JOIN rtpu_records.rtpu_programs p ON p.program_uuid = sp.program_uuid
LEFT JOIN rtpu_records.rtpu_course_enrollments ce ON ce.student_program_uuid = sp.student_program_uuid
LEFT JOIN rtpu_records.rtpu_course_results cr ON cr.course_enrollment_uuid = ce.course_enrollment_uuid AND cr.result_status IN ('passed','credit-only')
GROUP BY s.student_id, s.legal_name, sp.student_program_uuid, p.program_id, p.title, p.catalog_version, sp.status, sp.standing;

CREATE OR REPLACE VIEW rtpu_records.rtpu_v_graduation_clearance AS
SELECT
  s.student_id,
  s.legal_name,
  sp.student_program_uuid,
  p.program_id,
  p.title AS program_title,
  da.degree_audit_uuid,
  da.audit_version,
  da.clearance_status,
  da.completed_credits,
  da.remaining_credits,
  da.cumulative_gpa,
  da.holds_clear,
  NOT EXISTS (
    SELECT 1 FROM rtpu_records.rtpu_student_holds h
    WHERE h.student_uuid = s.student_uuid AND h.status = 'active' AND h.blocks_credential = true
  ) AS credential_holds_clear
FROM rtpu_records.rtpu_students s
JOIN rtpu_records.rtpu_student_programs sp ON sp.student_uuid = s.student_uuid
JOIN rtpu_records.rtpu_programs p ON p.program_uuid = sp.program_uuid
LEFT JOIN LATERAL (
  SELECT d.* FROM rtpu_records.rtpu_degree_audits d
  WHERE d.student_program_uuid = sp.student_program_uuid
  ORDER BY d.audit_version DESC LIMIT 1
) da ON true;

CREATE OR REPLACE VIEW rtpu_records.rtpu_v_credential_verification_public AS
SELECT
  cr.credential_id,
  ca.credential_title,
  ca.credential_type,
  ca.award_date,
  cr.public_status,
  cr.verification_url,
  cr.published_at
FROM rtpu_records.rtpu_credential_registry cr
JOIN rtpu_records.rtpu_credential_awards ca ON ca.credential_award_uuid = cr.credential_award_uuid;

CREATE OR REPLACE VIEW rtpu_records.rtpu_v_document_request_queue AS
SELECT
  dr.request_id,
  s.student_id,
  dr.request_type,
  dr.status,
  dr.delivery_method,
  dr.copies,
  dr.requested_at,
  dr.completed_at
FROM rtpu_records.rtpu_document_requests dr
JOIN rtpu_records.rtpu_students s ON s.student_uuid = dr.student_uuid
WHERE dr.status NOT IN ('fulfilled','denied','cancelled');

COMMIT;