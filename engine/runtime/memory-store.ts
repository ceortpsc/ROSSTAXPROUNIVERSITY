export type MemoryTier = 'request'|'session'|'workflow'|'application'|'knowledge'|'audit';
export interface MemoryRecord { id:string; tier:MemoryTier; key:string; value:unknown; version:number; createdAt:string; updatedAt:string; sensitive:boolean; retentionPolicy?:string; }

export class MemoryStore {
  private readonly records = new Map<string, MemoryRecord>();

  put(tier:MemoryTier,key:string,value:unknown,opts:{sensitive?:boolean;retentionPolicy?:string}={}):MemoryRecord {
    const now=new Date().toISOString();
    const id=`${tier}:${key}`;
    const previous=this.records.get(id);
    const record:MemoryRecord={id,tier,key,value,version:(previous?.version??0)+1,createdAt:previous?.createdAt??now,updatedAt:now,sensitive:opts.sensitive??false,retentionPolicy:opts.retentionPolicy};
    this.records.set(id,record); return record;
  }

  get(tier:MemoryTier,key:string):MemoryRecord|undefined { return this.records.get(`${tier}:${key}`); }
  delete(tier:MemoryTier,key:string):boolean { return this.records.delete(`${tier}:${key}`); }
  list(tier?:MemoryTier):MemoryRecord[] { return [...this.records.values()].filter(r=>!tier||r.tier===tier); }
}
