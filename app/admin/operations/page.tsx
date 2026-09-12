export const dynamic = 'force-dynamic';

const cards = [
  ['Deployments','GitHub main -> Render auto-deploy','/api/ops/overview'],
  ['Health & troubleshooting','Runtime, OAuth readiness and service checks','/api/ops/health'],
  ['Security & compliance','Headers, secret handling and governance controls','/api/ops/security'],
  ['Optimization','Runtime footprint and performance controls','/api/ops/optimization'],
  ['Quotas & reservations','Resource observations and billing guardrails','/api/ops/quotas'],
  ['Maintenance','Non-destructive maintenance control surface','/api/ops/maintenance'],
  ['Support','Incident checklist and support access points','/api/ops/support'],
  ['App topology','Application, GitHub and Google Workspace dependency graph','/api/ops/topology']
];

export default function OperationsPage(){
  return <main style={{minHeight:'100vh',background:'#f7f2e8',padding:'40px 20px',color:'#111827'}}>
    <section style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{background:'#0b1f3a',color:'#fff',padding:28,borderRadius:20,border:'1px solid #c9a227'}}>
        <div style={{fontSize:13,letterSpacing:1.4,textTransform:'uppercase',color:'#d4af37'}}>Ross Tax Pro University</div>
        <h1 style={{margin:'8px 0 6px',fontSize:36}}>Operations Control Center</h1>
        <p style={{margin:0,color:'#e5e7eb'}}>Deployment, health, security, optimization, quota, maintenance, support and topology surfaces.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginTop:20}}>
        {cards.map(([title,desc,href]) => <a key={href} href={href} style={{display:'block',textDecoration:'none',color:'#111827',background:'#fff',border:'1px solid #d8d2c4',borderRadius:16,padding:20,boxShadow:'0 8px 24px rgba(15,23,42,.06)'}}>
          <div style={{fontWeight:800,fontSize:18,color:'#0b1f3a'}}>{title}</div>
          <p style={{lineHeight:1.5,color:'#4b5563'}}>{desc}</p>
          <span style={{color:'#9a7412',fontWeight:700}}>Open operational endpoint →</span>
        </a>)}
      </div>
      <div style={{marginTop:20,padding:18,borderRadius:14,background:'#fff8df',border:'1px solid #e3c565'}}>
        Mutating maintenance actions are intentionally gated by a server-side operations key. No secret values are displayed in this dashboard or its read endpoints.
      </div>
    </section>
  </main>
}
