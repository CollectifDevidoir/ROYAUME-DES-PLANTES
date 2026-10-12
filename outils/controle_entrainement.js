// Sortie du mode entraînement : la question laissée en cours revient aussitôt (photo déjà chargée), sans nouveau chargement ;
// si l'on était en pleine correction, c'est la question suivante déjà préparée. Ordinateur et téléphone.
// Usage : node outils/controle_entrainement.js
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const pret=p=>p.waitForFunction(()=>(!$('pic').hidden&&!$('pic').classList.contains('sk')||$('pic').hidden)&&document.querySelectorAll('#opts button,#q-input').length>0,null,{timeout:20000}).then(()=>true,()=>false);
for(const [w,h,t] of [[1440,900,false],[390,844,true]]){const {ctx,p}=await open({browser:b,w,h,touch:t,seed:true});const tag=w+'×'+h;
  await pret(p);
  for(const [k,cas] of [[0,'question en cours'],[1,'après une réponse d\'entraînement'],[2,'pendant la correction d\'une question normale']]){
    if(k===2){await p.evaluate(()=>{const b=document.querySelector('#opts button');if(b)b.click();else{$('q-input').value='x';$('q-form').requestSubmit()}});await p.waitForTimeout(400)}
    const avant=await p.evaluate(()=>cur[0]);
    await p.evaluate(k=>{st.tm={d:today(),l:S.slice(40+k*3,43+k*3).map(s=>s[0])};save();stats();$('rplay').click()},k);
    ok(await pret(p)&&await p.evaluate(()=>curTrain),`${tag} ${cas} : entraînement lancé`);
    if(k===1){await p.evaluate(()=>{const b=document.querySelector('#opts button');if(b)b.click();else{$('q-input').value='x';$('q-form').requestSubmit()}});await p.waitForTimeout(400)}
    const t0=Date.now();await p.evaluate(()=>$('trq').click());const r=await pret(p),dt=Date.now()-t0;
    const e=await p.evaluate(()=>({train:curTrain,cur:cur[0],trn:$('trn').hidden,chips:!$('chips').hidden}));
    ok(r&&!e.train&&e.trn&&e.chips,`${tag} ${cas} : sortie, bandeau retiré et modes revenus`);
    if(k<2)ok(e.cur===avant&&dt<1500,`${tag} ${cas} : la question laissée revient aussitôt (${dt} ms)`);
    else ok(e.cur!==avant,`${tag} ${cas} : on passe à la question suivante`);
  }
  ok(p.errs.length===0,tag+' : aucune erreur JavaScript '+JSON.stringify(p.errs));await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'ENTRAÎNEMENT : tout est OK');process.exit(ech?1:0)})();
