// Étape 8 : plafond du cache des photos (300 espèces, 600 Ko) et file d'attente. Usage : node outils/controle_cache.js
const {chromium}=require('playwright');const path=require('path');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext();
let n=0;await ctx.route(/^https?:/,async r=>{if(r.request().url().includes('api.inaturalist.org')){n++;await new Promise(x=>setTimeout(x,100));return r.fulfill({contentType:'application/json',body:'{"results":[]}'})}return r.abort()});
const p=await ctx.newPage();await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const now=Date.now();for(let i=0;i<400;i++)IC['Espèce '+i]={t:now-864e5,u:now-(400-i)*1e3,id:i,cn:'',imgs:[{src:'https://x/photos/'+i+'/large.jpg',lic:'test'}]};isave();
  const k=Object.keys(IC);return {n:k.length,vieille:'Espèce 0' in IC,recente:'Espèce 399' in IC,oct:localStorage.getItem(IK).length}});
ok(r.n===300,'plafond : 300 espèces gardées sur 400 ('+r.n+')');
ok(!r.vieille&&r.recente,'les moins récemment utilisées sortent d\'abord');
const r2=await p.evaluate(()=>{const now=Date.now(),big='x'.repeat(4000);for(let i=0;i<300;i++)IC['Grosse '+i]={t:now,u:now+i,id:i,imgs:[{src:'https://x/'+big}]};isave();return {n:Object.keys(IC).length,oct:localStorage.getItem(IK).length}});
ok(r2.oct<=6e5,'stockage sous 600 Ko même avec de grosses fiches ('+Math.round(r2.oct/1024)+' Ko, '+r2.n+' espèces)');
// File : priorités et abandon des demandes devenues inutiles
const r3=await p.evaluate(async()=>{const ord=[];let garde=true;const ps=[];
  ps.push(inat('a?1',2).then(()=>ord.push('organe-1')).catch(()=>{}));
  ps.push(inat('a?2',2,()=>garde).then(()=>ord.push('organe-2')).catch(e=>ord.push('annulée')));
  ps.push(inat('a?3',1).then(()=>ord.push('détail')).catch(()=>{}));
  ps.push(inat('a?4',0).then(()=>ord.push('photo')).catch(()=>{}));
  garde=false;await Promise.all(ps);return ord});
ok(r3.indexOf('photo')<r3.indexOf('détail'),'priorités : photo de question, puis détails, puis organes ('+r3.join(' → ')+')');
ok(r3.includes('annulée')&&!r3.includes('organe-2'),'une demande devenue inutile n\'est pas envoyée');
const r4=await p.evaluate(async()=>{const t0=Date.now(),ps=[];for(let i=0;i<50;i++)ps.push(inat('b?'+i,0));await Promise.all(ps);return {ms:Date.now()-t0,h:IQ.h.filter(t=>t>=t0&&t<t0+6e4).length}});
ok(r4.h<=44,'rythme : au plus 44 requêtes sur 60 s ('+r4.h+' envoyées, 50 en '+Math.round(r4.ms/1000)+' s)');
await b.close()})();
