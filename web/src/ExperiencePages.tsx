import { useEffect, useMemo, useState } from 'react';

type Json = Record<string, unknown>;
type Program = { id: string; title: string; type: string; summary: string; cta: string };

const programs: Program[] = [
  { id: 'adult-hs-diploma', title: 'Adult Education High School Diploma', type: 'Secondary / Adult Education', summary: 'Structured secondary coursework with college, career and digital-readiness supports.', cta: 'Apply for Adult Diploma' },
  { id: 'texas-homeschool-diploma', title: 'Texas Homeschool Diploma', type: 'Texas standards-aligned homeschool', summary: 'Parent-directed homeschool pathway with RTPU curriculum, records and instructional support.', cta: 'Explore Homeschool Track' },
  { id: 'early-college-readiness', title: 'Early College & College Readiness', type: 'College Readiness', summary: 'Academic writing, quantitative reasoning, research, college success and dual-credit orientation.', cta: 'Start College Readiness' },
  { id: 'tax-professional-certificate-i', title: 'Tax Professional Certificate I', type: 'Career / Tax Professional', summary: 'Federal individual tax foundations, due diligence, records and applied preparation.', cta: 'Start Certificate I' },
  { id: 'tax-professional-certificate-ii', title: 'Tax Professional Certificate II', type: 'Career / Tax Professional', summary: 'Business taxation, payroll, information reporting and advanced practice labs.', cta: 'Start Certificate II' },
  { id: 'tax-practitioner-diploma', title: 'Tax Practitioner Diploma — 4 Semester Program', type: 'Institutional Diploma', summary: 'Four-semester progression from individual taxation through practice operations, notices and capstone.', cta: 'Apply to Diploma Program' },
  { id: 'enrolled-agent-prep', title: 'Enrolled Agent Preparation', type: 'Professional Exam Preparation', summary: 'SEE preparation across individuals, businesses, representation and exam readiness.', cta: 'Join EA Prep' }
];

const releases = [
  ['Alpha', 'Architecture experiments and internal capability discovery', 'design-reviewed + security-reviewed'],
  ['Beta', 'Integrated feature validation with production-safe provider gates', 'contract-stable + observability-ready'],
  ['Release Candidate', 'Frozen interfaces, rollback evidence and launch rehearsal', 'release-checklist-complete'],
  ['Stable', 'Current production campus and supported interfaces', 'deployed + health-evidence'],
  ['Next', 'Forward-compatible roadmap and staged improvements', 'explicit promotion only']
];

function useJson(path: string) {
  const [data, setData] = useState<Json | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    fetch(path, { headers: { accept: 'application/json' } }).then(async response => {
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.json();
    }).then(value => active && setData(value)).catch(reason => active && setError(reason instanceof Error ? reason.message : String(reason)));
    return () => { active = false; };
  }, [path]);
  return { data, error };
}

function Page({ eyebrow, title, summary, children }: { eyebrow: string; title: string; summary: string; children: React.ReactNode }) {
  return <main className="page-shell"><section className="page-width">
    <header className="hero hero-premium"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{summary}</p><div className="hero-actions"><a className="button-link button-gold" href="/programs">Explore Programs</a><a className="button-link button-ghost" href="https://rtpu-enrollment.onrender.com/">Apply / Enroll</a></div></header>
    <nav className="top-nav" aria-label="Campus"><a href="/institution">Campus</a><a href="/programs">Programs</a><a href="/student/dashboard">Student</a><a href="/faculty/dashboard">Faculty</a><a href="/records">Records</a><a href="/ai-assist">AI Assist</a><a href="/engineering">Engineering</a><a href="/releases">Releases</a><a href="/help">Help</a></nav>
    {children}
  </section></main>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="metric metric-premium"><strong>{value}</strong><span>{label}</span></div>; }

export function ProgramsPage() {
  return <Page eyebrow="Academic Catalog" title="Programs built for completion, practice and progression" summary="RTPU unifies secondary, college-readiness and tax-professional pathways with admissions, LMS delivery, student records and evidence-backed provider integration.">
    <div className="metric-grid"><Stat value="7" label="institutional programs"/><Stat value="68" label="seeded LMS course shells"/><Stat value="4" label="diploma semesters"/><Stat value="2026–2027" label="launch term"/></div>
    <section className="card-grid">{programs.map(program => <article className="card card-premium" key={program.id}><span className="card-eyebrow">{program.type}</span><h3>{program.title}</h3><p>{program.summary}</p><div className="card-actions"><a className="text-cta" href={`/programs/${program.id}`}>View program →</a><a className="text-cta" href="https://rtpu-enrollment.onrender.com/">{program.cta} →</a></div></article>)}</section>
  </Page>;
}

