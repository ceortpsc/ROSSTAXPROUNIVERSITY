import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  buildCanonicalEnrollmentApplication,
  createApplicationExportBundle,
  createEnrollmentInvite,
  enrollmentPrograms,
  enrollmentReadiness,
  renderEnrollmentApplicationHtml,
  verifyEnrollmentInvite
} from '../lib/enrollment';

function secureEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireEnrollmentAdmin(request: FastifyRequest) {
  const expected = process.env.ENROLLMENT_ADMIN_KEY;
  const supplied = typeof request.headers['x-enrollment-admin-key'] === 'string'
    ? request.headers['x-enrollment-admin-key']
    : undefined;
  return secureEqual(expected, supplied);
}

function publicOrigin(request: FastifyRequest) {
  const explicit = process.env.PUBLIC_BASE_URL || process.env.ANDREAA_PRODUCTION_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3000';
  const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'http';
  return `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`;
}

function requestEvidenceSource(request: FastifyRequest) {
  const ua = typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : 'unknown';
  const forwarded = typeof request.headers['x-forwarded-for'] === 'string' ? request.headers['x-forwarded-for'].split(',')[0].trim() : '';
  return `${forwarded || request.ip || 'unknown'}|${ua}`;
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ENROLLMENT_FROM_EMAIL;
  if (!apiKey || !from) return { attempted: false, delivered: false, provider: 'resend', status: 'provider-not-configured' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, attachments: input.attachments })
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  return {
    attempted: true,
    delivered: response.ok,
    provider: 'resend',
    status: response.ok ? 'accepted-by-provider' : 'provider-rejected',
    providerMessageId: response.ok && typeof payload.id === 'string' ? payload.id : null,
    providerHttpStatus: response.status
  };
}

async function deliverInvite(inviteUrl: string, invite: ReturnType<typeof createEnrollmentInvite>['invite']) {
  const subject = `Ross Tax Pro University invitation — ${invite.programTitle}`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033"><div style="max-width:680px;margin:auto;border:1px solid #d4af37;padding:28px"><div style="background:#0b1f3a;color:white;padding:20px;margin:-28px -28px 24px"><strong>ROSS TAX PRO UNIVERSITY</strong><h1 style="margin:8px 0">Program invitation</h1></div><p>Hello ${escapeHtml(invite.recipientName)},</p><p>You have been invited to complete an application for <strong>${escapeHtml(invite.programTitle)}</strong> as a ${escapeHtml(invite.audience.replace('-', ' '))}.</p><p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#0b1f3a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open application</a></p><p>This invitation expires ${escapeHtml(invite.expiresAtUtc)}.</p><p>If you were not expecting this invitation, do not submit the form.</p></div></body></html>`;
  return sendResendEmail({ to: invite.recipientEmail, subject, html });
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function dispatchApplication(bundle: ReturnType<typeof createApplicationExportBundle>) {
  const attempts: Array<Record<string, unknown>> = [];
  let delivered = false;
  const webhook = process.env.ENROLLMENT_SUBMISSION_WEBHOOK_URL;
  if (webhook) {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (process.env.ENROLLMENT_SUBMISSION_WEBHOOK_BEARER) headers.authorization = `Bearer ${process.env.ENROLLMENT_SUBMISSION_WEBHOOK_BEARER}`;
      const response = await fetch(webhook, { method: 'POST', headers, body: JSON.stringify(bundle) });
      attempts.push({ channel: 'webhook', attempted: true, delivered: response.ok, httpStatus: response.status });
      delivered ||= response.ok;
    } catch (error) {
      attempts.push({ channel: 'webhook', attempted: true, delivered: false, error: error instanceof Error ? error.message : 'webhook delivery failed' });
    }
  }
  const receiver = process.env.ENROLLMENT_RECEIVER_EMAIL;
  if (receiver) {
    const application = bundle.application;
    const json = Buffer.from(JSON.stringify(bundle, null, 2), 'utf8').toString('base64');
    const htmlExport = Buffer.from(renderEnrollmentApplicationHtml(bundle), 'utf8').toString('base64');
    try {
      const email = await sendResendEmail({
        to: receiver,
        subject: `RTPU signed application — ${application.applicant.firstName} ${application.applicant.lastName} — ${application.program.title}`,
        html: `<p>A signed RTPU application was received.</p><p><strong>Application ID:</strong> ${escapeHtml(application.applicationId)}</p><p><strong>Applicant:</strong> ${escapeHtml(`${application.applicant.firstName} ${application.applicant.lastName}`)}</p><p><strong>Program:</strong> ${escapeHtml(application.program.title)}</p><p><strong>Export checksum:</strong> ${escapeHtml(bundle.checksumSha256)}</p>`,
        attachments: [
          { filename: `rtpu-application-${application.applicationId}.json`, content: json },
          { filename: `rtpu-application-${application.applicationId}.html`, content: htmlExport }
        ]
      });
      attempts.push({ channel: 'institutional-email', ...email });
      delivered ||= email.delivered;
    } catch (error) {
      attempts.push({ channel: 'institutional-email', attempted: true, delivered: false, error: error instanceof Error ? error.message : 'email delivery failed' });
    }
  }
  if (!webhook && !receiver) attempts.push({ channel: 'none', attempted: false, delivered: false, status: 'submission-destination-not-configured' });
  return { delivered, attempts };
}

