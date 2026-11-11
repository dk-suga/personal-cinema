export const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export class SyncModel{
 constructor(device,saved={}){this.device=device;this.remote=new Map(saved.remote||[]);this.pending=new Map(saved.pending||[]);this.conflicts=new Set(saved.conflicts||[])}
 capture(docs){for(const key of new Set([...this.remote.keys(),...this.pending.keys(),...docs.keys()])){const json=docs.get(key)??null,r=this.remote.get(key),baseJson=r?.deleted?null:r?.json??null;if(json===baseJson){this.pending.delete(key);this.conflicts.delete(key)}else{const old=this.pending.get(key);this.pending.set(key,{json,baseRev:old?.baseRev??r?.rev??0})}}}
 receive(next){for(const [key,r]of next){const old=this.remote.get(key);if(old&&old.rev>r.rev)continue;const p=this.pending.get(key),json=r.deleted?null:r.json;if(p){if(p.json===json){this.pending.delete(key);this.conflicts.delete(key)}else if(r.rev>p.baseRev){if(r.writer===this.device)p.baseRev=r.rev;else this.conflicts.add(key)}}this.remote.set(key,r)}}
 acknowledge(key,sent,r){if((this.remote.get(key)?.rev||0)>r.rev)return;this.remote.set(key,r);const p=this.pending.get(key);if(p&&p.json===sent.json){this.pending.delete(key);this.conflicts.delete(key)}else if(p)p.baseRev=r.rev}
 overlay(){const docs=new Map([...this.remote].filter(([,r])=>!r.deleted).map(([k,r])=>[k,r.json]));for(const [key,p]of this.pending){if(p.json===null)docs.delete(key);else docs.set(key,p.json)}return docs}
 resolve(key,useLocal){const p=this.pending.get(key);if(useLocal&&p)p.baseRev=this.remote.get(key)?.rev||0;else this.pending.delete(key);this.conflicts.delete(key)}
 journal(){return {remote:[...this.remote],pending:[...this.pending],conflicts:[...this.conflicts]}}
}

export const overlaySignature=docs=>canonical([...docs].sort(([a],[b])=>a.localeCompare(b)));
