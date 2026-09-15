import { classroomCredentialStatus, googleClassroom } from './google-classroom';

type ClassroomCourse = {
  id?: string;
  name?: string;
  section?: string;
  courseState?: string;
  alternateLink?: string;
  enrollmentCode?: string;
};

export type ClassroomManifestCourse = {
  programId: string;
  programTitle: string;
  courseCode: string;
  title: string;
  subject: string;
  level: string;
  term: string;
};

const programCatalog = [
  {
    id: 'adult-hs-diploma', title: 'Adult Education High School Diploma', level: 'Secondary / Adult Education',
    courses: [
      ['ELA-1','English I','English Language Arts'],['ELA-2','English II','English Language Arts'],['ELA-3','English III','English Language Arts'],['ELA-4','English IV','English Language Arts'],
      ['MATH-1','Algebra I','Mathematics'],['MATH-2','Geometry','Mathematics'],['MATH-3','Algebra II','Mathematics'],
      ['SCI-1','Biology','Science'],['SCI-2','Chemistry','Science'],['SCI-3','Integrated Science','Science'],
      ['SOC-1','World Geography','Social Studies'],['SOC-2','United States History','Social Studies'],['SOC-3','Government & Economics','Social Studies'],
      ['LOTE-1','Spanish I','Languages Other Than English'],['LOTE-2','Spanish II','Languages Other Than English'],['PE-1','Physical Education & Health','Physical Education'],['FA-1','Fine Arts','Fine Arts'],
      ['ELEC-1','College & Career Readiness','Elective'],['ELEC-2','Digital Literacy & Productivity','Elective'],['ELEC-3','Personal Finance & Consumer Skills','Elective'],['ELEC-4','Research, Communication & Capstone','Elective']
    ]
  },
  {
    id: 'texas-homeschool-diploma', title: 'Texas Homeschool Diploma', level: 'Secondary / Homeschool',
    courses: [
      ['TH-ELA-1','English I','English Language Arts'],['TH-ELA-2','English II','English Language Arts'],['TH-ELA-3','English III','English Language Arts'],['TH-ELA-4','English IV','English Language Arts'],
      ['TH-MATH-1','Algebra I','Mathematics'],['TH-MATH-2','Geometry','Mathematics'],['TH-MATH-3','Algebra II','Mathematics'],['TH-SCI-1','Biology','Science'],['TH-SCI-2','Chemistry','Science'],['TH-SCI-3','Integrated Science','Science'],
      ['TH-SOC-1','World Geography','Social Studies'],['TH-SOC-2','United States History','Social Studies'],['TH-SOC-3','Government & Economics','Social Studies'],['TH-LOTE-1','Spanish I','Languages Other Than English'],['TH-LOTE-2','Spanish II','Languages Other Than English'],
      ['TH-PE-1','Physical Education & Health','Physical Education'],['TH-FA-1','Fine Arts','Fine Arts'],['TH-ELEC-1','College & Career Readiness','Elective'],['TH-ELEC-2','Digital Literacy & Productivity','Elective'],['TH-ELEC-3','Personal Finance & Consumer Skills','Elective'],['TH-ELEC-4','Research, Communication & Capstone','Elective']
    ]
  },
  { id: 'early-college-readiness', title: 'Early College & College Readiness', level: 'College Readiness', courses: [
    ['ECR-101','College Readiness & TSI Preparation','College Readiness'],['ECR-110','Academic Writing','English'],['ECR-120','Quantitative Reasoning','Mathematics'],['ECR-130','College Success Seminar','College Success'],['ECR-140','Research & Information Literacy','Research'],['ECR-150','Dual Credit Orientation','College Readiness']
  ] },
  { id: 'tax-professional-certificate-i', title: 'Tax Professional Certificate I', level: 'Career / Tax Professional', courses: [
    ['TPC1-101','Federal Tax Foundations','Taxation'],['TPC1-110','Form 1040 Workflow','Taxation'],['TPC1-120','Filing Status, Dependents & Income','Taxation'],['TPC1-130','Credits & Due Diligence','Taxation'],['TPC1-140','Ethics, Records & Taxpayer Data Security','Practice Operations'],['TPC1-150','Tax Practice Lab I','Applied Tax Preparation']
  ] },
  { id: 'tax-professional-certificate-ii', title: 'Tax Professional Certificate II', level: 'Career / Tax Professional', courses: [
    ['TPC2-201','Schedule C & Sole Proprietor Taxation','Business Taxation'],['TPC2-210','Business Expenses & Recordkeeping','Business Taxation'],['TPC2-220','Depreciation Fundamentals','Business Taxation'],['TPC2-230','Payroll & Form 941 Fundamentals','Payroll Tax'],['TPC2-240','Information Returns & Reporting','Information Reporting'],['TPC2-250','Tax Practice Lab II','Applied Tax Preparation']
  ] },
  { id: 'tax-practitioner-4-semester-diploma', title: 'Tax Practitioner Diploma — 4 Semester Program', level: 'Institutional Diploma', courses: [
    ['TPD-S1','Semester 1 — Foundations & Individual Taxation','Taxation'],['TPD-S2','Semester 2 — Business, Payroll & Applied Tax Preparation','Taxation'],['TPD-S3','Semester 3 — ERO Operations, e-File & Practice Security','Practice Operations'],['TPD-S4','Semester 4 — Representation, Notices, Collections & Capstone','Tax Practice']
  ] },
  { id: 'enrolled-agent-prep', title: 'Enrolled Agent Preparation', level: 'Professional Exam Preparation', courses: [
    ['EA-P1','SEE Part 1 — Individuals','Enrolled Agent Exam Prep'],['EA-P2','SEE Part 2 — Businesses','Enrolled Agent Exam Prep'],['EA-P3','SEE Part 3 — Representation, Practices & Procedures','Enrolled Agent Exam Prep'],['EA-PEX','EA Practice Exams & Readiness','Enrolled Agent Exam Prep']
  ] }
] as const;

