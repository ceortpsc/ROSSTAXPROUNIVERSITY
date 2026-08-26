export type PerformanceSample={latencyMs:number;ok:boolean;throughput:number;webVital?:number};

export function gradePerformance(samples:PerformanceSample[]){
  if(!samples.length) return {grade:"N/A",score:0};
  const good=samples.filter(s=>s.ok).length/samples.length;
  const lat=[...samples].sort((a,b)=>a.latencyMs-b.latencyMs);
  const p95=lat[Math.min(lat.length-1,Math.floor(lat.length*.95))].latencyMs;
  let score=good*70;
  if(p95<=200) score+=20; else if(p95<=500) score+=12; else if(p95<=1000) score+=6;
  const grade=score>=95?"A+":score>=90?"A":score>=80?"B":score>=70?"C":"D";
  return {grade,score:Math.round(score*100)/100,p95LatencyMs:p95,successRate:Math.round(good*10000)/100};
}
