import { getAndreaaRuntimeSnapshot } from '../../lib/andreaa-channel';

export const dynamic = 'force-dynamic';

const statusLabel: Record<string, string> = {
  active: 'ACTIVE',
  'adapter-ready': 'ADAPTER READY',
  'provider-gated': 'PROVIDER GATED',
  'age-gated': 'AGE / PROVIDER GATED',
  disabled: 'DISABLED'
};

export default function AndreaaChannelPage() {
  const runtime = getAndreaaRuntimeSnapshot('ultra-lte');

  return (
    <main style={{ minHeight: '100vh', background: '#f7f2e8', padding: '36px 18px', color: '#111827' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ background: '#0b1f3a', color: '#fff', padding: 30, borderRadius: 22, border: '1px solid #c9a227' }}>
          <div style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d4af37' }}>Ross Tax Pro University • AI Operations</div>
          <h1 style={{ margin: '8px 0', fontSize: 38 }}>Andreaa Channel — Ultra LTE</h1>
          <p style={{ margin: 0, maxWidth: 900, lineHeight: 1.6, color: '#e5e7eb' }}>
            Real-time persona, reasoning agent, assistant, employee and workflow orchestrator with a 5× Andreaa Channel internal capacity multiplier. External provider quotas remain controlled by the connected provider account.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 18 }}>
          <div style={metricCard}><strong style={metricValue}>5×</strong><span>internal scheduling / usage multiplier</span></div>
          <div style={metricCard}><strong style={metricValue}>Priority</strong><span>Ultra LTE queue class</span></div>
          <div style={metricCard}><strong style={metricValue}>Real-time</strong><span>orchestration mode</span></div>
          <div style={metricCard}><strong style={metricValue}>Passthrough</strong><span>provider entitlement policy</span></div>
        </div>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ color: '#0b1f3a' }}>Capability matrix</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 16 }}>
            {runtime.capabilities.map((item) => (
              <article key={item.id} style={{ background: '#fff', border: '1px solid #d8d2c4', borderRadius: 18, padding: 20, boxShadow: '0 8px 22px rgba(15,23,42,.05)' }}>
                <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#9a7412', fontWeight: 800 }}>{item.category}</div>
                <h3 style={{ margin: '7px 0', color: '#0b1f3a' }}>{item.label}</h3>
                <p style={{ color: '#4b5563', lineHeight: 1.55 }}>{item.description}</p>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  <div><strong>Status:</strong> {statusLabel[item.status] || item.status}</div>
                  <div><strong>Provider:</strong> {item.provider}</div>
                  <div><strong>Internal multiplier:</strong> {item.internalLimitMultiplier}×</div>
                  <div><strong>Provider quota:</strong> {item.providerManagedQuota ? 'provider-managed' : 'Andreaa-managed'}</div>
                  {item.minimumAge ? <div><strong>Minimum provider age:</strong> {item.minimumAge}+</div> : null}
                </div>
                {item.notes ? <p style={{ marginBottom: 0, padding: 12, background: '#fff8df', borderRadius: 10, fontSize: 13 }}>{item.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <aside style={{ marginTop: 22, padding: 18, border: '1px solid #e3c565', background: '#fff8df', borderRadius: 14, lineHeight: 1.55 }}>
          <strong>Entitlement rule:</strong> Ultra LTE increases Andreaa Channel’s own scheduling and usage ceiling by 5×. It does not create Google AI Ultra, Deep Think, Flow, Antigravity, Jules or Project Genie entitlement. Those remain subject to Google account, subscription, regional, age and product-access rules.
        </aside>
      </section>
    </main>
  );
}

const metricCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  background: '#fff',
  border: '1px solid #d8d2c4',
  borderRadius: 16,
  padding: 18
};

const metricValue = { color: '#0b1f3a', fontSize: 23 };