export function buildClassroomManifest(term = process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027'): ClassroomManifestCourse[] {
  return programCatalog.flatMap((program) => program.courses.map(([courseCode, title, subject]) => ({ programId: program.id, programTitle: program.title, courseCode, title, subject, level: program.level, term })));
}

export function classroomProgramCatalog() {
  return programCatalog.map((program) => ({ id: program.id, title: program.title, level: program.level, courseCount: program.courses.length }));
}

let lastProvisioningRun: Record<string, unknown> | null = null;

export function getClassroomProvisioningSnapshot() {
  const manifest = buildClassroomManifest();
  return { schemaVersion: '1.0', system: 'Ross Tax Pro University Google Classroom Provisioning', credentials: classroomCredentialStatus(), autolaunchEnabled: process.env.GOOGLE_CLASSROOM_AUTOLAUNCH === 'true', ownerId: process.env.GOOGLE_CLASSROOM_OWNER_ID || 'me', term: process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027', programCount: programCatalog.length, manifestCourseCount: manifest.length, programs: classroomProgramCatalog(), lastProvisioningRun };
}

export async function provisionGoogleClassroom(options: { active?: boolean } = {}) {
  const startedAtUtc = new Date().toISOString();
  const credentials = classroomCredentialStatus();
  const manifest = buildClassroomManifest();
  const ownerId = process.env.GOOGLE_CLASSROOM_OWNER_ID || 'me';
  const active = options.active !== false;

  if (!credentials.configured) {
    const blocked = { ok: false, status: 'blocked-authorization-required', startedAtUtc, finishedAtUtc: new Date().toISOString(), manifestCourseCount: manifest.length, created: 0, existing: 0, failed: 0, reason: 'Google Classroom credentials are not configured. Complete OAuth consent and persist GOOGLE_CLASSROOM_REFRESH_TOKEN before provisioning.' };
    lastProvisioningRun = blocked;
    return blocked;
  }

  const listed = await googleClassroom.listCourses(100) as { courses?: ClassroomCourse[] };
  const existingCourses = Array.isArray(listed.courses) ? listed.courses : [];
  const byKey = new Map(existingCourses.map((course) => [`${course.name || ''}|${course.section || ''}`, course]));
  const results: Array<Record<string, unknown>> = [];
  let created = 0; let existing = 0; let failed = 0;

  for (const item of manifest) {
    const name = `${item.courseCode} — ${item.title}`;
    const section = `${item.term} | ${item.programTitle}`;
    const key = `${name}|${section}`;
    const found = byKey.get(key);
    if (found) {
      existing += 1;
      results.push({ status: 'existing', courseCode: item.courseCode, courseId: found.id, courseState: found.courseState, alternateLink: found.alternateLink });
      continue;
    }
    try {
      const createdCourse = await googleClassroom.createCourse({
        name,
        section,
        descriptionHeading: `${item.programTitle} • ${item.term}`,
        description: `Ross Tax Pro University | ${item.level} | ${item.subject}. Managed institutional course for ${item.term}.`,
        room: 'RTPU Online',
        ownerId,
        courseState: active ? 'ACTIVE' : 'PROVISIONED'
      }) as ClassroomCourse;
      created += 1;
      results.push({ status: 'created', courseCode: item.courseCode, courseId: createdCourse.id, courseState: createdCourse.courseState, alternateLink: createdCourse.alternateLink, enrollmentCode: createdCourse.enrollmentCode });
      await new Promise((resolve) => setTimeout(resolve, 120));
    } catch (error) {
      failed += 1;
      results.push({ status: 'failed', courseCode: item.courseCode, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const run = { ok: failed === 0, status: failed === 0 ? 'completed' : 'completed-with-errors', startedAtUtc, finishedAtUtc: new Date().toISOString(), ownerId, term: process.env.GOOGLE_CLASSROOM_LAUNCH_TERM || '2026-2027', manifestCourseCount: manifest.length, created, existing, failed, results };
  lastProvisioningRun = run;
  return run;
}