export async function registerEnrollmentRoutes(app: FastifyInstance) {
  app.get('/api/enrollment/readiness', async () => ({ ok: true, system: 'Ross Tax Pro University Enrollment Conversion System', ...enrollmentReadiness(), observedAtUtc: new Date().toISOString() }));
  app.get('/api/enrollment/programs', async () => ({ ok: true, programs: enrollmentPrograms }));
  app.post('/api/enrollment/invites', async (request, reply) => {
    if (!requireEnrollmentAdmin(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
    try {
      const generated = createEnrollmentInvite((request.body || {}) as Record<string, unknown>);
      const inviteUrl = `${publicOrigin(request)}/enroll?token=${encodeURIComponent(generated.token)}`;
      const delivery = await deliverInvite(inviteUrl, generated.invite).catch((error) => ({ attempted: true, delivered: false, provider: 'resend', status: 'delivery-error', error: error instanceof Error ? error.message : 'invite delivery failed' }));
      request.log.info({ inviteId: generated.invite.inviteId, audience: generated.invite.audience, programId: generated.invite.programId, delivery }, 'Enrollment invite created');
      return reply.code(201).send({ ok: true, invite: generated.invite, inviteUrl, delivery, evidence: { inviteTokenSha256Prefix: createHash('sha256').update(generated.token).digest('hex').slice(0, 24), recipientEmailSha256Prefix: createHash('sha256').update(generated.invite.recipientEmail).digest('hex').slice(0, 24) } });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid invite request' });
    }
  });
  app.get('/api/enrollment/invite', async (request, reply) => {
    try {
      const query = request.query as { token?: string };
      const invite = verifyEnrollmentInvite(String(query.token || ''));
      return { ok: true, invite: { inviteId: invite.inviteId, audience: invite.audience, recipientName: invite.recipientName, recipientEmail: invite.recipientEmail, programId: invite.programId, programTitle: invite.programTitle, expiresAtUtc: invite.expiresAtUtc, inviterLabel: invite.inviterLabel } };
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid invite' });
    }
  });
  app.post('/api/enrollment/applications/convert', async (request, reply) => {
    if (!requireEnrollmentAdmin(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
    try {
      const body = (request.body || {}) as { token?: string; application?: Record<string, unknown> };
      const invite = verifyEnrollmentInvite(String(body.token || ''));
      const application = buildCanonicalEnrollmentApplication(invite, body.application || {}, requestEvidenceSource(request));
      return { ok: true, exportBundle: createApplicationExportBundle(application) };
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'conversion failed' });
    }
  });
  app.post('/api/enrollment/applications', async (request, reply) => {
    try {
      const body = (request.body || {}) as { token?: string; application?: Record<string, unknown> };
      const invite = verifyEnrollmentInvite(String(body.token || ''));
      const application = buildCanonicalEnrollmentApplication(invite, body.application || {}, requestEvidenceSource(request));
      const exportBundle = createApplicationExportBundle(application);
      const printableHtml = renderEnrollmentApplicationHtml(exportBundle);
      const dispatch = await dispatchApplication(exportBundle);
      request.log.info({ applicationId: application.applicationId, inviteId: application.inviteId, audience: application.audience, programId: application.program.id, delivered: dispatch.delivered, channels: dispatch.attempts.map((item) => item.channel) }, 'Enrollment application processed');
      if (!dispatch.delivered) {
        return reply.code(503).send({ ok: false, submitted: false, error: 'The application was signed and converted, but RTPU delivery is not configured or did not succeed. Download the export package and contact the enrollment office; do not assume submission was completed.', applicationId: application.applicationId, signatureEvidence: application.electronicSignature, exportBundle, printableHtml, dispatch });
      }
      return reply.code(201).send({ ok: true, submitted: true, applicationId: application.applicationId, receivedAtUtc: new Date().toISOString(), signatureEvidence: application.electronicSignature, exportBundle, printableHtml, dispatch });
    } catch (error) {
      return reply.code(400).send({ ok: false, submitted: false, error: error instanceof Error ? error.message : 'application submission failed' });
    }
  });
}
