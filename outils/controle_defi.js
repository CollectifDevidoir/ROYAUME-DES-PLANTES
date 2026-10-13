// Défi du jour, de bout en bout (index des photos réel, photos générées) : même série pour deux appareils différents,
// questions, propositions et photo imposées, une seule réponse, reprise après rechargement, résultat, partage,
// pas de seconde partie, progression sans acquisition, statistiques en mode « defi », classement du volet profil.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_defi.js [dossier où enregistrer des captures]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const {open}=require('./banc_essai.js');
const CAPT=process.argv[2];
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const svg=n=>`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="hsl(${(n*47)%360},45%,45%)"/><text x="40" y="80" font-size="60" fill="#fff">défi ${n}</text></svg>`;
(async()=>{
  const idx=fs.readFileSync(path.resolve(__dirname,'..','donnees','photos.json'),'utf8');
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  // appareil : index des photos de l'appli, photos iNaturalist remplacées par des images générées
  const appareil=async(o={})=>{const r=await open({browser:b,w:390,h:844,touch:true,http:true,...o,avant:async pg=>{
      await pg.addInitScript(t=>{window.PHOTOS_TEST=JSON.parse(t)},idx);
      await pg.context().route(/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/(\d+)\//,rt=>rt.fulfill({contentType:'image/svg+xml',body:svg(+rt.request().url().match(/photos\/(\d+)\//)[1])}));
      if(o.avant2)await o.avant2(pg)}});
    await r.p.evaluate(()=>{navigator.share=undefined;window.__copie='';navigator.clipboard.writeText=async t=>{window.__copie=t}});return r};
  const serie=p=>p.evaluate(()=>{const sr=dfSerie(dfJour());return sr&&sr.q.map(x=>[x.s[0],x.im.src,x.cho.map(c=>c[0]),x.dure])});
  const A=await appareil({seed:true}),p=A.p;
  // un autre appareil, avec un autre hasard et une progression : même série
  const B=await appareil({state:JSON.stringify({sp:{'Quercus robur':{b:4,s:9,e:1,d:0}},set:{goal:20,vib:false}})});
  const sA=await serie(p),sB=await serie(B.p);
  ok(sA&&sA.length===10,'série du jour : 10 plantes');
  ok(JSON.stringify(sA)===JSON.stringify(sB),'deux appareils différents : mêmes plantes, même ordre, même photo, mêmes propositions');
  ok(sA&&sA.filter(x=>x[3]).length===5&&new Set(sA.map(x=>x[0])).size===10,'5 plantes faciles, 5 difficiles, toutes différentes');
  ok(sA&&sA.every(x=>x[2].length===4&&x[2].includes(x[0])&&new Set(x[2]).size===4),'4 propositions distinctes dont la bonne réponse');
  ok(await p.evaluate(()=>dfJour()===new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date())),'jour du défi : date de Paris');
  // bouton à côté de la Famille du jour
  ok(await p.evaluate(()=>{const d=$('defi');return !!d&&d.parentElement===$('fday').parentElement&&/Défi du jour/.test(d.textContent)&&!!d.querySelector('.nd')&&!!d.querySelector('svg')}),'bouton « Défi du jour » à côté de la Famille du jour, avec pastille tant qu\'il n\'est pas joué');
  // progression : une plante au palier 3 presque acquise ne devient pas acquise par le défi ; une plante nouvelle passe au palier 2
  const [i3,i1]=[sA.findIndex(x=>!x[3]),sA.findIndex(x=>x[3])];
  await p.evaluate(([a,c])=>{st.sp[a]={b:3,c:2.5,s:6,e:0,d:0,l:0};delete st.sp[c];save()},[sA[i3][0],sA[i1][0]]);
  if(CAPT)await p.screenshot({path:path.join(CAPT,'defi-1-accueil.png')});
  await p.click('#defi');await p.waitForFunction(()=>curDf&&!$('pic').classList.contains('sk'),null,{timeout:20000});
  ok(await p.evaluate(()=>!$('trn').hidden&&$('chips').hidden&&/Défi du/.test($('trl').textContent)&&/Question 1 sur 10/.test($('trs').textContent)),'défi lancé : barre « Défi du … · Question 1 sur 10 », modes masqués');
  const repondre=async(k,juste)=>{
    await p.waitForFunction(k=>curDf&&cur&&!$('pic').classList.contains('sk')&&document.querySelectorAll('#opts button').length===4,k,{timeout:20000});
    const v=await p.evaluate(()=>({cur:cur[0],opts:[...document.querySelectorAll('#opts button')].map(b=>b.dataset.l),img:document.querySelector('#pic img').src,n:document.querySelectorAll('#pic .car .sl').length}));
    await p.evaluate(j=>{const b=[...document.querySelectorAll('#opts button')].find(x=>j?x.dataset.l===cur[0]:x.dataset.l!==cur[0]);b.click()},juste);
    await p.waitForTimeout(250);return v};
  const R=[1,0,1,1,0,1,1,1,0,1],V=[];
  for(let k=0;k<4;k++){V.push(await repondre(k,R[k]));if(k===0&&CAPT)await p.screenshot({path:path.join(CAPT,'defi-2-question.png')});await p.click('#shn');}
  ok(V.every((v,k)=>v.cur===sA[k][0]&&JSON.stringify(v.opts)===JSON.stringify(sA[k][2])&&v.img===sA[k][1]),'questions imposées : plante, ordre des propositions et photo de la série');
  ok(V.every(v=>v.n===1),'une seule photo par question (pas de carrousel)');
  // reprise après rechargement : on repart à la question 5, les réponses données restent
  await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{const s=$('splash');if(s)s.click()});await p.waitForTimeout(1500);
  await p.evaluate(()=>{navigator.share=undefined;window.__copie='';navigator.clipboard.writeText=async t=>{window.__copie=t}});
  await p.evaluate(()=>{const o=jeuEcrire;window.__jk=[];jeuEcrire=b=>{window.__jk.push(...Object.keys(b.l));o(b)}});   // statistiques notées pendant la suite du défi
  ok(await p.evaluate(()=>/4\/10/.test($('defi').textContent)&&dfEtat().r.join('')==='1011'),'rechargement : le défi reprend à 4/10, réponses gardées');
  await p.click('#defi');
  for(let k=4;k<10;k++){V.push(await repondre(k,R[k]));if(k<9)await p.click('#shn')}
  ok(V[4].cur===sA[4][0],'reprise à la question 5');
  await p.click('#shn');await p.waitForSelector('#dfr:not([hidden])',{timeout:10000});
  const res=await p.evaluate(()=>({s:$('dfr').querySelector('.dfs b').textContent,g:$('dfr').querySelectorAll('.dfg i').length,o:$('dfr').querySelectorAll('.dfg i.o').length,l:$('dfr').querySelectorAll('.dfv li').length,qc:$('qc').hidden}));
  ok(res.s==='7'&&res.g===10&&res.o===7&&res.l===10&&res.qc,'résultat : 7 / 10, grille de 10 cases, 10 plantes à revoir '+JSON.stringify(res));
  if(CAPT)await p.screenshot({path:path.join(CAPT,'defi-3-resultat.png'),fullPage:true});
  ok(await p.evaluate(()=>!$('dfr').querySelector('.tbl,[data-cv]')&&/Crée un compte/.test($('dfr').textContent)),'fin du défi : aucun classement affiché (ils restent dans le profil), invitation à créer un compte');
  await p.click('#df-pa');await p.waitForTimeout(200);
  const txt=await p.evaluate(()=>window.__copie);
  ok(/Défi du \d+ \S+/.test(txt)&&txt.includes('🟩🟥🟩🟩🟥🟩🟩🟩🟥🟩 7/10')&&!/Quercus|[A-Z][a-z]+ [a-z]+ \(/.test(txt.split('\n')[1]),'partage : date, grille et score, sans le nom des plantes');
  // pas de seconde partie
  await p.click('#df-ret');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>!dfOn&&$('dfr').hidden&&!$('qc').hidden&&!$('chips').hidden&&/7\/10/.test($('defi').textContent)&&!$('defi').querySelector('.nd')),'retour au quiz : bouton « Défi du jour · 7/10 », plus de pastille');
  await p.click('#defi');await p.waitForSelector('#dfr:not([hidden])');
  ok(await p.evaluate(()=>dfEtat().r.length===10&&$('dfr').querySelector('.dfs b').textContent==='7'),'second appui : le résultat s\'affiche, pas de nouvelle partie');
  await p.click('#df-ret');await p.waitForTimeout(400);
  // progression et statistiques
  const pr=await p.evaluate(([a,c])=>({a:st.sp[a],c:st.sp[c]}),[sA[i3][0],sA[i1][0]]);
  ok(pr.a.b===3&&!(pr.a.b>=4),'palier 3 presque acquis : le défi ne fait pas acquérir la plante '+JSON.stringify(pr.a));
  ok(R[i1]?pr.c.b===2:pr.c.b===1,'plante nouvelle : progression comptée (palier '+pr.c.b+')');
  // classement du volet profil (données d'exemple) : défi du jour sans périodes, ex æquo, amis pas encore joué en bas
  const cl=await p.evaluate(async()=>{sbU={id:'x'};sbP={pseudo:'moi'};sbRpc=async f=>f==='tableau_defi'?[{pseudo:'Lucie',moi:false,rang:7,score:9,reponses:'1111111110'},{pseudo:'moi',moi:true,rang:4,score:7,reponses:'1011011101'},{pseudo:'Paul',moi:false,rang:5,score:7,reponses:'1110111010'},{pseudo:'Marco',moi:false,rang:2,score:null,reponses:null}]:f==='tableau'?[{pseudo:'moi',moi:true,rang:4,exercices:10,justes:7},{pseudo:'Lucie',moi:false,rang:7,exercices:4,justes:3}]:f==='tableau_periode'?[]:null;
    sbVue='';sbTab=null;const c=await sbCl();const d=document.createElement('div');d.id='tcl';d.innerHTML=c.h;document.body.append(d);
    const rangs=[...d.querySelectorAll('.tbl li')].map(li=>li.querySelector('.tbp').textContent+' '+li.querySelector('.tbn').textContent+' '+li.querySelector('.tbs b').textContent);
    const r={def:d.querySelector('[data-cv="d"]').getAttribute('aria-selected'),per:!!d.querySelector('[data-per]'),rangs,grille:d.querySelectorAll('.tbl li .dfg').length};
    sbVue='a';const c2=await sbCl();d.innerHTML=c2.h;r.perA=!!d.querySelector('[data-per]');r.selA=d.querySelector('[data-cv="a"]').getAttribute('aria-selected');d.remove();return r});
  ok(cl.def==='true'&&!cl.per,'profil : « Défi du jour » choisi par défaut une fois joué, sans semaine ni mois');
  ok(JSON.stringify(cl.rangs)===JSON.stringify(['1 Lucie 9','2 moi 7','2 Paul 7','· Marco –'])&&cl.grille===3,'classement du défi : par score, ex æquo au même rang, « pas encore joué » en bas '+JSON.stringify(cl.rangs));
  ok(cl.perA&&cl.selA==='true','profil : « Assiduité » garde aujourd\'hui, semaine et mois');
  if(CAPT){await p.evaluate(async()=>{const c=await (sbVue='',sbCl());const d=document.createElement('div');d.className='card';d.style.cssText='position:fixed;inset:60px 12px auto;z-index:999';d.innerHTML=c.h;document.body.append(d)});await p.screenshot({path:path.join(CAPT,'defi-4-classement.png')})}
  ok(await p.evaluate(async()=>{await dfResultat();const b=$('df-vc');const r=!!b&&!$('dfr').querySelector('.tbl,[data-cv]');$('df-ret').click();return r}),'avec un compte : bouton « Voir le classement de mes amis » vers le profil, pas de classement sur le résultat');
  await p.waitForTimeout(400);
  const jeu=await p.evaluate(()=>window.__jk);
  ok(jeu.length&&jeu.some(k=>k.endsWith('|defi')),'statistiques de jeu : réponses notées en mode « defi »');
  ok(p.errs.length===0&&B.p.errs.length===0,'aucune erreur de page '+JSON.stringify(p.errs.concat(B.p.errs)));
  // sans index des photos : message clair, pas de défi
  const C=await open({browser:b,w:390,h:844,touch:true,http:true});await C.p.click('#defi');await C.p.waitForTimeout(3200);
  ok(await C.p.evaluate(()=>!dfOn&&/Défi indisponible/.test(document.body.textContent)),'index des photos absent : « Défi indisponible », le quiz continue');
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'DÉFI DU JOUR : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
