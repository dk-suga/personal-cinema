/* Add only missing archive data. Never replace the current collection. */
function mergeCinemaArchive(current,archive){
 if(archive.version!==2||!Array.isArray(archive.records)||!Array.isArray(archive.collections))throw Error('Нужна резервная копия Личного сеанса');
 const result=structuredClone(current),byId=new Map(result.records.map(r=>[String(r.id),r])),aliases=new Map();
 const norm=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('ru');
 const fingerprint=v=>JSON.stringify([v.kind||'first',v.start||'',v.end||'',v.status]);
 for(const source of archive.records){
  if(!source.id||typeof source.title!=='string'||!Array.isArray(source.sessions))throw Error('Некорректная карточка в копии');
  let target=byId.get(String(source.id));
  if(!target){target=structuredClone(source);target.id=String(target.id);result.records.push(target);byId.set(target.id,target)}
  else{
   const sessions=target.sessions||[],keys=new Set(sessions.map(fingerprint));
   const missing=source.sessions.filter(v=>!sessions.some(x=>x.id&&x.id===v.id)&&!keys.has(fingerprint(v))).map(v=>structuredClone(v));
   target.sessions=[...missing,...sessions];
   if(!sessions.length&&missing.length){target.status=source.status;target.start=source.start;target.end=source.end;target.watchDays=structuredClone(source.watchDays||[]);target.archivePeriod=structuredClone(source.archivePeriod||null)}
   for(const key of ['review','image','comment','country','director','writer','composer','score'])if(!target[key]&&source[key])target[key]=source[key];
  }
  aliases.set(String(source.id),String(target.id));
 }
 result.collections=result.collections||[];
 for(const source of archive.collections){let target=result.collections.find(c=>String(c.id)===String(source.id));if(!target){target={...structuredClone(source),recordIds:[]};result.collections.push(target)}target.recordIds=[...new Set([...(target.recordIds||[]).map(String),...(source.recordIds||[]).map(id=>aliases.get(String(id))).filter(Boolean)])]}
 return result;
}
(function(){
 const footer=document.querySelector('footer');
 footer.insertAdjacentHTML('beforeend','<button class="btn small" id="recover-archive">Восстановить недостающие записи</button><input hidden type="file" accept="application/json,.json" id="recover-file">');
 document.getElementById('recover-archive').onclick=()=>document.getElementById('recover-file').click();
 document.getElementById('recover-file').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const archive=JSON.parse(await file.text()),next=mergeCinemaArchive(db,archive);await window.cinemaStorage?.put('before-archive-recovery',structuredClone(db));db=next;normalizeSessions();save();render();toast('Недостающие записи и состав подборок восстановлены')}catch(err){toast(err.message||'Не удалось прочитать копию')}finally{event.target.value=''}};
})();
