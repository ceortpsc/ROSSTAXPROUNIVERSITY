import Fastify from 'fastify';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import { registerEnrollmentRoutes } from './enrollment-routes';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie', 'req.headers.x-enrollment-admin-key']
  },
  trustProxy: true,
  bodyLimit: 1024 * 1024
});

await app.register(compress, { global: true });
await app.register(helmet, {
  global: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: process.env.RTPU_DEPLOY_ENV === 'production'
    ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
    : false
});

app.addHook('onSend', async (request, reply, payload) => {
  if (request.url.startsWith('/api/')) reply.header('cache-control', 'no-store, max-age=0');
  return payload;
});

await registerEnrollmentRoutes(app);

const brandCss = `
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;background:#f7f2e8}*{box-sizing:border-box}body{margin:0;background:#f7f2e8}a{color:inherit}.shell{min-height:100vh;padding:28px 16px 60px}.wrap{max-width:1100px;margin:auto}.hero{background:#0b1f3a;color:#fff;border:1px solid #c9a227;border-radius:22px;padding:28px;box-shadow:0 18px 50px rgba(11,31,58,.14)}.hero .eyebrow{color:#d4af37;text-transform:uppercase;letter-spacing:1.4px;font-size:12px;font-weight:900}.hero h1{margin:8px 0;font-size:clamp(30px,5vw,42px)}.hero p{color:#e5e7eb;line-height:1.6;max-width:900px}.nav{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.nav a{background:#fff;border:1px solid #d8d2c4;border-radius:999px;padding:9px 13px;text-decoration:none;font-weight:800;color:#0b1f3a}.panel{background:#fff;border:1px solid #d8d2c4;border-radius:18px;padding:20px;margin:18px 0;box-shadow:0 8px 22px rgba(15,23,42,.045)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:13px;font-weight:800;color:#0b1f3a}.field input,.field select,.field textarea{font:inherit;border:1px solid #cbd5e1;border-radius:10px;padding:11px;background:#fff}.field textarea{resize:vertical}.checks{display:grid;gap:10px;margin-top:12px}.checks label{display:flex;gap:9px;align-items:flex-start;line-height:1.45}.button{appearance:none;border:0;border-radius:10px;background:#0b1f3a;color:#fff;font-weight:850;padding:12px 16px;cursor:pointer}.button.secondary{background:#fff;color:#0b1f3a;border:1px solid #0b1f3a}.button:disabled{opacity:.55;cursor:not-allowed}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.notice{padding:14px;border-radius:12px;background:#fff8df;border:1px solid #e3c565;line-height:1.5;margin:14px 0}.notice.error{background:#fff1f2;border-color:#fecdd3;color:#881337}.notice.success{background:#ecfdf5;border-color:#86efac;color:#14532d}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all;background:#f8fafc;border:1px solid #e5e7eb;padding:12px;border-radius:10px}.status{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.metric{border:1px solid #d8d2c4;border-radius:14px;padding:14px;background:#fbfaf6}.metric strong{display:block;color:#0b1f3a;font-size:19px}.muted{color:#6b7280;font-size:13px}.hidden{display:none}@media(max-width:640px){.shell{padding:16px 10px 40px}.hero{padding:22px}.panel{padding:16px}}
`;

