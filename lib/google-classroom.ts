type Json = Record<string, unknown>;

const API_BASE = process.env.GOOGLE_CLASSROOM_BASE_URL || 'https://classroom.googleapis.com/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const classroomScopes = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.profile.emails'
];

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function getAccessToken() {
  if (process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN) return process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN;
  const clientId = required('GOOGLE_CLASSROOM_CLIENT_ID');
  const clientSecret = required('GOOGLE_CLASSROOM_CLIENT_SECRET');
  const refreshToken = required('GOOGLE_CLASSROOM_REFRESH_TOKEN');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    cache: 'no-store'
  });
  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || payload.error || `Google OAuth token exchange failed (${response.status})`);
  return payload.access_token;
}

let launchEvidence: Record<string, unknown> = {
  status: 'not-started',
  ownerId: process.env.GOOGLE_CLASSROOM_OWNER_ID || null,
  term: process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027'
};

export function classroomCredentialStatus() {
  const directAccessToken = Boolean(process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN);
  const refreshFlow = Boolean(process.env.GOOGLE_CLASSROOM_CLIENT_ID && process.env.GOOGLE_CLASSROOM_CLIENT_SECRET && process.env.GOOGLE_CLASSROOM_REFRESH_TOKEN);
  return {
    configured: directAccessToken || refreshFlow,
    credentialMode: directAccessToken ? 'access_token' : refreshFlow ? 'refresh_token' : 'not_configured',
    adminGateConfigured: Boolean(process.env.RTPU_CLASSROOM_INTEGRATION_KEY),
    institutionalOwnerId: process.env.GOOGLE_CLASSROOM_OWNER_ID || null,
    launchTerm: process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027',
    autoLaunchEnabled: process.env.GOOGLE_CLASSROOM_AUTOLAUNCH === 'true',
    launchEvidence
  };
}

export function assertClassroomAdmin(request: Request) {
  const expected = process.env.RTPU_CLASSROOM_INTEGRATION_KEY;
  if (!expected) throw new Error('Google Classroom write gate is not configured');
  const supplied = request.headers.get('x-rtpu-classroom-key');
  if (!supplied || supplied !== expected) throw new Error('Unauthorized Google Classroom connector request');
}

async function classroomFetch(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json', ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) },
    cache: 'no-store'
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload ? JSON.stringify(payload) : String(payload);
    throw new Error(`Google Classroom API ${response.status}: ${detail}`);
  }
  return payload;
}

export const googleClassroom = {
  listCourses: (pageSize = 50) => classroomFetch(`/courses?pageSize=${Math.min(Math.max(pageSize, 1), 100)}`),
  createCourse: (course: Json) => classroomFetch('/courses', { method: 'POST', body: JSON.stringify(course) }),
  listTeachers: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/teachers`),
  addTeacher: (courseId: string, userId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/teachers`, { method: 'POST', body: JSON.stringify({ userId }) }),
  listStudents: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/students`),
  addStudent: (courseId: string, userId: string, enrollmentCode?: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/students${enrollmentCode ? `?enrollmentCode=${encodeURIComponent(enrollmentCode)}` : ''}`, { method: 'POST', body: JSON.stringify({ userId }) }),
  listCourseWork: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/courseWork`),
  createCourseWork: (courseId: string, courseWork: Json) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/courseWork`, { method: 'POST', body: JSON.stringify(courseWork) })
};

