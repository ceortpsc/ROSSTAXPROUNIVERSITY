import PlatformCard from '../../../components/andreaa/PlatformCard';
import { getAndreaaEngineSnapshot } from '../../../lib/andreaa-engine';
import { getLmsSnapshot } from '../../../lib/lms-integration';

export const dynamic = 'force-dynamic';

export default function AndreaaPlatformPage() {
  const engine = getAndreaaEngineSnapshot(10);
  const lms = getLmsSnapshot();
  const activeLms = lms.providers.filter((provider) => provider.status === 'active' || provider.status === 'configured').length;

  return (
    <main style={{ minHeight: '100vh', background: '#f7f2e8', padding: '36px 18px', color: '#111827' }}>
      <section style={{ maxWidth: 1240, margin: '0 auto' }}>
        <header style={{ background: '#0b1f3a', color: '#fff', padding: 32, borderRadius: 22, border: '1px solid #c9a227' }}>
          <div style={{ fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d4af37' }}>Andreaa Channel • Production Engineering Platform</div>
          <h1 style={{ margin: '8px 0', fontSize: 40 }}>Architecture, contracts, LMS, governance, deployment & operations</h1>
          <p style={{ margin: 0, maxWidth: 980, lineHeight: 1.65, color: '#e5e7eb' }}>
            Source-controlled control plane for Andreaa Channel v{engine.engineVersion}: OpenAPI contracts, LMS adapters, CLI operations, role and permission policy, container and server deployment, production runbooks and evidence-backed release controls.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14, marginTop: 18 }}>
          <div style={metricCard}><strong style={metricValue}>10</strong><span>engine tiers</span></div>
          <div style={metricCard}><strong style={metricValue}>{engine.competencies.length}</strong><span>engineering competencies</span></div>
          <div style={metricCard}><strong style={metricValue}>{lms.providers.length}</strong><span>LMS provider adapters</span></div>
          <div style={metricCard}><strong style={metricValue}>{activeLms}</strong><span>configured/active LMS providers</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 16, marginTop: 22 }}>
          <PlatformCard title="10-Tier Engineering Engine" eyebrow="Runtime" href="/andreaa-channel/engine" status="LIVE">
            Tiered reasoning, architecture, planning, code generation, client application development, execution orchestration and production evidence gates.
          </PlatformCard>
          <PlatformCard title="OpenAPI Contract" eyebrow="API" href="/api/andreaa-channel/engine?tier=10" status="CONTRACTED">
            Machine-readable REST surfaces are defined in <code>openapi/andreaa-channel.openapi.yaml</code> and implemented as Next.js route handlers.
          </PlatformCard>
          <PlatformCard title="LMS Integration Plane" eyebrow="Education" href="/api/lms/integrations" status={activeLms ? 'CONFIGURED' : 'ADAPTER READY'}>
            Google Classroom plus adapter contracts for Canvas, Moodle and Blackboard, with provider-owned credentials and least-privilege role controls.
          </PlatformCard>
          <PlatformCard title="Operations Control Center" eyebrow="Production" href="/admin/operations" status="LIVE">
            Deployment, health, security, quotas, maintenance, support and topology surfaces for the production service.
          </PlatformCard>
          <PlatformCard title="Google Classroom Connector" eyebrow="OAuth" href="/admin/integrations/google-classroom" status="PROVIDER GATED">
            OAuth start/callback, consent evidence, secure token handoff and Classroom API verification surfaces.
          </PlatformCard>
          <PlatformCard title="Runbooks & Governance" eyebrow="Policy" status="SOURCE CONTROLLED">
            Engineering principles, RBAC, approved-action boundaries, deployment scripts, incident procedures and evidence rules live under <code>docs/andreaa-channel</code>.
          </PlatformCard>
        </div>

        <aside style={{ marginTop: 22, padding: 18, border: '1px solid #e3c565', background: '#fff8df', borderRadius: 14, lineHeight: 1.6 }}>
          <strong>Production rule:</strong> a route, integration or entitlement is described as active only when runtime or provider evidence supports that status. Documentation, mocks and configuration declarations are never counted as production success by themselves.
        </aside>
      </section>
    </main>
  );
}

const metricCard = { display: 'flex', flexDirection: 'column' as const, gap: 6, background: '#fff', border: '1px solid #d8d2c4', borderRadius: 16, padding: 18 };
const metricValue = { color: '#0b1f3a', fontSize: 25 };