export function ProgramDetailPage({ id }: { id: string }) {
  const program = programs.find(item => item.id === id) || programs[0];
  const diploma = program.id === 'tax-practitioner-diploma';
  return <Page eyebrow={program.type} title={program.title} summary={program.summary}>
    <div className="two-column"><section className="panel"><h2>Program outcomes</h2><ul className="feature-list"><li>Structured online learning path</li><li>Google Classroom-ready delivery model</li><li>Admissions and signed application workflow</li><li>Records, support and progress interfaces</li><li>Evidence-aware completion and external-provider boundaries</li></ul></section><section className="panel"><h2>Enrollment actions</h2><p>Complete the appropriate RTPU application track. External credentials, licensure, financial aid or government status are never represented as approved until the responsible authority verifies them.</p><a className="button-link" href="https://rtpu-enrollment.onrender.com/">Start application</a></section></div>
    {diploma ? <section className="panel"><h2>Four-semester diploma sequence</h2><div className="journey"><div><strong>Semester 1</strong><span>Foundations & Individual Taxation</span></div><div><strong>Semester 2</strong><span>Business, Payroll & Applied Tax Preparation</span></div><div><strong>Semester 3</strong><span>ERO Operations, e-File & Practice Security</span></div><div><strong>Semester 4</strong><span>Representation, Notices, Collections & Capstone</span></div></div></section> : null}
  </Page>;
}

export function StudentDashboardPage() {
  return <Page eyebrow="Student Experience" title="Student dashboard" summary="A unified workspace for program progress, Classroom access, records, support, milestones and next actions.">
    <div className="metric-grid"><Stat value="My Program" label="active pathway"/><Stat value="Classroom" label="course delivery"/><Stat value="Records" label="transcript & documents"/><Stat value="Support" label="student services"/></div>
    <section className="dashboard-grid"><a className="workspace-card" href="/programs"><strong>Learning plan</strong><span>Programs, courses and progression</span></a><a className="workspace-card" href="/admin/integrations/google-classroom"><strong>Google Classroom</strong><span>Provider connection and course access</span></a><a className="workspace-card" href="/records"><strong>Academic records</strong><span>Enrollment records and transcript requests</span></a><a className="workspace-card" href="/help"><strong>Student services</strong><span>Help, accessibility and enrollment support</span></a></section>
  </Page>;
}

export function FacultyDashboardPage() {
  return <Page eyebrow="Faculty Experience" title="Faculty operations workspace" summary="Instructional delivery, rosters, coursework, program mapping and quality controls in one faculty-facing surface.">
    <div className="dashboard-grid"><a className="workspace-card" href="/admin/integrations/google-classroom"><strong>Classroom operations</strong><span>Courses, teachers, rosters and coursework</span></a><a className="workspace-card" href="/programs"><strong>Curriculum map</strong><span>Institution programs and course sequences</span></a><a className="workspace-card" href="/engineering"><strong>Quality standards</strong><span>Evidence, accessibility and release principles</span></a><a className="workspace-card" href="/help"><strong>Faculty support</strong><span>Platform and instructional support</span></a></section>
  </Page>;
}

export function RecordsPage() {
  return <Page eyebrow="Registrar" title="Records & transcript center" summary="A production interface for enrollment records, transcript requests, transfer-review status and document lifecycle visibility.">
    <section className="two-column"><div className="panel"><h2>Student records</h2><p>Canonical enrollment packages retain application identity, program selection, electronic-signature evidence and conversion metadata.</p><a className="button-link" href="https://rtpu-enrollment.onrender.com/">Enrollment center</a></div><div className="panel"><h2>Transcript services</h2><p>Transfer-credit and transcript decisions remain pending until the institution receives and evaluates acceptable evidence.</p><a className="button-link" href="/help">Request assistance</a></div></section>
  </Page>;
}

