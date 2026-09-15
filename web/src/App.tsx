import { useEffect, useMemo, useState } from 'react';

type JsonValue = Record<string, unknown>;

type Card = {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
};

const nav: Card[] = [
  { title: 'Andreaa Channel', description: 'Capability and entitlement dashboard.', href: '/andreaa-channel', eyebrow: 'AI Operations' },
  { title: '10-Tier Engine', description: 'Reasoning, architecture, blueprint and engineering control plane.', href: '/andreaa-channel/engine', eyebrow: 'Engineering' },
  { title: 'Platform', description: 'OpenAPI, LMS, governance, deployment and operations.', href: '/andreaa-channel/platform', eyebrow: 'Control Plane' },
  { title: 'Enrollment', description: 'Invite, apply, electronically sign, convert and export RTPU program applications.', href: 'https://rtpu-enrollment.onrender.com/', eyebrow: 'Admissions & Onboarding' },
  { title: 'Operations', description: 'Health, security, maintenance, quotas and topology.', href: '/admin/operations', eyebrow: 'Production' },
  { title: 'Google Classroom', description: 'OAuth and Classroom integration control surface.', href: '/admin/integrations/google-classroom', eyebrow: 'LMS' }
];

function useJson(path: string) {
  const [data, setData] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(path, { headers: { accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
      })
      .then((value) => { if (!cancelled) setData(value); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, [path]);
  return { data, error };
}

function Shell({ children, title, eyebrow = 'Ross Tax Pro University' }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return (
    <main className="page-shell">
      <section className="page-width">
        <header className="hero">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>Andreaa Channel production engineering runtime powered by a provider-independent control plane, explicit API contracts and evidence-backed status reporting.</p>
        </header>
        <nav className="top-nav" aria-label="Primary">
          {nav.map((item) => <a key={item.href} href={item.href}>{item.title}</a>)}
        </nav>
        {children}
      </section>
    </main>
  );
}

function Cards() {
  return <div className="card-grid">{nav.map((item) => (
    <a className="card" key={item.href} href={item.href}>
      <span className="card-eyebrow">{item.eyebrow}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <strong>Open surface →</strong>
    </a>
  ))}</div>;
}

function EnginePage() {
  const { data, error } = useJson('/api/andreaa-channel/engine?tier=10');
  const tiers = Array.isArray(data?.tiers) ? data?.tiers as Array<Record<string, unknown>> : [];
  return <Shell title="Andreaa Channel — 10-Tier Reasoning & Software Engineering Engine" eyebrow="Standalone Engineering Runtime">
    <div className="metric-grid">
      <Metric value="10" label="internal tiers" />
      <Metric value="10×" label="max internal capacity" />
      <Metric value="32" label="max parallel stages" />
      <Metric value="100" label="max blueprint nodes" />
    </div>
    {error ? <Notice tone="error">Engine API error: {error}</Notice> : null}
    <section className="panel">
      <h2>Tier ladder</h2>
      <div className="tier-grid">
        {tiers.map((tier) => <div className="tier" key={String(tier.level)}>
          <strong>Tier {String(tier.level)} — {String(tier.name)}</strong>
          <span>{String(tier.internalCapacityMultiplier)}× capacity</span>
          <span>{String(tier.operatingMode)}</span>
        </div>)}
      </div>
    </section>
    <BlueprintConsole />
  </Shell>;
}

function BlueprintConsole() {
  const [objective, setObjective] = useState('Design a production-ready LMS enrollment workflow with role-based access, audit evidence and provider-safe retries.');
  const [result, setResult] = useState<JsonValue | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const response = await fetch('/api/andreaa-channel/engine', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ objective, tier: 10 })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setResult(body);
    } finally {
      setBusy(false);
    }
  }
  return <section className="panel">
    <h2>Blueprint generator</h2>
    <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={5} aria-label="Engineering objective" />
    <button onClick={run} disabled={busy || !objective.trim()}>{busy ? 'Generating…' : 'Generate Tier 10 blueprint'}</button>
    {result ? <pre className="code-block">{JSON.stringify(result, null, 2)}</pre> : null}
  </section>;
}

function PlatformPage() {
  const engine = useJson('/api/andreaa-channel/engine?tier=10');
  const lms = useJson('/api/lms/integrations');
  const providerCount = Array.isArray(lms.data?.providers) ? (lms.data?.providers as unknown[]).length : 0;
  return <Shell title="Andreaa Production Engineering Platform" eyebrow="Architecture • Contracts • LMS • Governance • Deployment">
    <div className="metric-grid">
      <Metric value={String((engine.data?.tier as Record<string, unknown> | undefined)?.level ?? '10')} label="active engine tier" />
      <Metric value={String(providerCount)} label="LMS adapters" />
      <Metric value="OpenAPI 3.1" label="contract format" />
      <Metric value="Fastify + Vite" label="runtime stack" />
    </div>
    <Cards />
    <Notice>Next.js has been removed from the production runtime path. Fastify owns the API/server layer and Vite builds the React client bundle.</Notice>
  </Shell>;
}