const institutionalPrograms = [
  { id: 'adult-hs-diploma', title: 'Adult Education High School Diploma', level: 'Secondary / Adult Education', courses: [
    ['ELA-1','English I','English Language Arts'],['ELA-2','English II','English Language Arts'],['ELA-3','English III','English Language Arts'],['ELA-4','English IV','English Language Arts'],['MATH-1','Algebra I','Mathematics'],['MATH-2','Geometry','Mathematics'],['MATH-3','Algebra II','Mathematics'],['SCI-1','Biology','Science'],['SCI-2','Chemistry','Science'],['SCI-3','Integrated Science','Science'],['SOC-1','World Geography','Social Studies'],['SOC-2','United States History','Social Studies'],['SOC-3','Government & Economics','Social Studies'],['LOTE-1','Spanish I','Languages Other Than English'],['LOTE-2','Spanish II','Languages Other Than English'],['PE-1','Physical Education & Health','Physical Education'],['FA-1','Fine Arts','Fine Arts'],['ELEC-1','College & Career Readiness','Elective'],['ELEC-2','Digital Literacy & Productivity','Elective'],['ELEC-3','Personal Finance & Consumer Skills','Elective'],['ELEC-4','Research, Communication & Capstone','Elective']
  ]},
  { id: 'texas-homeschool-diploma', title: 'Texas Homeschool Diploma', level: 'Secondary / Homeschool', courses: [
    ['TH-ELA-1','English I','English Language Arts'],['TH-ELA-2','English II','English Language Arts'],['TH-ELA-3','English III','English Language Arts'],['TH-ELA-4','English IV','English Language Arts'],['TH-MATH-1','Algebra I','Mathematics'],['TH-MATH-2','Geometry','Mathematics'],['TH-MATH-3','Algebra II','Mathematics'],['TH-SCI-1','Biology','Science'],['TH-SCI-2','Chemistry','Science'],['TH-SCI-3','Integrated Science','Science'],['TH-SOC-1','World Geography','Social Studies'],['TH-SOC-2','United States History','Social Studies'],['TH-SOC-3','Government & Economics','Social Studies'],['TH-LOTE-1','Spanish I','Languages Other Than English'],['TH-LOTE-2','Spanish II','Languages Other Than English'],['TH-PE-1','Physical Education & Health','Physical Education'],['TH-FA-1','Fine Arts','Fine Arts'],['TH-ELEC-1','College & Career Readiness','Elective'],['TH-ELEC-2','Digital Literacy & Productivity','Elective'],['TH-ELEC-3','Personal Finance & Consumer Skills','Elective'],['TH-ELEC-4','Research, Communication & Capstone','Elective']
  ]},
  { id: 'early-college-readiness', title: 'Early College & College Readiness', level: 'College Readiness', courses: [['ECR-101','College Readiness & TSI Preparation','College Readiness'],['ECR-110','Academic Writing','English'],['ECR-120','Quantitative Reasoning','Mathematics'],['ECR-130','College Success Seminar','College Success'],['ECR-140','Research & Information Literacy','Research'],['ECR-150','Dual Credit Orientation','College Readiness']]},
  { id: 'tax-professional-certificate-i', title: 'Tax Professional Certificate I', level: 'Career / Tax Professional', courses: [['TPC1-101','Federal Tax Foundations','Taxation'],['TPC1-110','Form 1040 Workflow','Taxation'],['TPC1-120','Filing Status, Dependents & Income','Taxation'],['TPC1-130','Credits & Due Diligence','Taxation'],['TPC1-140','Ethics, Records & Taxpayer Data Security','Practice Operations'],['TPC1-150','Tax Practice Lab I','Applied Tax Preparation']]},
  { id: 'tax-professional-certificate-ii', title: 'Tax Professional Certificate II', level: 'Career / Tax Professional', courses: [['TPC2-201','Schedule C & Sole Proprietor Taxation','Business Taxation'],['TPC2-210','Business Expenses & Recordkeeping','Business Taxation'],['TPC2-220','Depreciation Fundamentals','Business Taxation'],['TPC2-230','Payroll & Form 941 Fundamentals','Payroll Tax'],['TPC2-240','Information Returns & Reporting','Information Reporting'],['TPC2-250','Tax Practice Lab II','Applied Tax Preparation']]},
  { id: 'tax-practitioner-4-semester-diploma', title: 'Tax Practitioner Diploma — 4 Semester Program', level: 'Institutional Diploma', courses: [['TPD-S1','Semester 1 — Foundations & Individual Taxation','Taxation'],['TPD-S2','Semester 2 — Business, Payroll & Applied Tax Preparation','Taxation'],['TPD-S3','Semester 3 — ERO Operations, e-File & Practice Security','Practice Operations'],['TPD-S4','Semester 4 — Representation, Notices, Collections & Capstone','Tax Practice']]},
  { id: 'enrolled-agent-prep', title: 'Enrolled Agent Preparation', level: 'Professional Exam Preparation', courses: [['EA-P1','SEE Part 1 — Individuals','Enrolled Agent Exam Prep'],['EA-P2','SEE Part 2 — Businesses','Enrolled Agent Exam Prep'],['EA-P3','SEE Part 3 — Representation, Practices & Procedures','Enrolled Agent Exam Prep'],['EA-PEX','EA Practice Exams & Readiness','Enrolled Agent Exam Prep']]}
] as const;

