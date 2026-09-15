import { useEffect, useMemo, useState } from 'react';
import InstitutionPage from './InstitutionPage';
import { routeExperience } from './ExperiencePages';
import { routeAiUniversity } from './AiUniversityPages';

type JsonValue = Record<string, unknown>;
type Card = { title: string; description: string; href: string; eyebrow: string };

const nav: Card[] = [
  { title: 'Online Institution', description: 'Full RTPU online campus, programs, admissions and native AI learning delivery.', href: '/institution', eyebrow: 'University' },
  { title: 'AI Campus', description: 'RTPU-native AI LMS for instruction, tutoring, assessment, advising and university operations.', href: '/ai-campus', eyebrow: 'AI University' },
  { title: 'AI Lecture Studio', description: 'Structured lecture simulations with reasoning, practice and mastery checks.', href: '/ai-lecture', eyebrow: 'Instruction' },
  { title: 'AI Faculty', description: 'Specialized reasoning agents for the full university operating model.', href: '/ai-agents', eyebrow: 'Agent Mesh' },
  { title: 'Programs', description: 'Secondary, college-readiness and tax-professional programs.', href: '/programs', eyebrow: 'Academic Catalog' },
  { title: 'Student', description: 'Student learning, records and support workspace.', href: '/student/dashboard', eyebrow: 'Student Experience' },
  { title: 'Faculty', description: 'Faculty course, curriculum and quality-control workspace.', href: '/faculty/dashboard', eyebrow: 'Faculty Experience' },
  { title: 'Andreaa Channel', description: 'Capability and reasoning-agent dashboard.', href: '/andreaa-channel', eyebrow: 'AI Operations' },
  { title: 'AI Assist', description: 'Tier-10 architecture and production blueprint assistant.', href: '/ai-assist', eyebrow: 'Engineering Assist' },
  { title: '10-Tier Engine', description: 'Reasoning, architecture, blueprint and engineering control plane.', href: '/andreaa-channel/engine', eyebrow: 'Engineering' },
  { title: 'Engineering', description: 'Principles, architecture and quality standards.', href: '/engineering', eyebrow: 'Platform' },
  { title: 'Releases', description: 'Alpha, beta, RC, stable and next promotion model.', href: '/releases', eyebrow: 'Release Engineering' },
  { title: 'Enrollment', description: 'Invite, apply, electronically sign, convert and export applications.', href: 'https://rtpu-enrollment.onrender.com/', eyebrow: 'Admissions & Onboarding' },
  { title: 'Operations', description: 'Health, security, maintenance, quotas and topology.', href: '/admin/operations', eyebrow: 'Production' }
];

function useJson(path: string) {
  const [data, setData] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(path, { headers: { accept: 'application/json' } })
      .then(async response => { if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return response.json(); })
      .then(value => { if (!cancelled) setData(value); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, [path]);
  return { data, error };
}

function Shell({ children, title, eyebrow = 'Ross Tax Pro University' }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return <main className="page-shell"><section className="page-width">
    <header className="hero hero-premium"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>RTPU is a 100% online institution powered by its own Fastify/Vite platform, native AI learning runtime, admissions services and the Andreaa Channel reasoning and engineering control plane.</p><div className="hero-actions"><a className="button-link button-gold" href="/ai-campus">Open AI Campus</a><a className="button-link button-ghost" href="https://rtpu-enrollment.onrender.com/">Apply / Enroll</a></div></header>
    <nav className="top-nav" aria-label="Primary">{nav.map(item => <a key={item.href} href={item.href}>{item.title}</a>)}</nav>
    {children}
  </section></main>;
}

function Cards() { return <div className="card-grid">{nav.map(item => <a className="card card-premium" key={item.href} href={item.href}><span className="card-eyebrow">{item.eyebrow}</span><h3>{item.title}</h3><p>{item.description}</p><strong>Open surface →</strong></a>)}</div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="metric metric-premium"><strong>{value}</strong><span>{label}</span></div>; }
function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) { return <div className={`notice ${tone === 'error' ? 'notice-error' : ''}`}>{children}</div>; }

function EnginePage() {
  const { data, error } = useJson('/api/andreaa-channel/engine?tier=10');
  const tiers = Array.isArray(data?.tiers) ? data.tiers as Array<Record<string, unknown>> : [];
  return <Shell title="Andreaa Channel — 10-Tier Reasoning & Software Engineering Engine" eyebrow="Standalone Engineering Runtime"><div className="metric-grid"><Metric value="10" label="internal tiers"/><Metric value="10×" label="max internal capacity"/><Metric value="32" label="max parallel stages"/><Metric value="100" label="max blueprint nodes"/></div>{error ? <Notice tone="error">Engine API error: {error}</Notice> : null}<section className="panel"><h2>Tier ladder</h2><div className="tier-grid">{tiers.map(tier => <div className="tier" key={String(tier.level)}><strong>Tier {String(tier.level)} — {String(tier.name)}</strong><span>{String(tier.internalCapacityMultiplier)}× capacity</span><span>{String(tier.operatingMode)}</span></div>)}</div></section><BlueprintConsole/></Shell>;
}