function AndreaaPage() {
  const { data, error } = useJson('/api/andreaa-channel/capabilities?plan=ultra-lte');
  const capabilities = Array.isArray(data?.capabilities) ? data?.capabilities as Array<Record<string, unknown>> : [];
  return <Shell title="Andreaa Channel — Ultra LTE" eyebrow="AI Operations">
    <div className="metric-grid">
      <Metric value="10×" label="Apex internal capacity ceiling" />
      <Metric value="Real-time" label="orchestration mode" />
      <Metric value="Evidence" label="completion policy" />
      <Metric value="Provider-safe" label="external entitlement policy" />
    </div>
    {error ? <Notice tone="error">Capability API error: {error}</Notice> : null}
    <div className="card-grid">
      {capabilities.map((capability) => <article className="card" key={String(capability.id)}>
        <span className="card-eyebrow">{String(capability.category || 'capability')}</span>
        <h3>{String(capability.label)}</h3>
        <p>{String(capability.description || '')}</p>
        <div className="status-row"><strong>{String(capability.status)}</strong><span>{String(capability.provider)}</span></div>
      </article>)}
    </div>
  </Shell>;
}

function OperationsPage() {
  const overview = useJson('/api/ops/overview');
  const health = useJson('/api/ops/health');
  return <Shell title="Operations Control Center" eyebrow="Production Operations">
    <div className="metric-grid">
      <Metric value={health.data?.ok === true ? 'Healthy' : 'Checking'} label="runtime health" />
      <Metric value="Fastify" label="server" />
      <Metric value="Vite" label="client build" />
      <Metric value="No-store" label="API cache policy" />
    </div>
    <section className="panel"><h2>Runtime snapshot</h2><pre className="code-block">{JSON.stringify(overview.data ?? { loading: true }, null, 2)}</pre></section>
  </Shell>;
}

function ClassroomPage() {
  const { data } = useJson('/api/integrations/google-classroom');
  return <Shell title="Google Classroom Integration" eyebrow="LMS • OAuth 2.0">
    <div className="two-column">
      <section className="panel">
        <h2>Connector status</h2>
        <pre className="code-block">{JSON.stringify(data ?? { loading: true }, null, 2)}</pre>
      </section>
      <section className="panel">
        <h2>Authorization</h2>
        <p>Start a fresh authorization in the same browser session that will complete Google consent.</p>
        <a className="button-link" href="/api/integrations/google-classroom/oauth/start">Authorize Google Classroom</a>
        <p className="muted">The callback remains compatible with the existing production redirect URI.</p>
      </section>
    </div>
  </Shell>;
}

function AccessPage({ role }: { role: string }) {
  return <Shell title={`${role} Access`} eyebrow="Identity & Access">
    <section className="panel"><h2>Access gateway</h2><p>This compatibility route remains available during the runtime migration. SSO and role-provider wiring remain configuration-driven.</p><a className="button-link" href="/">Return home</a></section>
  </Shell>;
}

function HomePage() {
  return <Shell title="Ross Tax Pro University — Andreaa Channel" eyebrow="Production Runtime v2">
    <div className="metric-grid">
      <Metric value="Fastify" label="API & server runtime" />
      <Metric value="Vite" label="client build system" />
      <Metric value="React" label="client rendering" />
      <Metric value="OpenAPI 3.1" label="contracted APIs" />
    </div>
    <Cards />
  </Shell>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return <div className={`notice ${tone === 'error' ? 'notice-error' : ''}`}>{children}</div>;
}

export default function App() {
  const path = useMemo(() => window.location.pathname.replace(/\/$/, '') || '/', []);
  if (path === '/andreaa-channel/engine') return <EnginePage />;
  if (path === '/andreaa-channel/platform') return <PlatformPage />;
  if (path === '/andreaa-channel') return <AndreaaPage />;
  if (path === '/admin/operations') return <OperationsPage />;
  if (path === '/admin/integrations/google-classroom') return <ClassroomPage />;
  if (path === '/signin/student' || path === '/student') return <AccessPage role="Student" />;
  if (path === '/signin/teacher' || path === '/teacher') return <AccessPage role="Teacher" />;
  if (path === '/signin') return <AccessPage role="Secure Sign-In" />;
  if (path === '/access-pending') return <AccessPage role="Access Pending" />;
  if (path === '/credentials') return <AccessPage role="Credentials" />;
  if (path === '/degree-authority') return <AccessPage role="Degree Authority" />;
  return <HomePage />;
}
