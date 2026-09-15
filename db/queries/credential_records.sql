-- RTPU Credential, Transcript & Academic Records Query Catalog
-- Parameters use PostgreSQL positional placeholders. Each query is labeled Q01-Q20.

-- Q01_LIST_ACTIVE_TEMPLATES
SELECT t.artifact_id, t.title, t.category, t.issuance_class,
       v.version, v.file_name, v.sha256, v.status
FROM rtpu_records.rtpu_document_templates t
JOIN LATERAL (
  SELECT tv.* FROM rtpu_records.rtpu_document_template_versions tv
  WHERE tv.template_uuid = t.template_uuid AND tv.status IN ('active','template-not-issued')
  ORDER BY tv.effective_at DESC LIMIT 1
) v ON true
WHERE t.active = true
ORDER BY t.category, t.title;

-- Q02_GET_TEMPLATE_FIELDS
-- $1 = artifact_id
SELECT t.artifact_id, t.title, v.version, v.sha256,
       f.field_name, f.required, f.data_type, f.sensitivity, f.validation_rule, f.sequence
FROM rtpu_records.rtpu_document_templates t
JOIN rtpu_records.rtpu_document_template_versions v ON v.template_uuid = t.template_uuid
JOIN rtpu_records.rtpu_document_template_fields f ON f.template_version_uuid = v.template_version_uuid
WHERE t.artifact_id = $1
ORDER BY v.effective_at DESC, f.sequence, f.field_name;

-- Q03_GET_STUDENT_ACADEMIC_SUMMARY
-- $1 = student_id
SELECT *
FROM rtpu_records.rtpu_v_student_academic_summary
WHERE student_id = $1
ORDER BY program_title;

-- Q04_GET_TRANSCRIPT_HEADER
-- $1 = transcript_id ; $2 = revision nullable
SELECT tr.*, s.student_id, s.legal_name, p.program_id, p.title AS program_title
FROM rtpu_records.rtpu_transcripts tr
JOIN rtpu_records.rtpu_students s ON s.student_uuid = tr.student_uuid
LEFT JOIN rtpu_records.rtpu_student_programs sp ON sp.student_program_uuid = tr.student_program_uuid
LEFT JOIN rtpu_records.rtpu_programs p ON p.program_uuid = sp.program_uuid
WHERE tr.transcript_id = $1
  AND ($2::integer IS NULL OR tr.revision = $2::integer)
ORDER BY tr.revision DESC
LIMIT 1;

-- Q05_GET_TRANSCRIPT_LINES
-- $1 = transcript_uuid
SELECT line_order, term_label, course_code, course_title,
       attempted_credits, earned_credits, grade, quality_points, source, status
FROM rtpu_records.rtpu_transcript_lines
WHERE transcript_uuid = $1::uuid
ORDER BY line_order;

-- Q06_GET_DEGREE_AUDIT
-- $1 = student_program_uuid
WITH latest AS (
  SELECT * FROM rtpu_records.rtpu_degree_audits
  WHERE student_program_uuid = $1::uuid
  ORDER BY audit_version DESC LIMIT 1
)
SELECT l.*, dai.requirement_code, dai.status AS requirement_status,
       dai.satisfied_by, dai.evidence_reference, dai.notes
FROM latest l
LEFT JOIN rtpu_records.rtpu_degree_audit_items dai ON dai.degree_audit_uuid = l.degree_audit_uuid
ORDER BY dai.requirement_code;

-- Q07_LIST_GRADUATION_CLEARANCE
SELECT *
FROM rtpu_records.rtpu_v_graduation_clearance
ORDER BY clearance_status, program_title, legal_name;

-- Q08_GET_CREDENTIAL_ISSUANCE_GATES
-- $1 = student_program_uuid
WITH latest_audit AS (
  SELECT * FROM rtpu_records.rtpu_degree_audits
  WHERE student_program_uuid = $1::uuid
  ORDER BY audit_version DESC LIMIT 1
),
active_holds AS (
  SELECT COUNT(*)::integer AS blocking_holds
  FROM rtpu_records.rtpu_student_holds h
  JOIN rtpu_records.rtpu_student_programs sp ON sp.student_uuid = h.student_uuid
  WHERE sp.student_program_uuid = $1::uuid
    AND h.status = 'active' AND h.blocks_credential = true
),
approval AS (
  SELECT COUNT(*)::integer AS approvals
  FROM rtpu_records.rtpu_approvals
  WHERE subject_type = 'student-program'
    AND subject_id = $1::text
    AND approval_type = 'credential-issuance'
    AND decision = 'approved'
)
SELECT
  sp.student_program_uuid,
  sp.status AS program_status,
  sp.completion_date,
  la.clearance_status,
  la.holds_clear,
  ah.blocking_holds,
  ap.approvals,
  (sp.status = 'completed'
   AND sp.completion_date IS NOT NULL
   AND la.clearance_status = 'clear'
   AND COALESCE(la.holds_clear,false) = true
   AND ah.blocking_holds = 0
   AND ap.approvals > 0) AS eligible_for_registrar_issuance