function BlueprintConsole() {
  const [objective, setObjective] = useState('Design a production-ready AI LMS enrollment and instruction workflow with role-based access, audit evidence and safe execution gates.');
  const [result, setResult] = useState<JsonValue | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); try { const response = await fetch('/api/andreaa-channel/engine',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({objective,tier:10})}); const body=await response.json(); if(!response.ok) throw new Error(body.error||`HTTP ${response.status}`); setResult(body); } finally { setBusy(false); } }
  return <section className="panel"><h2>Blueprint generator</h2><textarea value={objective} onChange={event=>setObjective(event.target.value)} rows={5}/><button onClick={run} disabled={busy||!objective.trim()}>{busy?'Generating…':'Generate Tier 10 blueprint'}</button>{result?<pre className="code-block">{JSON.stringify(result,null,2)}</pre>:null}</section>;
}

function PlatformPage() {
  const engine = useJson('/api/andreaa-channel/engine?tier=10');
  const lms = useJson('/api/lms/integrations');
  return <Shell title="Andreaa Production Engineering Platform" eyebrow="Architecture • Native AI LMS • Governance • Deployment"><div className="metric-grid"><Metric value={String((engine.data?.tier as Record<string, unknown>|undefined)?.level??'10')} label="active engine tier"/><Metric value={lms.data?.provider ? 'Native' : 'Checking'} label="LMS runtime"/><Metric value="OpenAPI 3.1" label="contract format"/><Metric value="Fastify + Vite" label="runtime stack"/></div><Cards/><Notice>RTPU owns the LMS runtime directly; external LMS dependencies are removed from the active production architecture.</Notice></Shell>;
}

function AndreaaPage() {
  const { data, error } = useJson('/api/andreaa-channel/capabilities?plan=ultra-lte');
  const capabilities = Array.isArray(data?.capabilities) ? data.capabilities as Array<Record<string, unknown>> : [];
  return <Shell title="Andreaa Channel — Ultra LTE" eyebrow="AI Operations"><div className="metric-grid"><Metric value="10×" label="Apex internal capacity ceiling"/><Metric value="13" label="AI university agents"/><Metric value="Evidence" label="completion policy"/><Metric value="Native LMS" label="learning runtime"/></div>{error?<Notice tone="error">Capability API error: {error}</Notice>:null}<div className="card-grid">{capabilities.map(capability=><article className="card" key={String(capability.id)}><span className="card-eyebrow">{String(capability.category||'capability')}</span><h3>{String(capability.label)}</h3><p>{String(capability.description||'')}</p><div className="status-row"><strong>{String(capability.status)}</strong><span>{String(capability.provider)}</span></div></article>)}</div></Shell>;
}

function OperationsPage() {
  const overview=useJson('/api/ops/overview'); const health=useJson('/api/ops/health');
  return <Shell title="Operations Control Center" eyebrow="Production Operations"><div className="metric-grid"><Metric value={health.data?.ok===true?'Healthy':'Checking'} label="runtime health"/><Metric value="Fastify" label="server"/><Metric value="Vite" label="client build"/><Metric value="AI LMS" label="learning runtime"/></div><section className="panel"><h2>Runtime snapshot</h2><pre className="code-block">{JSON.stringify(overview.data??{loading:true},null,2)}</pre></section><a className="button-link" href="/evidence">Open production evidence</a></Shell>;
}

function AccessPage({role}:{role:string}) { return <Shell title={`${role} Access`} eyebrow="Identity & Access"><section className="panel"><h2>Access gateway</h2><p>Role-provider wiring remains configuration-driven for RTPU online programs.</p><a className="button-link" href={role==='Student'?'/student/dashboard':role==='Teacher'?'/faculty/dashboard':'/institution'}>Continue</a></section></Shell>; }
function HomePage(){ return <Shell title="Ross Tax Pro University — AI-Powered Online Institution" eyebrow="Production Runtime v4"><div className="metric-grid"><Metric value="100%" label="online university"/><Metric value="13" label="reasoning agents"/><Metric value="7" label="institutional programs"/><Metric value="0" label="external LMS dependencies"/></div><Cards/></Shell>; }

export default function App() {
  const path=useMemo(()=>window.location.pathname.replace(/\/$/,'')||'/',[]);
  const ai=routeAiUniversity(path); if(ai) return ai;
  const experience=routeExperience(path); if(experience) return experience;
  if(path==='/institution') return <InstitutionPage/>;
  if(path==='/andreaa-channel/engine') return <EnginePage/>;
  if(path==='/andreaa-channel/platform') return <PlatformPage/>;
  if(path==='/andreaa-channel') return <AndreaaPage/>;
  if(path==='/admin/operations') return <OperationsPage/>;
  if(path==='/signin/student'||path==='/student') return <AccessPage role="Student"/>;
  if(path==='/signin/teacher'||path==='/teacher') return <AccessPage role="Teacher"/>;
  if(path==='/signin') return <AccessPage role="Secure Sign-In"/>;
  if(path==='/access-pending') return <AccessPage role="Access Pending"/>;
  if(path==='/credentials') return <AccessPage role="Credentials"/>;
  if(path==='/degree-authority') return <AccessPage role="Degree Authority"/>;
  return <HomePage/>;
}