export function HelpPage() {
  return <Page eyebrow="Student Services" title="Help center" summary="Clear pathways for enrollment, LMS access, records, accessibility, technical support and institutional questions.">
    <section className="card-grid"><article className="card"><h3>Enrollment support</h3><p>Applications, invites, transfer/exchange intake and new-hire student workflows.</p><a className="text-cta" href="https://rtpu-enrollment.onrender.com/">Open enrollment →</a></article><article className="card"><h3>LMS support</h3><p>Google Classroom authorization, course access and provider status.</p><a className="text-cta" href="/admin/integrations/google-classroom">Open LMS status →</a></article><article className="card"><h3>Platform support</h3><p>Runtime health, production operations and release evidence.</p><a className="text-cta" href="/admin/operations">Open operations →</a></article></section>
  </Page>;
}

export function EngineeringPage() {
  return <Page eyebrow="Engineering System" title="Production engineering principles" summary="RTPU uses explicit contracts, fail-closed provider writes, evidence-before-assertion and release gates to keep the platform fast, observable and supportable.">
    <section className="principle-grid">{['Evidence before assertion','Fail closed on provider writes','Least privilege','Versioned contracts','Deterministic release gates','Observability by default','Idempotent provisioning','Rollbackable deployments','Accessible responsive interfaces','Performance budgets','Privacy & data minimization','Human approval for high-impact actions'].map((item,index)=><div className="principle" key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></div>)}</section>
    <section className="panel"><h2>Runtime architecture</h2><div className="journey"><div><strong>Client</strong><span>React + Vite</span></div><div><strong>API</strong><span>Fastify + TypeScript</span></div><div><strong>AI Assist</strong><span>Andreaa 10-tier engine</span></div><div><strong>LMS</strong><span>Google Classroom adapter</span></div><div><strong>Deployment</strong><span>GitHub → Render</span></div></div></section>
  </Page>;
}

export function ReleasesPage() {
  return <Page eyebrow="Release Engineering" title="Alpha → Beta → RC → Stable → Next" summary="Every RTPU advancement has an explicit purpose, promotion gate and evidence boundary. Production does not inherit experimental claims automatically.">
    <section className="release-lane">{releases.map(([name,purpose,gate],index)=><article className="release-card" key={name}><span className="release-index">0{index+1}</span><h3>{name}</h3><p>{purpose}</p><strong>Gate: {gate}</strong></article>)}</section>
  </Page>;
}

export function AiAssistPage() {
  const [objective, setObjective] = useState('Review the RTPU online institution architecture and produce the next production engineering blueprint.');
  const [context, setContext] = useState('Prioritize reliability, accessible UX, provider-safe integrations, evidence and performance.');
  const [result, setResult] = useState<Json | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/andreaa-channel/assist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ objective, context, tier: 10, mode: 'architecture' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }
  return <Page eyebrow="Andreaa Channel" title="AI engineering assist" summary="Turn a platform objective into an evidence-oriented architecture and execution blueprint using the RTPU 10-tier engineering engine.">
    <section className="panel"><label className="form-label">Objective</label><textarea rows={4} value={objective} onChange={e=>setObjective(e.target.value)}/><label className="form-label">Context / constraints</label><textarea rows={4} value={context} onChange={e=>setContext(e.target.value)}/><button onClick={run} disabled={busy || !objective.trim()}>{busy ? 'Engineering…' : 'Generate production blueprint'}</button>{error ? <div className="notice notice-error">{error}</div> : null}{result ? <pre className="code-block">{JSON.stringify(result,null,2)}</pre> : null}</section>
  </Page>;
}

export function PlatformEvidencePage() {
  const { data, error } = useJson('/api/platform/evidence');
  return <Page eyebrow="Evidence" title="Production platform evidence" summary="Machine-readable runtime, route, module and release evidence from the live RTPU platform.">{error ? <div className="notice notice-error">{error}</div> : null}<section className="panel"><pre className="code-block">{JSON.stringify(data ?? { loading: true }, null, 2)}</pre></section></Page>;
}

export function routeExperience(path: string) {
  if (path === '/programs') return <ProgramsPage/>;
  if (path.startsWith('/programs/')) return <ProgramDetailPage id={path.split('/').pop() || ''}/>;
  if (path === '/student/dashboard') return <StudentDashboardPage/>;
  if (path === '/faculty/dashboard') return <FacultyDashboardPage/>;
  if (path === '/records') return <RecordsPage/>;
  if (path === '/help') return <HelpPage/>;
  if (path === '/engineering') return <EngineeringPage/>;
  if (path === '/releases') return <ReleasesPage/>;
  if (path === '/ai-assist') return <AiAssistPage/>;
  if (path === '/evidence') return <PlatformEvidencePage/>;
  return null;
}
