export type RuntimeState = 'new'|'validated'|'processing'|'resolved'|'needs_review'|'blocked'|'failed'|'cancelled';

export interface RuntimeRequest {
  correlationId: string;
  actorId: string;
  action: string;
  facts: Record<string, unknown>;
  requestedAction?: string;
  sourceEvidence?: Array<{id:string; title:string; revision?:string; effectiveDate?:string; url?:string}>;
  humanApproval?: {approvedBy:string; approvedAt:string; scope:string};
}

export interface RuntimeResolution {
  state: RuntimeState;
  result: unknown;
  confidence: number;
  humanReviewRequired: boolean;
  reasons: string[];
  audit: {correlationId:string; timestamp:string; processor:string};
}

export interface Processor<T=unknown> {
  id: string;
  canHandle(action: string): boolean;
  execute(request: RuntimeRequest): Promise<T>;
}

export class RuntimeKernel {
  constructor(private readonly processors: Processor[]) {}

  async dispatch(request: RuntimeRequest): Promise<RuntimeResolution> {
    const processor = this.processors.find(p => p.canHandle(request.action));
    const audit = {correlationId: request.correlationId, timestamp:new Date().toISOString(), processor:processor?.id ?? 'none'};

    if (!processor) return {state:'blocked', result:null, confidence:0, humanReviewRequired:true,
      reasons:[`No processor registered for action: ${request.action}`], audit};

    if (['credential_issuance','degree_completion','grade_override','financial_refund','identity_change','privilege_escalation'].includes(request.action) && !request.humanApproval) {
      return {state:'needs_review', result:null, confidence:0, humanReviewRequired:true,
        reasons:['Authorized human approval is required'], audit};
    }

    try {
      const result = await processor.execute(request);
      return {state:'resolved', result, confidence:1, humanReviewRequired:false, reasons:[], audit};
    } catch (error) {
      return {state:'failed', result:null, confidence:0, humanReviewRequired:true,
        reasons:[error instanceof Error ? error.message : 'Processor failure'], audit};
    }
  }
}
