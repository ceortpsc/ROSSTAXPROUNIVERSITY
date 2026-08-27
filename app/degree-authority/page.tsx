import Link from 'next/link';

const gates = [
  ['Entity qualification','Texas foreign-entity registration and governing records'],
  ['Institutional authorization','Applicable Texas authorization/certificate and approval evidence'],
  ['Program approval','Approved programs, curriculum, catalog and disclosures'],
  ['Academic governance','Faculty/curriculum governance and documented approvals'],
  ['Student records','Registrar, degree-audit, transcript and audit controls'],
  ['Financial disclosures','Approved tuition, fees, refund and enrollment agreement'],
  ['Credential issuance','Verified completion + authorized human approval + audit record'],
];

export default function DegreeAuthority(){
  return <main style={{fontFamily:'system-ui',padding:32,maxWidth:1200,margin:'0 auto'}}>
    <section style={{padding:32,borderRadius:20,background:'#0B1F3A',color:'#fff'}}>
      <div style={{color:'#C9A227',fontWeight:800}}>ROSS TAX PRO SOFTWARE CO</div>
      <h1>Ross Tax Pro University — Degree &amp; Diploma Authority Center</h1>
      <p>Controlled application-readiness, academic authorization, degree-audit and credential-issuance workflow for the proposed University of Accounting &amp; Taxation.</p>
      <div style={{padding:14,border:'1px solid #C9A227',borderRadius:12,marginTop:18}}>
        <strong>Current status: PRE-AUTHORIZATION</strong><br/>
        The platform does not represent a diploma or degree as officially authorized, accredited or approved until the applicable evidence is recorded.
      </div>
    </section>

    <section style={{marginTop:24}}>
      <h2>Objective Navigation Gate</h2>
      <p>Every credential request must pass the gates below before an authorized human may approve issuance.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
        {gates.map(([title,desc],i)=><div key={title} style={{padding:18,border:'1px solid #ddd',borderRadius:14,background:'#fff'}}>
          <strong>{i+1}. {title}</strong><p style={{color:'#64748B'}}>{desc}</p>
        </div>)}
      </div>
    </section>

    <section style={{marginTop:24,padding:22,border:'1px solid #ddd',borderRadius:14}}>
      <h2>Credential Request Flow</h2>
      <p><strong>Student progress → Degree audit → Requirements verified → Academic review → Authorization evidence → Human approval → Credential issuance → Audit record → Verification.</strong></p>
      <p style={{color:'#64748B'}}>AI may summarize records, detect missing evidence, explain requirements and prepare review packets. AI cannot independently award a diploma or degree.</p>
    </section>

    <section style={{marginTop:24}}>
      <h2>Navigation</h2>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        {['/programs','/catalog','/admissions','/student/degree-audit','/registrar','/governance'].map(h=><Link key={h} href={h} style={{padding:'10px 14px',border:'1px solid #ddd',borderRadius:10,background:'#fff'}}>{h}</Link>)}
      </div>
    </section>
  </main>
}
