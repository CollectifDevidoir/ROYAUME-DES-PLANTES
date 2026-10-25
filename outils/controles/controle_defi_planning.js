// Défi du jour avec le planning de 90 jours (donnees/defis.json chargé dans DQP, outils/defis_integrer.py) : chaque jour du planning a sa série bien formée,
// les jours avant et après gardent le cycle de 30 séries, et un défi planifié se joue de bout en bout.
// Usage : F=chemin/vers/index-avec-planning.html NODE_PATH=$(npm root -g) node outils/controles/controle_defi_planning.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const {open}=require('./banc_essai.js');
const F=process.env.F?path.resolve(process.env.F):path.resolve(__dirname,'..','..','index.html');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const svg=n=>`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="hsl(${(n*47)%360},45%,45%)"/></svg>`;
(async()=>{
  const idx=fs.readFileSync(path.resolve(__dirname,'..','..','donnees','photos.json'),'utf8');
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const appareil=async(jour)=>{const r=await open({browser:b,file:F,w:390,h:844,touch:true,http:true,seed:true,avant:async pg=>{
      await pg.addInitScript(t=>{window.PHOTOS_TEST=JSON.parse(t)},idx);
      if(jour)await pg.addInitScript(j=>{const R=Date,t=R.parse(j+'T12:00:00+02:00');
        class D extends R{constructor(...a){super(...(a.length?a:[t]))}static now(){return t}};window.Date=D},jour);
      await pg.context().route(/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/(\d+)\//,rt=>rt.fulfill({contentType:'image/svg+xml',body:svg(+rt.request().url().match(/photos\/(\d+)\//)[1])}))}});return r};
  const A=await appareil(),p=A.p;
  const v=await p.evaluate(async()=>{
    await dqpPret();if(!DQP)return{absent:true};
    const sp=new Set(S.map(s=>s[0])),pb=[],jourK=k=>new Date(Date.UTC(...DQP.debut.split('-').map((x,i)=>i===1?x-1:+x))+k*864e5).toISOString().slice(0,10);
    const n=DQP.s.length,cles=new Set();let dif=0;
    for(let k=0;k<n;k++){const sr=DQP.s[k],d=jourK(k);
      if(JSON.stringify(dfSerie(d))!==JSON.stringify(sr))pb.push('jour '+d+' : série ≠ planning');
      if(sr.length!==10)pb.push(d+' : '+sr.length+' questions');
      if(new Set(sr.map(q=>q.theme)).size<5)pb.push(d+' : moins de 5 thèmes');
      const ks=new Set();
      sr.forEach(q=>{const c=q.question+'|'+(q.texte||'')+'|'+q.choix.join();if(ks.has(c))pb.push(d+' doublon '+q.question);ks.add(c);
        if(!['qcm','images'].includes(q.format))pb.push('format '+q.format);
        if(q.choix.length!==4||new Set(q.choix).size!==4||!(q.bonne>=0&&q.bonne<4))pb.push('choix '+q.question);
        if((q.format==='images'||q.plantes)&&!q.choix.every(c=>sp.has(c)))pb.push('plante inconnue '+q.choix);
        if(q.format==='images'&&!q.plantes)pb.push('images sans plantes');
        if(!q.explication)pb.push('sans explication '+q.question);
        if((q.sources||[]).some(u=>!/^https?:\/\/\S+$/.test(u)))pb.push('source '+q.sources)});
      if(sr.some((q,i)=>i&&q.question===sr[i-1].question&&q.format===sr[i-1].format&&q.theme===sr[i-1].theme))pb.push(d+' : deux questions identiques côte à côte')}
    const avant=jourK(-1),apres=jourK(n);
    return{n,pb,debut:DQP.debut,avant:JSON.stringify(dfSerie(avant))===JSON.stringify(DQ[dfNum(avant)]),apres:JSON.stringify(dfSerie(apres))===JSON.stringify(DQ[dfNum(apres)]),dq:DQ.length}});
  ok(!v.absent,'planning chargé depuis donnees/defis.json');
  if(!v.absent){
    ok(v.n>=1&&!v.pb.length,`${v.n} séries du planning bien formées, chaque jour lit sa série ${JSON.stringify(v.pb.slice(0,5))}`);
    ok(v.dq===30,'la table DQ (30 séries en ligne) est intacte');
    ok(v.avant&&v.apres,'le jour qui précède le planning et le jour qui le suit gardent le cycle de 30 séries');
    // un défi planifié se joue de bout en bout (date simulée : 3e jour du planning)
    const d3=await p.evaluate(()=>new Date(Date.UTC(...DQP.debut.split('-').map((x,i)=>i===1?x-1:+x))+2*864e5).toISOString().slice(0,10));
    const B=await appareil(d3),q=B.p;
    ok(await q.evaluate(()=>dfJour())===d3,'date simulée : '+d3);
    ok(await q.evaluate(()=>dfSerie(dfJour())===null),'jour du planning, fichier pas encore chargé : aucune série de remplacement');
    const attendu=await q.evaluate(async()=>{await dqpPret();return JSON.stringify(DQP.s[2])});
    ok(await q.evaluate(()=>JSON.stringify(dfSerie(dfJour())))===attendu,'le jour simulé lit la 3e série du planning');
    await q.evaluate(()=>dfLancer());await q.waitForTimeout(600);
    let bonnes=0;
    for(let i=0;i<10;i++){
      const qq=await q.evaluate(i=>({txt:document.querySelector('#df-q').textContent,b:dfSerie(dfJour())[i].bonne,att:dfSerie(dfJour())[i].question}),i);
      if(qq.txt!==qq.att){ok(false,'question '+(i+1)+' affichée ≠ planning');break}
      await q.click(`#df-o button:nth-child(${qq.b+1})`);await q.waitForTimeout(150);
      if(await q.$('#df-fb .dfk.ok'))bonnes++;
      await q.click('#df-nx');await q.waitForTimeout(250)}
    ok(bonnes===10,'10 bonnes réponses reconnues sur les 10 questions du défi planifié ('+bonnes+')');
    const res=await q.evaluate(()=>({sc:dfScore(dfEtat()),fin:dfFait()}));
    ok(res.sc===10&&res.fin,'résultat 10/10 enregistré, défi terminé');
    // fichier qui ne correspond pas (autre début) : refusé ; sans connexion : défi indisponible, annoncé clairement
    const C=await appareil(d3),c=C.p;
    await c.route(/donnees\/defis\.json/,rt=>rt.fulfill({contentType:'application/json',body:JSON.stringify({debut:'2026-01-01',s:[]})}));
    ok(await c.evaluate(async()=>{await dqpPret();return DQP===null&&dfSerie(dfJour())===null}),'fichier de planning qui ne correspond pas : refusé');
    await c.unroute(/donnees\/defis\.json/);await c.route(/donnees\/defis\.json/,rt=>rt.abort());
    await c.evaluate(()=>{document.querySelectorAll('.toast').forEach(t=>t.remove());dfLancer()});await c.waitForTimeout(500);
    ok(await c.evaluate(()=>!dfOn&&/vérifie la connexion/.test([...document.querySelectorAll('.toast')].map(t=>t.textContent).join())),'sans connexion : « Défi indisponible : vérifie la connexion », pas d’autre série');
    await c.unroute(/donnees\/defis\.json/);await c.evaluate(()=>dfLancer());await c.waitForTimeout(600);
    ok(await c.evaluate(()=>dfOn&&$('df-q').textContent===DQP.s[2][0].question),'connexion revenue : le défi s’ouvre sur la bonne série');
  }
  await b.close();console.log(ech?'\n'+ech+' ÉCHEC(S)':'\nTout est bon');process.exit(ech?1:0)
})();
