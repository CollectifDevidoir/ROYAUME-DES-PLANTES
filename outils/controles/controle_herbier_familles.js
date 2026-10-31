// Herbier, volet « Familles » (Collection / Familles / Carte des milieux) : une ligne par famille rencontrée, mêmes tuiles et même
// en-tête que la carte « Ta collection » de la fiche famille, même symbole pour toutes les familles complètes, fiche ouvrable
// depuis l'Herbier sans toucher au point rouge de la Famille du jour.
// Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_herbier_familles.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  let {b,p}=await open({w:375,h:667,touch:true,http:1,file:process.env.F});
  const N=await p.evaluate(()=>{const f=n=>S.filter(s=>FAM[gen(s[0])]===n).map(s=>s[0]);return{Pinaceae:f('Pinaceae'),Rosaceae:f('Rosaceae'),Fagaceae:f('Fagaceae'),total:Object.keys(FAMSP).length}});
  await b.close();
  const sp={};N.Pinaceae.forEach(n=>sp[n]={b:4,s:6,e:0,d:0});N.Rosaceae.slice(0,8).forEach((n,i)=>sp[n]={b:i<4?4:2,s:3,e:0,d:0});N.Fagaceae.slice(0,2).forEach(n=>sp[n]={b:2,s:1,e:1,d:0});
  const state=JSON.stringify({sp,hist:{},m:{},ho:{}});
  for(const [w,h,touch,lbl] of [[375,667,true,'téléphone'],[1280,800,false,'ordinateur']]){
    ({b,p}=await open({w,h,touch,http:true,file:process.env.F,state}));
    await p.click('[data-t=herb]');await p.waitForTimeout(500);
    ok(JSON.stringify(await p.$$eval('.hvo button',e=>e.map(x=>x.textContent.trim())))===JSON.stringify(['Collection','Familles','Carte des milieux']),`${lbl} : trois volets, dans l'ordre Collection, Familles, Carte des milieux`);
    ok(await p.$eval('.hvo [data-hv=col]',e=>e.getAttribute('aria-selected'))==='true','Collection reste le volet affiché par défaut');
    await p.click('[data-hv=fam]');await p.waitForTimeout(500);
    ok(await p.evaluate(()=>localStorage.getItem('qp.hv'))==='fam',`${lbl} : le volet choisi est retenu`);
    const L=await p.$$eval('#herb details.hc',e=>e.map(x=>({f:x.dataset.f,n:x.querySelector('.hn').textContent,ok:!!x.querySelector('.hi.fi.ok')})));
    ok(L.map(x=>x.f).join()==='Pinaceae,Rosaceae,Fagaceae',`${lbl} : seules les familles rencontrées sont listées, complète d'abord (${L.map(x=>x.f).join(', ')})`);
    ok(L[0].ok&&!L[1].ok&&!L[2].ok&&L[0].n===`${N.Pinaceae.length}/${N.Pinaceae.length}`,`${lbl} : le symbole « famille complète » n'est porté que par la famille complète (${L[0].n})`);
    const reste=await p.$eval('.pkf',e=>e.textContent);ok(reste.includes(`+ ${N.total-3} familles à découvrir`),`${lbl} : les autres familles sont comptées : « ${reste} »`);
    // ouverture de Rosaceae : tuiles identiques à celles de la Collection (ok / pr), rien pour les espèces non rencontrées
    await p.click('#herb details.hc[data-f=Rosaceae] summary');await p.waitForTimeout(400);
    const T=await p.$$eval('#herb details.hc[data-f=Rosaceae] .pk',e=>e.map(x=>x.dataset.l+':'+(x.classList.contains('ok')?'ok':x.classList.contains('pr')?'pr':'?')));
    ok(T.length===8&&T.filter(x=>/ok$/.test(x)).length===4&&T.filter(x=>/pr$/.test(x)).length===4,`${lbl} : Rosaceae montre 4 acquises et 4 rencontrées, pas les ${N.Rosaceae.length-8} autres`);
    ok((await p.$eval('#herb details.hc[data-f=Rosaceae] .pkn',e=>e.textContent)).includes(`+ ${N.Rosaceae.length-8} à découvrir`),`${lbl} : « + ${N.Rosaceae.length-8} à découvrir » en fin de liste`);
    // fiche famille depuis l'Herbier : « Famille », pas « Famille du jour », point rouge du jour intact
    const fd0=await p.evaluate(()=>st.fd.d||'');
    await p.click('#herb [data-fiche=Rosaceae]');await p.waitForTimeout(600);
    ok(await p.$eval('#fam',e=>e.open)&&await p.$eval('#fz .f1 small',e=>e.textContent)==='Famille',`${lbl} : « Fiche de la famille » ouvre la fiche, intitulée « Famille »`);
    ok(await p.evaluate(()=>st.fd.d||'')===fd0,`${lbl} : la Famille du jour n'est pas marquée comme vue`);
    // même collection dans la fiche : mêmes tuiles pour les espèces rencontrées, dans le même ordre ; en plus, toutes les autres espèces de la famille
    const T2=await p.$$eval('#fam-grid .pk',e=>e.map(x=>x.dataset.l+':'+(x.classList.contains('ok')?'ok':x.classList.contains('pr')?'pr':'?')));
    ok(JSON.stringify(T2.filter(x=>!/\?$/.test(x)))===JSON.stringify(T),`${lbl} : la collection de la fiche a les mêmes tuiles (acquises, rencontrées), dans le même ordre, que celle de l'Herbier`);
    ok(T2.length===N.Rosaceae.length&&T2.filter(x=>/\?$/.test(x)).length===N.Rosaceae.length-8,`${lbl} : la fiche montre aussi les ${N.Rosaceae.length-8} espèces non rencontrées (${T2.length} tuiles)`);
    const h2=await p.$eval('#fz .fc4 .hc.fix .hn',e=>e.textContent);ok(h2===L[1].n,`${lbl} : même en-tête (${h2}) dans la fiche et dans l'Herbier`);
    ok(await p.$eval('#fz .fc4 .hc.fix .hi.fi',e=>!e.classList.contains('ok')),`${lbl} : symbole grisé dans la fiche tant que la famille n'est pas complète`);
    ok(await p.$eval('#fz .fc4 summary',e=>getComputedStyle(e).pointerEvents)==='none','en-tête de la fiche : non repliable');
    if(touch){ok(await p.$$eval('.fav',e=>e.every(x=>getComputedStyle(x).display==='none')),'petit écran : pas de flèches par-dessus la carte (elles cachaient « espèces dans le monde »')}
    await p.evaluate(()=>$('fam').close());
    // la fiche d'une famille complète porte le symbole complet
    await p.evaluate(()=>openFamily('Pinaceae',true));await p.waitForTimeout(300);
    ok(await p.$eval('#fz .fc4 .hc.fix .hi.fi',e=>e.classList.contains('ok'))&&(await p.$eval('#fz .fc4 summary',e=>e.textContent)).includes('famille complète'),`${lbl} : famille complète : même symbole dans la fiche`);
    await p.evaluate(()=>$('fam').close());
    ok(p.errs.length===0,`${lbl} : aucune erreur JavaScript `+JSON.stringify(p.errs));await b.close()}
  // nouveau joueur, volet Familles retenu d'une visite précédente : aucune famille, message et compteur
  ({b,p}=await open({w:375,h:667,touch:true,http:true,file:process.env.F,avant:async q=>{await q.addInitScript(()=>{localStorage.setItem('qp.hv','fam')})}}));
  await p.click('[data-t=herb]');await p.waitForTimeout(500);
  ok((await p.textContent('#herb')).includes('dès que tu rencontres')&&(await p.textContent('#herb')).includes(`+ ${N.total} familles à découvrir`),'sans aucune plante rencontrée : message d\'accueil et compteur de toutes les familles');
  ok(p.errs.length===0,'nouveau joueur : aucune erreur JavaScript '+JSON.stringify(p.errs));await b.close();
  console.log(ech?ech+' ÉCHEC(S)':'HERBIER FAMILLES : tout est OK');process.exit(ech?1:0)})();
