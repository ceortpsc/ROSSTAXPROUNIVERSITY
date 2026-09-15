import { useEffect, useState } from 'react';

type Json = Record<string, unknown>;

function useJson(path: string) {
  const [data, setData] = useState<Json | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    fetch(path, { headers: { accept: 'application/json' } })
      .then(async response => { if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return response.json(); })
      .then(value => active && setData(value))
      .catch(reason => active && setError(reason instanceof Error ? reason.message : String(reason)));
    return () => { active = false; };
  }, [path]);
  return { data, error };
}

function Page({ title, eyebrow, summary, children }: { title: string; eyebrow: string; summary: string; children: React.ReactNode }) {
  return <main className="page-shell"><section className="page-width">
    <header className="hero hero-premium"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{summary}</p><div className="hero-actions"><a className="button-link button-gold" href="/ai-campus">Open AI Campus</a><a className="button-link button-ghost" href="/ai-lecture">Start AI Lecture</a></div></header>
    <nav className="top-nav"><a href="/institution">University</a><a href="/ai-campus">AI Campus</a><a href="/ai-lecture">Lecture Studio</a><a href="/ai-agents">AI Faculty</a><a href="/programs">Programs</a><a href="/student/dashboard">Student</a><a href="/faculty/dashboard">Faculty</a><a href="/ai-assist">Engineering Assist</a><a href="/evidence">Evidence</a></nav>
    {children}
  </section></main>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="metric metric-premium"><strong>{value}</strong><span>{label}</span></div>; }

export function AiCampusPage() {
  const { data, error } = useJson('/api/lms');
  const agents = Array.isArray(data?.agents) ? data.agents as Array<Record<string, unknown>> : [];
  const programs = Array.isArray(data?.programs) ? data.programs as Array<Record<string, unknown>> : [];
  return <Page eyebrow="RTPU Native AI LMS" title="One online university powered by coordinated AI agents" summary="RTPU now owns the learning runtime end to end: programs, lecture simulation, tutoring, assessment design, advising, student success, registrar workflows, academic quality and university operations.">
    <div className="metric-grid"><Stat value="100%" label="online delivery"/><Stat value={String(agents.length || 13)} label="AI university agents"/><Stat value={String(programs.length || 7)} label="institutional programs"/><Stat value="0" label="external LMS dependencies"/></div>
    {error ? <div className="notice notice-error">AI LMS status error: {error}</div> : null}
    <section className="panel"><h2>AI university operating model</h2><div className="journey"><div><strong>Learn</strong><span>AI lectures, tutoring and practice</span></div><div><strong>Assess</strong><span>Formative checks, rubrics and remediation plans</span></div><div><strong>Advance</strong><span>Advising, progress planning and student success</span></div><div><strong>Administer</strong><span>Admissions, records and institutional workflows</span></div><div><strong>Improve</strong><span>Quality, accessibility and operations agents</span></div></div></section>
    <section className="card-grid">{agents.slice(0, 8).map(agent => <article className="card card-premium" key={String(agent.id)}><span className="card-eyebrow">{String(agent.domain)}</span><h3>{String(agent.label)}</h3><p>{String(agent.mandate)}</p></article>)}</section>
    <div className="two-column"><section className="panel"><h2>Start learning</h2><p>Generate a structured lecture simulation with objectives, worked reasoning, active recall, practice and a mastery check.</p><a className="button-link" href="/ai-lecture">Open Lecture Studio</a></section><section className="panel"><h2>Build a learning plan</h2><p>Use the Andreaa orchestration layer to build sequencing, checkpoints and student-success interventions for an RTPU goal.</p><a className="button-link" href="/student/dashboard">Open Student Workspace</a></section></div>
  </Page>;
}

export function AiAgentsPage() {
  const { data, error } = useJson('/api/lms/agents');
  const agents = Array.isArray(data?.agents) ? data.agents as Array<Record<string, unknown>> : [];
  return <Page eyebrow="AI Faculty & Operations Mesh" title="Reasoning agents across the entire online university" summary="Specialized agents collaborate by domain instead of pretending one generic assistant can safely perform every university responsibility.">
    {error ? <div className="notice notice-error">Agent registry error: {error}</div> : null}
    <section className="card-grid">{agents.map(agent => <article className="card card-premium" key={String(agent.id)}><span className="card-eyebrow">{String(agent.domain)}</span><h3>{String(agent.label)}</h3><p>{String(agent.mandate)}</p><strong>{String(agent.id)}</strong></article>)}</section>
    <section className="notice">AI agents assist with instruction, planning and workflow execution. High-impact admissions, employment, credential-authority and other institutionally sensitive decisions remain subject to human authorization and governing rules.</section>
  </Page>;
}

export function AiLecturePage() {
  const [topic, setTopic] = useState('Federal income tax filing status and dependency fundamentals');
  const [level, setLevel] = useState('career / tax practitioner');
  const [result, setResult] = useState<Json | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function generate() {
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/lms/lecture', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic, level, objectives: ['Define core rules', 'Work through an example', 'Check understanding'] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }
  return <Page eyebrow="AI Lecture Studio" title="Generate a structured online lecture simulation" summary="The lecturer, tutor, assessment, accessibility and academic-quality agents coordinate one instructional session with explicit objectives and evidence-oriented reasoning.">
    <section className="panel"><label className="form-label">Lecture topic</label><textarea rows={3} value={topic} onChange={event => setTopic(event.target.value)}/><label className="form-label">Learner level</label><input value={level} onChange={event => setLevel(event.target.value)}/><button onClick={generate} disabled={busy || !topic.trim()}>{busy ? 'Building lecture…' : 'Generate AI lecture'}</button>{error ? <div className="notice notice-error">{error}</div> : null}{result ? <pre className="code-block">{JSON.stringify(result, null, 2)}</pre> : null}</section>
  </Page>;
}

export function AiAssessmentPage() {
  const [topic, setTopic] = useState('Taxpayer data security and due diligence');
  const [result, setResult] = useState<Json | null>(null);
  async function generate() {
    const response = await fetch('/api/lms/assessment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic }) });
    setResult(await response.json());
  }
  return <Page eyebrow="Assessment Intelligence" title="Assessment and mastery blueprint studio" summary="Create formative assessment architecture with evidence targets, rubric dimensions, feedback loops, retries, remediation and accessibility safeguards."><section className="panel"><label className="form-label">Assessment topic</label><textarea rows={3} value={topic} onChange={event=>setTopic(event.target.value)}/><button onClick={generate}>Generate assessment blueprint</button>{result?<pre className="code-block">{JSON.stringify(result,null,2)}</pre>:null}</section></Page>;
}

export function routeAiUniversity(path: string) {
  if (path === '/ai-campus' || path === '/lms') return <AiCampusPage/>;
  if (path === '/ai-agents') return <AiAgentsPage/>;
  if (path === '/ai-lecture') return <AiLecturePage/>;
  if (path === '/ai-assessment') return <AiAssessmentPage/>;
  return null;
}