export function getInstitutionalClassroomManifest() {
  const term = process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027';
  return institutionalPrograms.flatMap((program) => program.courses.map(([courseCode,title,subject]) => ({ programId: program.id, programTitle: program.title, level: program.level, courseCode, title, subject, term })));
}

export function getInstitutionalProgramCatalog() {
  return institutionalPrograms.map((program) => ({ id: program.id, title: program.title, level: program.level, courseCount: program.courses.length }));
}

export async function launchInstitutionalClassrooms() {
  const startedAtUtc = new Date().toISOString();
  const manifest = getInstitutionalClassroomManifest();
  const ownerId = process.env.GOOGLE_CLASSROOM_OWNER_ID || 'me';
  if (!classroomCredentialStatus().configured) {
    launchEvidence = { status: 'blocked-authorization-required', ownerId, startedAtUtc, finishedAtUtc: new Date().toISOString(), manifestCourseCount: manifest.length, created: 0, existing: 0, failed: 0 };
    return launchEvidence;
  }
  const listed = await googleClassroom.listCourses(100) as { courses?: Array<{ id?: string; name?: string; section?: string; courseState?: string; alternateLink?: string; enrollmentCode?: string }> };
  const current = Array.isArray(listed.courses) ? listed.courses : [];
  const byKey = new Map(current.map((course) => [`${course.name || ''}|${course.section || ''}`, course]));
  const results: Array<Record<string, unknown>> = [];
  let created = 0; let existing = 0; let failed = 0;
  for (const item of manifest) {
    const name = `${item.courseCode} — ${item.title}`;
    const section = `${item.term} | ${item.programTitle}`;
    const found = byKey.get(`${name}|${section}`);
    if (found) {
      existing += 1;
      results.push({ status: 'existing', courseCode: item.courseCode, courseId: found.id, courseState: found.courseState, alternateLink: found.alternateLink });
      continue;
    }
    try {
      const course = await googleClassroom.createCourse({ name, section, descriptionHeading: `${item.programTitle} • ${item.term}`, description: `Ross Tax Pro University | ${item.level} | ${item.subject}. Institutional online course.`, room: 'RTPU Online', ownerId, courseState: 'ACTIVE' }) as Record<string, unknown>;
      created += 1;
      results.push({ status: 'created', courseCode: item.courseCode, courseId: course.id || null, courseState: course.courseState || null, alternateLink: course.alternateLink || null, enrollmentCode: course.enrollmentCode || null });
      await new Promise((resolve) => setTimeout(resolve, 120));
    } catch (error) {
      failed += 1;
      results.push({ status: 'failed', courseCode: item.courseCode, error: error instanceof Error ? error.message : String(error) });
    }
  }
  launchEvidence = { status: failed === 0 ? 'completed' : 'completed-with-errors', ownerId, startedAtUtc, finishedAtUtc: new Date().toISOString(), manifestCourseCount: manifest.length, created, existing, failed, results };
  return launchEvidence;
}

if (process.env.GOOGLE_CLASSROOM_AUTOLAUNCH === 'true') {
  setTimeout(() => {
    launchInstitutionalClassrooms().catch((error) => {
      launchEvidence = { status: 'failed', ownerId: process.env.GOOGLE_CLASSROOM_OWNER_ID || 'me', finishedAtUtc: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
      console.error('RTPU Google Classroom autolaunch failed', launchEvidence);
    });
  }, 2500);
}
