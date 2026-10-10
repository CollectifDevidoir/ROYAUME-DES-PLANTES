// Index des photos (donnees/photos.json) : quand il est là, l'appli n'interroge plus l'API iNaturalist
// (photos, organes, famille, feuillage de la correction) ; sans lui, elle fonctionne comme avant.
// Usage : node outils/controle_photos_index.js   (variable F = autre fichier html)
const {chromium}=require('playwright');const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  // index factice pour toutes les espèces : photo principale, 3 organes, 2 photos du taxon
  const {p:q,ctx:c3}=await open({browser:b,w:390,h:844,touch:true,file:process.env.F,avant:async pg=>{
    await pg.addInitScript(()=>{window.PHOTOS_TEST={especes:new Proxy({},{get:(o,l)=>typeof l==='string'&&/ /.test(l)?[9000,'nom','Famillaceae','Famille','Genre',
      [['https://img.test/photos/901/medium.svg','',0,'(c) Test, some rights reserved (CC BY)'],['https://img.test/photos/902/medium.svg','Feuillage',55,'(c) Test'],
       ['https://img.test/photos/903/medium.svg','Fleurs',56,'(c) Test'],['https://img.test/photos/904/medium.svg','Fruits',57,'(c) Test'],
       ['https://img.test/photos/905/medium.svg','Photo',0,'(c) Test'],['https://img.test/photos/906/medium.svg','Photo',0,'(c) Test']]]:undefined})}})}});
  const api=[];q.on('request',r=>{if(r.url().startsWith('https://api.inaturalist.org/'))api.push(r.url())});
  for(let i=0;i<6;i++){await lance(q,'mcq');await q.waitForTimeout(500);await q.evaluate(()=>{const bs=[...document.querySelectorAll('#opts button')];(bs.find(x=>x.dataset.l!==cur[0])||bs[0]).click()});await q.waitForTimeout(900);
    await q.evaluate(()=>{const m=$('sh-more');if(m)m.click()});await q.waitForTimeout(500);await q.click('#shn');await q.waitForTimeout(300)}
  const r=await q.evaluate(()=>{const i=document.querySelector('#pic .sl img');return{src:i&&i.src,ic:Object.values(IC).filter(x=>x.ix).length}});
  ok(api.length===0,`aucune requête à l'API iNaturalist avec l'index (${api.length}) ${api.slice(0,2).join(' ')}`);
  ok(/img\.test\/photos\/90\d\/large\.svg/.test(r.src||''),'la photo vient de l\'index (taille « large ») '+r.src);
  ok(r.ic>0,`espèces chargées depuis l'index : ${r.ic}`);
  ok(q.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(q.errs));await c3.close();
  // espèce sans photo d'organe dans l'index : le carrousel montre quand même les autres photos du taxon ;
  // une ancienne entrée du cache (ix 1, sans ces photos) est reconstruite
  const {p:u,ctx:c5}=await open({browser:b,w:390,h:844,touch:true,file:process.env.F,avant:async pg=>{
    await pg.addInitScript(()=>{const P=[['https://img.test/photos/911/medium.svg','',0,'(c) Test'],['https://img.test/photos/912/medium.svg','Photo',0,'(c) Test'],['https://img.test/photos/913/medium.svg','Photo',0,'(c) Test'],['https://img.test/photos/914/medium.svg','Photo',0,'(c) Test']];
      window.PHOTOS_TEST={especes:new Proxy({},{get:(o,l)=>typeof l==='string'&&/ /.test(l)?[9100,'nom','Famillaceae','Famille','Genre',P]:undefined})};
      const v={};v['Quercus robur']={t:Date.now(),u:Date.now(),id:9100,ix:1,det:1,full:1,done:{21:1,13:1,14:1},imgs:[{src:'https://img.test/photos/911/large.svg',label:''}],ext:[]};localStorage.setItem('quizplantes.inat.v1',JSON.stringify(v))})}});
  await lance(u,'mcq');await u.waitForTimeout(1200);
  const n=await u.evaluate(()=>document.querySelectorAll('#pic .car .sl').length);
  ok(n===4,'espèce sans photo d\'organe : 4 photos dans le carrousel (et pas 1) : '+n);
  const vieux=await u.evaluate(async()=>{const it=await inatTaxon(S.find(s=>s[0]==='Quercus robur'));return it&&it.ix===2&&it.imgs.length===4});
  ok(vieux,'ancienne entrée du cache : reconstruite avec toutes les photos');await c5.close();
  // sans index : comportement d'avant (l'API est interrogée)
  const {p:s,ctx:c4}=await open({browser:b,w:390,h:844,touch:true,file:process.env.F});const api2=[];s.on('request',r=>{if(r.url().startsWith('https://api.inaturalist.org/'))api2.push(1)});
  await lance(s,'mcq');await s.waitForTimeout(1500);ok(api2.length>0||await s.evaluate(()=>Object.keys(IC).length>0),'sans index : photos demandées à iNaturalist comme avant');
  ok(s.errs.length===0,'sans index : aucune erreur JavaScript');await c4.close();
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'INDEX DES PHOTOS : tout est OK');process.exit(ech?1:0)})();
