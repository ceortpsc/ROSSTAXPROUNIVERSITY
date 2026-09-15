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
  const [lms, setLms] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lms', { headers: { accept: 'application/json' } })
      .then(async response => { if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return response.json(); })
      .then(setLms)
      .catch(reason => setError(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  const agents = Array.isArray(lms?.agents) ? lms.agents as Array<Record<string, unknown>> : [];

  return <main className="page-shell"><section className="page-width">
    <header className="hero hero-premium"><div className="eyebrow">Ross Tax Pro University • 100% Online AI Institution</div><h1>RTPU AI-Powered Online Campus</h1><p>Institutional programs, admissions, native learning management, AI lecture simulation, tutoring, assessment design, advising, records, student success, faculty support and Andreaa Channel engineering operate as one RTPU-owned online university platform.</p><div className="hero-actions"><a className="button-link button-gold" href="/ai-campus">Enter AI Campus</a><a className="button-link button-ghost" href="https://rtpu-enrollment.onrender.com/">Apply / Enroll</a></div></header>
    <nav className="top-nav" aria-label="Institution navigation"><a href="/">Home</a><a href="/ai-campus">AI Campus</a><a href="/ai-lecture">Lecture Studio</a><a href="/ai-agents">AI Faculty</a><a href="/student/dashboard">Student</a><a href="/faculty/dashboard">Faculty</a><a href="https://rtpu-enrollment.onrender.com/">Enrollment</a><a href="/andreaa-channel">Andreaa Channel</a></nav>

    <div className="metric-grid"><div className="metric metric-premium"><strong>100%</strong><span>online institution</span></div><div className="metric metric-premium"><strong>13</strong><span>reasoning agents</span></div><div className="metric metric-premium"><strong>7</strong><span>institutional programs</span></div><div className="metric metric-premium"><strong>0</strong><span>external LMS dependencies</span></div></div>

    {error ? <div className="notice notice-error">AI LMS status error: {error}</div> : null}
    <section className="panel"><h2>Institution program catalog</h2><div className="card-grid">{programs.map(([title,description]) => <article className="card card-premium" key={title}><span className="card-eyebrow">Academic Program</span><h3>{title}</h3><p>{description}</p><strong>RTPU Native AI LMS delivery</strong></article>)}</div></section>

    <div className="two-column"><section className="panel"><h2>Admissions & onboarding</h2><p>Prospective, transfer, foreign-exchange, RTPSC new-hire and PTIN-holder application pathways are served through the RTPU enrollment system.</p><a className="button-link" href="https://rtpu-enrollment.onrender.com/">Open Enrollment Center</a></section><section className="panel"><h2>AI university runtime</h2><pre className="code-block">{JSON.stringify({ deliveryModel: lms?.deliveryModel ?? 'checking', externalLmsDependency: lms?.externalLmsDependency ?? false, agentCount: agents.length || 13, capabilities: lms?.capabilities ?? [] }, null, 2)}</pre></section></div>

    <section className="panel"><h2>Institution architecture</h2><div className="tier-grid"><div className="tier"><strong>Academic delivery</strong><span>RTPU-native courses, AI lectures, tutoring, practice and assessment</span></div><div className="tier"><strong>Enrollment</strong><span>Invites, applications, signatures and admissions clearances</span></div><div className="tier"><strong>Identity & access</strong><span>Student, faculty and administrative access gateways</span></div><div className="tier"><strong>AI faculty mesh</strong><span>Provost, lecturer, tutor, advisor, registrar, quality, accessibility and operations agents</span></div><div className="tier"><strong>Andreaa Channel</strong><span>Planning, architecture, generation and engineering control plane</span></div><div className="tier"><strong>Records & quality</strong><span>Academic records, evidence, accessibility and release controls</span></div></div></section>
  </section></main>;
}