function layout(title: string, body: string, script = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>${brandCss}</style></head><body><main class="shell"><section class="wrap"><header class="hero"><div class="eyebrow">Ross Tax Pro University • Enrollment Services</div><h1>${title}</h1><p>Invitation, application, electronic-signature evidence, canonical conversion and export workflow for prospective students and approved new-hire training candidates.</p></header><nav class="nav"><a href="/">Enrollment Home</a><a href="/admin/enrollment">Enrollment Administration</a></nav>${body}</section></main>${script ? `<script>${script}</script>` : ''}</body></html>`;
}

app.get('/', async (_request, reply) => reply.type('text/html').send(layout('Enrollment & Program Applications', `
<section class="panel"><h2>Start from an invitation</h2><p>Applications are opened from a signed invitation link issued by the RTPU enrollment office. Prospective students and new hires use the same verified workflow with audience-specific fields.</p><div class="actions"><a class="button" href="/admin/enrollment">Open administration</a></div></section>
<section class="panel"><h2>System design</h2><div class="status"><div class="metric"><strong>Invite</strong><span>Signed time-limited links</span></div><div class="metric"><strong>Apply</strong><span>Audience-aware data-entry form</span></div><div class="metric"><strong>E-sign</strong><span>Consent + integrity evidence</span></div><div class="metric"><strong>Convert</strong><span>RTPU canonical record + LMS payload</span></div><div class="metric"><strong>Export</strong><span>JSON + printable HTML package</span></div></div></section>
`)));

const adminScript = `
const q=(s)=>document.querySelector(s);const esc=(v)=>String(v??'');
let programs=[];
async function load(){
  const [r,p]=await Promise.all([fetch('/api/enrollment/readiness').then(x=>x.json()),fetch('/api/enrollment/programs').then(x=>x.json())]);
  programs=p.programs||[];
  q('#readiness').innerHTML=Object.entries(r.forms||{}).map(([k,v])=>'<div class="metric"><strong>'+(v?'READY':'NO')+'</strong><span>'+k+'</span></div>').join('');
  q('#readiness-note').textContent=r.note||'';
  refreshPrograms();
}
function refreshPrograms(){
  const audience=q('#audience').value;const available=programs.filter(x=>(x.audiences||[]).includes(audience));
  q('#programId').innerHTML=available.map(x=>'<option value="'+x.id+'">'+x.title+'</option>').join('');
}
q('#audience').addEventListener('change',refreshPrograms);
q('#invite-form').addEventListener('submit',async(e)=>{e.preventDefault();q('#result').className='notice';q('#result').textContent='Creating invitation…';
 const body={audience:q('#audience').value,recipientName:q('#recipientName').value,recipientEmail:q('#recipientEmail').value,programId:q('#programId').value,expiresDays:Number(q('#expiresDays').value),inviterLabel:q('#inviterLabel').value};
 const res=await fetch('/api/enrollment/invites',{method:'POST',headers:{'content-type':'application/json','x-enrollment-admin-key':q('#adminKey').value},body:JSON.stringify(body)});const data=await res.json();
 if(!res.ok){q('#result').className='notice error';q('#result').textContent=data.error||'Invite failed';return;}
 q('#result').className=data.delivery?.delivered?'notice success':'notice';
 q('#result').innerHTML='<strong>Invitation created.</strong><br>Delivery: '+esc(data.delivery?.status)+'<div class="mono" id="invite-url">'+esc(data.inviteUrl)+'</div><div class="actions"><button class="button secondary" id="copy">Copy invite link</button><a class="button" href="'+esc(data.inviteUrl)+'" target="_blank" rel="noopener">Open application</a></div>';
 q('#copy').onclick=()=>navigator.clipboard.writeText(data.inviteUrl);
});load();
`;

app.get('/admin/enrollment', async (_request, reply) => reply.type('text/html').send(layout('Enrollment Administration', `
<section class="panel"><h2>Readiness</h2><div id="readiness" class="status"><div class="metric"><strong>Checking</strong><span>runtime</span></div></div><p id="readiness-note" class="muted"></p></section>
<section class="panel"><h2>Send invite to enroll</h2><p class="muted">The administration key protects invite generation. Email delivery occurs only when the configured provider is verified; otherwise the signed invite link is returned for controlled manual delivery.</p><form id="invite-form"><div class="grid"><div class="field"><label>Enrollment admin key</label><input id="adminKey" type="password" autocomplete="off" required></div><div class="field"><label>Audience</label><select id="audience"><option value="prospective-student">Prospective student</option><option value="new-hire">New hire</option></select></div><div class="field"><label>Recipient name</label><input id="recipientName" required></div><div class="field"><label>Recipient email</label><input id="recipientEmail" type="email" required></div><div class="field"><label>Program</label><select id="programId" required></select></div><div class="field"><label>Expires in days</label><input id="expiresDays" type="number" min="1" max="30" value="14" required></div><div class="field"><label>Inviter label</label><input id="inviterLabel" value="Ross Tax Pro University Enrollment Office"></div></div><div class="actions"><button class="button" type="submit">Send invite</button></div></form><div id="result"></div></section>
`, adminScript)));

const enrollScript = `
const q=(s)=>document.querySelector(s);const params=new URLSearchParams(location.search);const token=params.get('token')||'';let invite=null;
function val(id){return q('#'+id).value.trim()}function checked(id){return q('#'+id).checked}
function download(name,type,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();}
async function load(){const res=await fetch('/api/enrollment/invite?token='+encodeURIComponent(token));const data=await res.json();if(!res.ok){q('#load').className='notice error';q('#load').textContent=data.error||'Invalid invitation';q('#form').classList.add('hidden');return;}invite=data.invite;q('#load').className='notice success';q('#load').innerHTML='<strong>Invitation verified.</strong><br>'+invite.recipientName+' • '+invite.programTitle+' • '+invite.audience.replace('-',' ')+'<br><span class="muted">Expires '+invite.expiresAtUtc+'</span>';q('#email').value=invite.recipientEmail;if(invite.audience==='new-hire')q('#hire-fields').classList.remove('hidden');}
q('#ageGroup').addEventListener('change',()=>q('#guardian-fields').classList.toggle('hidden',q('#ageGroup').value!=='under-18'));
q('#form').addEventListener('submit',async(e)=>{e.preventDefault();q('#submit-result').className='notice';q('#submit-result').textContent='Signing, converting and delivering application…';
const application={firstName:val('firstName'),lastName:val('lastName'),preferredName:val('preferredName'),email:val('email'),phone:val('phone'),addressLine1:val('addressLine1'),addressLine2:val('addressLine2'),city:val('city'),state:val('state'),postalCode:val('postalCode'),ageGroup:val('ageGroup'),guardianName:val('guardianName'),guardianEmail:val('guardianEmail'),previousSchoolOrEmployer:val('previousSchoolOrEmployer'),educationLevel:val('educationLevel'),goals:val('goals'),desiredRole:val('desiredRole'),workAuthorizationAttested:checked('workAuthorizationAttested'),accommodationsRequested:checked('accommodationsRequested'),accommodationsNotes:val('accommodationsNotes'),typedSignature:val('typedSignature'),electronicSignatureConsent:checked('electronicSignatureConsent'),accuracyCertification:checked('accuracyCertification'),privacyAcknowledgment:checked('privacyAcknowledgment')};
const res=await fetch('/api/enrollment/applications',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,application})});const data=await res.json();
const hasExport=!!data.exportBundle;if(hasExport){window.__bundle=data.exportBundle;window.__html=data.printableHtml;}
q('#submit-result').className=res.ok?'notice success':'notice error';q('#submit-result').innerHTML=(res.ok?'<strong>Application submitted to RTPU.</strong>':'<strong>Application not confirmed as submitted.</strong>')+'<br>'+String(data.error||('Application ID '+data.applicationId))+(hasExport?'<div class="actions"><button class="button secondary" id="json-download">Download signed JSON package</button><button class="button secondary" id="html-download">Download printable application</button></div>':'');
if(hasExport){q('#json-download').onclick=()=>download('rtpu-application-'+data.applicationId+'.json','application/json',JSON.stringify(window.__bundle,null,2));q('#html-download').onclick=()=>download('rtpu-application-'+data.applicationId+'.html','text/html',window.__html||'');}
});load();
`;

app.get('/enroll', async (_request, reply) => reply.type('text/html').send(layout('Program Enrollment Application', `
<div id="load" class="notice">Verifying invitation…</div><form id="form" class="panel"><h2>Applicant information</h2><p class="muted">Do not enter a Social Security number, banking information, passwords, or government identity-document numbers in this form. Employment tax/I-9/payroll records are separate controlled workflows.</p><div class="grid"><div class="field"><label>First name</label><input id="firstName" required></div><div class="field"><label>Last name</label><input id="lastName" required></div><div class="field"><label>Preferred name</label><input id="preferredName"></div><div class="field"><label>Email</label><input id="email" type="email" required readonly></div><div class="field"><label>Phone</label><input id="phone" required></div><div class="field"><label>Age group</label><select id="ageGroup" required><option value="">Select</option><option value="18-plus">18 or older</option><option value="under-18">Under 18</option></select></div></div><h3>Mailing address</h3><div class="grid"><div class="field"><label>Address line 1</label><input id="addressLine1" required></div><div class="field"><label>Address line 2</label><input id="addressLine2"></div><div class="field"><label>City</label><input id="city" required></div><div class="field"><label>State / region</label><input id="state" required></div><div class="field"><label>Postal code</label><input id="postalCode" required></div></div><div id="guardian-fields" class="hidden"><h3>Parent / guardian for applicant under 18</h3><div class="grid"><div class="field"><label>Guardian name</label><input id="guardianName"></div><div class="field"><label>Guardian email</label><input id="guardianEmail" type="email"></div></div></div><h3>Background & goals</h3><div class="grid"><div class="field"><label>Previous school or employer</label><input id="previousSchoolOrEmployer"></div><div class="field"><label>Current / highest education level</label><input id="educationLevel"></div></div><div class="field"><label>Program goals</label><textarea id="goals" rows="4"></textarea></div><div id="hire-fields" class="hidden"><h3>New-hire training information</h3><div class="field"><label>Desired / assigned role</label><input id="desiredRole"></div><div class="checks"><label><input id="workAuthorizationAttested" type="checkbox">I attest that I am authorized to work as required for the applicable role. Formal I-9 verification remains a separate employment workflow.</label></div></div><h3>Accessibility</h3><div class="checks"><label><input id="accommodationsRequested" type="checkbox">I would like the enrollment office to contact me about an accommodation request.</label></div><div class="field"><label>Accommodation notes (optional)</label><textarea id="accommodationsNotes" rows="3"></textarea></div><h3>Electronic signature</h3><div class="field"><label>Type your full name</label><input id="typedSignature" required></div><div class="checks"><label><input id="electronicSignatureConsent" type="checkbox" required>I consent to use an electronic signature for this application.</label><label><input id="accuracyCertification" type="checkbox" required>I certify that the information I provided is accurate to the best of my knowledge.</label><label><input id="privacyAcknowledgment" type="checkbox" required>I acknowledge that this information will be processed for enrollment, training, admissions review, record conversion, and related institutional administration.</label></div><div class="actions"><button class="button" type="submit">Sign & submit application</button></div><div id="submit-result"></div></form>
`, enrollScript)));

app.get('/api/health', async () => ({
  ok: true,
  system: 'RTPU-ENROLLMENT',
  runtime: 'fastify',
  deployEnvironment: process.env.RTPU_DEPLOY_ENV || 'development',
  observedAtUtc: new Date().toISOString()
}));

app.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
  return reply.code(404).type('text/html').send(layout('Not Found', '<section class="panel"><p>The requested enrollment page was not found.</p></section>'));
});

const port = Number(process.env.PORT || 10000);
const host = process.env.HOST || '0.0.0.0';
await app.listen({ port, host });