FROM rtpu_records.rtpu_student_programs sp
LEFT JOIN latest_audit la ON true
CROSS JOIN active_holds ah
CROSS JOIN approval ap
WHERE sp.student_program_uuid = $1::uuid;

-- Q09_GET_CREDENTIAL_BY_ID
-- $1 = credential_id
SELECT ca.*, cr.public_status, cr.verification_url, cr.published_at,
       s.student_id, s.legal_name, p.program_id, p.title AS program_title
FROM rtpu_records.rtpu_credential_awards ca
JOIN rtpu_records.rtpu_student_programs sp ON sp.student_program_uuid = ca.student_program_uuid
JOIN rtpu_records.rtpu_students s ON s.student_uuid = sp.student_uuid
JOIN rtpu_records.rtpu_programs p ON p.program_uuid = sp.program_uuid
LEFT JOIN rtpu_records.rtpu_credential_registry cr ON cr.credential_award_uuid = ca.credential_award_uuid
WHERE ca.credential_id = $1;

-- Q10_PUBLIC_VERIFY_CREDENTIAL
-- $1 = credential_id ; $2 = already-hashed verification code
SELECT v.credential_id, v.credential_title, v.credential_type, v.award_date,
       v.public_status, v.verification_url, v.published_at
FROM rtpu_records.rtpu_v_credential_verification_public v
JOIN rtpu_records.rtpu_credential_registry cr ON cr.credential_id = v.credential_id
WHERE v.credential_id = $1
  AND cr.verification_code_hash = $2
  AND v.public_status IN ('valid','voided','superseded');

-- Q11_LIST_DOCUMENT_REQUEST_QUEUE
SELECT * FROM rtpu_records.rtpu_v_document_request_queue
ORDER BY requested_at;

-- Q12_GET_TRANSFER_EVALUATION
-- $1 = transfer_evaluation_uuid
SELECT te.*, ts.institution_name, ts.jurisdiction, ts.credential_title,
       ti.source_course_code, ti.source_course_title, ti.source_credits,
       c.course_code AS target_course_code, c.title AS target_course_title,
       ti.accepted_credits, ti.decision, ti.rationale
FROM rtpu_records.rtpu_transfer_evaluations te
JOIN rtpu_records.rtpu_transfer_sources ts ON ts.transfer_source_uuid = te.transfer_source_uuid
LEFT JOIN rtpu_records.rtpu_transfer_credit_items ti ON ti.transfer_evaluation_uuid = te.transfer_evaluation_uuid
LEFT JOIN rtpu_records.rtpu_courses c ON c.course_uuid = ti.target_course_uuid
WHERE te.transfer_evaluation_uuid = $1::uuid
ORDER BY ti.source_course_code, ti.source_course_title;

-- Q13_GET_STUDENT_DOCUMENTS
-- $1 = student_id
SELECT di.document_instance_uuid, di.document_number, di.lifecycle_status,
       di.generated_at, di.issued_at, t.artifact_id, t.title, t.category,
       tv.version, tv.sha256 AS template_sha256, di.rendered_sha256
FROM rtpu_records.rtpu_document_instances di
JOIN rtpu_records.rtpu_students s ON s.student_uuid = di.student_uuid
JOIN rtpu_records.rtpu_document_template_versions tv ON tv.template_version_uuid = di.template_version_uuid
JOIN rtpu_records.rtpu_document_templates t ON t.template_uuid = tv.template_uuid
WHERE s.student_id = $1
ORDER BY di.generated_at DESC;

-- Q14_GET_AUDIT_TIMELINE
-- $1 = subject_type ; $2 = subject_id
SELECT occurred_at, actor_type, actor_id, action, correlation_id,
       source_system, evidence_reference, before_hash, after_hash, metadata
FROM rtpu_records.rtpu_audit_events
WHERE subject_type = $1 AND subject_id = $2
ORDER BY occurred_at, audit_event_uuid;

