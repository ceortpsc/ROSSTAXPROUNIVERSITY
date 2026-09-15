'use client';

import { useMemo, useState } from 'react';

type Tier = {
  level: number;
  name: string;
  speedClass: string;
  internalCapacityMultiplier: number;
  maxParallelStages: number;
  planningDepth: number;
  maxBlueprintNodes: number;
  operatingMode: string;
};

type Competency = {
  id: string;
  label: string;
  mission: string;
  minimumTier: number;
};

type Blueprint = {
  blueprintId: string;
  classification: string;
  tier: Tier;
  stages: Array<{
    order: number;
    id: string;
    owner: string;
    mission: string;
    outputs: string[];
    parallelGroup: number;
    gate: string;
  }>;
  executionPolicy: Record<string, boolean>;
};

export default function EngineConsole({ tiers, competencies, principles }: { tiers: Tier[]; competencies: Competency[]; principles: readonly string[] }) {
  const [tier, setTier] = useState(10);
  const [objective, setObjective] = useState('Design, build, source-control and deploy a production-ready client application with explicit architecture, implementation plan, operational gates and evidence.');
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState('');

  const selected = useMemo(() => tiers.find((item) => item.level === tier) || tiers[tiers.length - 1], [tier, tiers]);

  async function generateBlueprint() {
    setStatus('working');
    setError('');
    try {
      const response = await fetch('/api/andreaa-channel/engine', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ objective, tier })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Blueprint generation failed');
      setBlueprint(data);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blueprint generation failed');
      setStatus('error');
    }
  }

  return (
    <div>
      <section style={panel}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16 }}>
          <div>
            <label style={label}>Objective</label>
            <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={6} style={textarea} />
          </div>
          <div>
            <label style={label}>Engineering tier</label>
            <select value={tier} onChange={(event) => setTier(Number(event.target.value))} style={select}>
              {tiers.map((item) => <option key={item.level} value={item.level}>Tier {item.level} — {item.name}</option>)}
            </select>
            <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7, color: '#4b5563' }}>
              <div><strong>{selected.internalCapacityMultiplier}×</strong> internal capacity</div>
              <div><strong>{selected.maxParallelStages}</strong> parallel stages</div>
              <div><strong>{selected.planningDepth}</strong> planning depth</div>
              <div><strong>{selected.maxBlueprintNodes}</strong> blueprint-node ceiling</div>
            </div>
          </div>
        </div>
        <button onClick={generateBlueprint} disabled={status === 'working' || !objective.trim()} style={button}>
          {status === 'working' ? 'Engineering blueprint…' : 'Generate executable blueprint'}
        </button>
        {error ? <p style={{ color: '#b91c1c', fontWeight: 700 }}>{error}</p> : null}
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={heading}>10-tier speed & capacity ladder</h2>
        <div style={grid}>
          {tiers.map((item) => (
            <article key={item.level} style={{ ...card, borderColor: item.level === tier ? '#c9a227' : '#d8d2c4' }}>
              <div style={eyebrow}>Tier {item.level}</div>
              <h3 style={{ margin: '6px 0', color: '#0b1f3a' }}>{item.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0b1f3a' }}>{item.internalCapacityMultiplier}×</div>
              <p style={muted}>{item.operatingMode}</p>
              <div style={small}>Parallel {item.maxParallelStages} • Depth {item.planningDepth} • Nodes {item.maxBlueprintNodes}</div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={heading}>Engineering competencies</h2>
        <div style={grid}>
          {competencies.map((item) => (
            <article key={item.id} style={card}>
              <div style={eyebrow}>Active from Tier {item.minimumTier}</div>
              <h3 style={{ margin: '6px 0', color: '#0b1f3a' }}>{item.label}</h3>
              <p style={muted}>{item.mission}</p>
            </article>
          ))}
        </div>
      </section>

      {blueprint ? (
        <section style={{ marginTop: 22 }}>
          <div style={{ ...panel, borderColor: '#c9a227' }}>
            <div style={eyebrow}>Blueprint {blueprint.blueprintId}</div>
            <h2 style={heading}>Execution graph — {blueprint.classification}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {blueprint.stages.map((stage) => (
                <article key={stage.id} style={stageCard}>
                  <div style={{ fontWeight: 900, color: '#0b1f3a' }}>{stage.order}. {stage.owner}</div>
                  <div style={muted}>{stage.mission}</div>
                  <div style={small}>Parallel group {stage.parallelGroup} • Gate: {stage.gate}</div>
                  <div style={small}>Outputs: {stage.outputs.join(' • ')}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 22, ...panel }}>
        <h2 style={heading}>Fundamentals & engineering principles</h2>
        <ol style={{ columns: 2, gap: 36, lineHeight: 1.7, color: '#374151', paddingLeft: 20 }}>
          {principles.map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}
        </ol>
      </section>
    </div>
  );
}

const panel = { background: '#fff', border: '1px solid #d8d2c4', borderRadius: 18, padding: 20, boxShadow: '0 8px 22px rgba(15,23,42,.05)' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 };
const card = { background: '#fff', border: '1px solid #d8d2c4', borderRadius: 16, padding: 17 };
const stageCard = { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 };
const heading = { color: '#0b1f3a', marginTop: 0 };
const eyebrow = { fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' as const, fontWeight: 800, color: '#9a7412' };
const muted = { color: '#4b5563', lineHeight: 1.55 };
const small = { fontSize: 12, color: '#6b7280', lineHeight: 1.6 };
const label = { display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 7, color: '#0b1f3a' };
const textarea = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, font: 'inherit', resize: 'vertical' as const };
const select = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 11, background: '#fff', font: 'inherit' };
const button = { marginTop: 16, border: 0, borderRadius: 12, padding: '12px 18px', background: '#0b1f3a', color: '#fff', fontWeight: 800, cursor: 'pointer' };
