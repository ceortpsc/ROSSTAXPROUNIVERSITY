import EngineConsole from './EngineConsole';
import { getAndreaaEngineSnapshot } from '../../../lib/andreaa-engine';

export const dynamic = 'force-dynamic';

export default function AndreaaEnginePage() {
  const snapshot = getAndreaaEngineSnapshot(10);

  return (
    <main style={{ minHeight: '100vh', background: '#f7f2e8', padding: '36px 18px', color: '#111827' }}>
      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <header style={{ background: '#0b1f3a', color: '#fff', padding: 32, borderRadius: 22, border: '1px solid #c9a227', marginBottom: 20 }}>
          <div style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d4af37' }}>Andreaa Channel • Standalone Engineering Runtime</div>
          <h1 style={{ margin: '8px 0', fontSize: 40 }}>Andreaa Channel — 10-Tier Reasoning & Software Engineering Engine</h1>
          <p style={{ margin: 0, maxWidth: 980, lineHeight: 1.65, color: '#e5e7eb' }}>
            A standalone control plane for reasoning, architecture, blueprint planning, building, code writing, generation, execution orchestration, client application development, engineering fundamentals, pioneering design and expert software delivery.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18, fontSize: 13 }}>
            <span style={pill}>Engine v{snapshot.engineVersion}</span>
            <span style={pill}>10 internal tiers</span>
            <span style={pill}>10× max internal capacity</span>
            <span style={pill}>Provider-independent core planner</span>
          </div>
        </header>

        <EngineConsole tiers={snapshot.tiers} competencies={snapshot.competencies} principles={snapshot.principles} />

        <aside style={{ marginTop: 22, padding: 18, border: '1px solid #e3c565', background: '#fff8df', borderRadius: 14, lineHeight: 1.6 }}>
          <strong>Capacity definition:</strong> the 1×–10× ladder controls Andreaa Channel's own planning depth, work-graph size, stage concurrency and queue priority. It does not fabricate CPU, model tokens, provider credits, external subscription access or third-party quotas.
        </aside>
      </section>
    </main>
  );
}

const pill = { border: '1px solid rgba(212,175,55,.55)', background: 'rgba(255,255,255,.07)', borderRadius: 999, padding: '7px 11px' };
