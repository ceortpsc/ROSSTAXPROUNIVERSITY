import { useEffect, useState } from 'react';

type JsonValue = Record<string, unknown>;

const programs = [
  ['Adult Education High School Diploma','21-course secondary/adult education sequence'],
  ['Texas Homeschool Diploma','21-course Texas standards-aligned homeschool sequence'],
  ['Early College & College Readiness','6-course college-readiness sequence'],
  ['Tax Professional Certificate I','6-course tax foundations sequence'],
  ['Tax Professional Certificate II','6-course applied tax/business sequence'],
  ['Tax Practitioner Diploma — 4 Semester Program','4-semester institutional diploma sequence'],
  ['Enrolled Agent Preparation','4-course SEE preparation sequence']
];

export default function InstitutionPage() {
  const [classroom, setClassroom] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/google-classroom', { headers: { accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
      })
      .then(setClassroom)
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  const credentialStatus = classroom?.credentialStatus as Record<string, unknown> | undefined;
  const launchEvidence = credentialStatus?.launchEvidence as Record<string, unknown> | undefined;

  return (
    <main className="page-shell">
      <section className="page-width">
        <header className="hero">
          <div className="eyebrow">Ross Tax Pro University • Full Institution Online</div>
          <h1>RTPU Online Campus</h1>
          <p>Institutional programs, admissions, learning-management services, Google Classroom delivery, student/teacher access, workforce training and Andreaa Channel engineering are unified in one production campus.</p>
        </header>
        <nav className="top-nav" aria-label="Institution navigation">
          <a href="/">Home</a>
          <a href="/signin/student">Student Access</a>
          <a href="/signin/teacher">Faculty Access</a>
          <a href="https://rtpu-enrollment.onrender.com/">Enrollment</a>
          <a href="/admin/integrations/google-classroom">Google Classroom</a>
          <a href="/andreaa-channel">Andreaa Channel</a>
        </nav>

        <div className="metric-grid">
          <div className="metric"><strong>7</strong><span>seeded institutional programs</span></div>
          <div className="metric"><strong>68</strong><span>Google Classroom course shells</span></div>
          <div className="metric"><strong>2026–2027</strong><span>launch term</span></div>
          <div className="metric"><strong>{credentialStatus?.configured === true ? 'Connected' : 'Authorization required'}</strong><span>Google Classroom credentials</span></div>
        </div>

        {error ? <div className="notice notice-error">Classroom status error: {error}</div> : null}
        <section className="panel">
          <h2>Institution program catalog</h2>
          <div className="card-grid">
            {programs.map(([title, description]) => <article className="card" key={title}>
              <span className="card-eyebrow">Academic Program</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <strong>RTPU Online • Google Classroom delivery</strong>
            </article>)}
          </div>
        </section>

        <div className="two-column">
          <section className="panel">
            <h2>Admissions & onboarding</h2>
            <p>Prospective, transfer, foreign-exchange, RTPSC new-hire and PTIN-holder application pathways are served through the RTPU enrollment system.</p>
            <a className="button-link" href="https://rtpu-enrollment.onrender.com/">Open Enrollment Center</a>
          </section>
          <section className="panel">
            <h2>Google Classroom launch evidence</h2>
            <pre className="code-block">{JSON.stringify(launchEvidence ?? { status: 'checking' }, null, 2)}</pre>
          </section>
        </div>

        <section className="panel">
          <h2>Institution architecture</h2>
          <div className="tier-grid">
            <div className="tier"><strong>Academic delivery</strong><span>Google Classroom courses, rosters and coursework</span></div>
            <div className="tier"><strong>Enrollment</strong><span>Invites, applications, signatures and admissions clearances</span></div>
            <div className="tier"><strong>Identity & access</strong><span>Student, faculty and administrative access gateways</span></div>
            <div className="tier"><strong>Andreaa Channel</strong><span>Planning, architecture, generation and engineering control plane</span></div>
            <div className="tier"><strong>Operations</strong><span>Health, security, evidence, deployment and provider status</span></div>
            <div className="tier"><strong>Records</strong><span>Canonical application, program and LMS provisioning data contracts</span></div>
          </div>
        </section>
      </section>
    </main>
  );
}