-- Q15_CREATE_DOCUMENT_DRAFT
-- $1 template_version_uuid, $2 student_uuid, $3 student_program_uuid, $4 document_number, $5 generated_by, $6 metadata jsonb
INSERT INTO rtpu_records.rtpu_document_instances
(template_version_uuid, student_uuid, student_program_uuid, document_number,
 lifecycle_status, generated_by, metadata)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'draft-generated', $5, COALESCE($6::jsonb,'{}'::jsonb))
RETURNING *;

-- Q16_RECORD_HUMAN_APPROVAL
-- $1 subject_type, $2 subject_id, $3 approval_type, $4 decision, $5 approver_role, $6 approver_identifier, $7 evidence_reference, $8 notes
INSERT INTO rtpu_records.rtpu_approvals
(subject_type, subject_id, approval_type, decision, approver_role,
 approver_identifier, evidence_reference, notes)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
RETURNING *;

-- Q17_FINALIZE_CREDENTIAL_ISSUANCE
-- Must run in a transaction after Q08 returns eligible_for_registrar_issuance=true.
-- $1 credential_award_uuid, $2 authorized registrar identifier, $3 credential registry verification hash, $4 verification URL
WITH approved_award AS (
  UPDATE rtpu_records.rtpu_credential_awards ca
  SET status = 'issued', issued_at = now()
  WHERE ca.credential_award_uuid = $1::uuid
    AND ca.status = 'approved'
    AND ca.approved_by IS NOT NULL
    AND ca.approved_at IS NOT NULL
  RETURNING ca.*
),
issued_doc AS (
  UPDATE rtpu_records.rtpu_document_instances di
  SET lifecycle_status = 'issued', issued_by = $2, issued_at = now()
  FROM approved_award aa
  WHERE di.document_instance_uuid = aa.document_instance_uuid
    AND di.lifecycle_status = 'approved-for-issuance'
  RETURNING di.*
)
INSERT INTO rtpu_records.rtpu_credential_registry
(credential_award_uuid, credential_id, verification_code_hash, public_status, verification_url, published_at)
SELECT aa.credential_award_uuid, aa.credential_id, $3, 'valid', $4, now()
FROM approved_award aa
WHERE EXISTS (SELECT 1 FROM issued_doc)
ON CONFLICT (credential_award_uuid) DO NOTHING
RETURNING *;

-- Q18_VOID_CREDENTIAL
-- $1 credential_id, $2 authorized actor, $3 void reason
WITH award AS (
  UPDATE rtpu_records.rtpu_credential_awards
  SET status = 'voided', metadata = metadata || jsonb_build_object('voidedBy',$2,'voidReason',$3,'voidedAt',now())
  WHERE credential_id = $1 AND status IN ('approved','issued')
  RETURNING credential_award_uuid, credential_id, document_instance_uuid
),
registry AS (
  UPDATE rtpu_records.rtpu_credential_registry cr
  SET public_status = 'voided'
  FROM award a
  WHERE cr.credential_award_uuid = a.credential_award_uuid
  RETURNING cr.*
)
UPDATE rtpu_records.rtpu_document_instances di
SET lifecycle_status = 'voided', voided_by = $2, voided_at = now(), void_reason = $3
FROM award a
WHERE di.document_instance_uuid = a.document_instance_uuid
RETURNING di.*, (SELECT row_to_json(registry) FROM registry LIMIT 1) AS registry_record;

-- Q19_CREATE_TRANSCRIPT_REVISION
-- $1 transcript_id, $2 student_uuid, $3 student_program_uuid, $4 officiality, $5 document_instance_uuid
INSERT INTO rtpu_records.rtpu_transcripts
(transcript_id, student_uuid, student_program_uuid, revision, officiality, status, document_instance_uuid)
SELECT $1, $2::uuid, $3::uuid,
       COALESCE(MAX(revision),0) + 1,
       $4, 'draft', $5::uuid
FROM rtpu_records.rtpu_transcripts
WHERE transcript_id = $1
RETURNING *;

-- Q20_COMPLETE_DOCUMENT_DELIVERY
-- $1 delivery_uuid, $2 status, $3 provider_message_id, $4 tracking_reference, $5 failure_reason
UPDATE rtpu_records.rtpu_document_deliveries
SET status = $2,
    provider_message_id = COALESCE($3, provider_message_id),
    tracking_reference = COALESCE($4, tracking_reference),
    sent_at = CASE WHEN $2 IN ('sent','delivered') AND sent_at IS NULL THEN now() ELSE sent_at END,
    delivered_at = CASE WHEN $2 = 'delivered' THEN now() ELSE delivered_at END,
    failure_reason = CASE WHEN $2 = 'failed' THEN $5 ELSE failure_reason END
WHERE delivery_uuid = $1::uuid
RETURNING *;