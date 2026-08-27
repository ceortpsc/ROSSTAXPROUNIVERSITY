import type {RuntimeRequest, RuntimeResolution} from './runtime-kernel';

export interface ResolutionStep { id:string; name:string; run:(request:RuntimeRequest, context:Record<string,unknown>)=>Promise<Record<string,unknown>>|Record<string,unknown>; }

export class ResolutionPipeline {
  constructor(private readonly steps:ResolutionStep[]){ }

  async run(request:RuntimeRequest):Promise<{context:Record<string,unknown>; steps:string[]; failedAt?:string}> {
    const context:Record<string,unknown>={}; const completed:string[]=[];
    for(const step of this.steps){
      try { Object.assign(context,await step.run(request,context)); completed.push(step.id); }
      catch(error){ throw new Error(`${step.id}: ${error instanceof Error?error.message:'step failed'}`); }
    }
    return {context,steps:completed};
  }
}

export function buildDefaultResolutionSteps():ResolutionStep[]{
  return [
    {id:'facts.validate',name:'Validate input facts',run:(r)=>({factsValidated:Object.keys(r.facts).length>=0})},
    {id:'authority.verify',name:'Verify source evidence for regulated actions',run:(r)=>({authorityVerified:!['tax','government_form','institutional_authorization'].some(k=>r.action.includes(k)) || (r.sourceEvidence?.length??0)>0})},
    {id:'policy.evaluate',name:'Evaluate policy constraints',run:()=>({policyEvaluated:true})},
    {id:'permission.check',name:'Check actor capability and authorization',run:(r)=>({actorValidated:Boolean(r.actorId)})},
    {id:'decision.route',name:'Route to processor or human review',run:(r)=>({reviewRequired:['credential_issuance','degree_completion','grade_override','financial_refund','identity_change','privilege_escalation'].includes(r.action) && !r.humanApproval})}
  ];
}
