// Défi du jour, de bout en bout (index des photos réel, photos générées) : 30 séries de 10 questions bien formées,
// même série pour deux appareils, QCM ou 4 photos, une seule réponse, correction expliquée, reprise après rechargement,
// résultat, partage, pas de seconde partie, réponses hors objectif du jour et herbier, classement du volet profil.
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
  const serie=p=>p.evaluate(async()=>{await dqpPret();return JSON.stringify(dfSerie(dfJour()))});   // jours planifiés : le planning se charge d'abord
  const A=await appareil({seed:true}),p=A.p;
  // un autre appareil, avec un autre hasard et une progression : même série
  const B=await appareil({state:JSON.stringify({sp:{'Quercus robur':{b:4,s:9,e:1,d:0}},set:{goal:20,vib:false}})});
  const sA=JSON.parse(await serie(p)),sB=JSON.parse(await serie(B.p));
  ok(sA&&sA.length===10&&JSON.stringify(sA)===JSON.stringify(sB),'série du jour : 10 questions, les mêmes sur deux appareils différents');
  ok(await p.evaluate(()=>dfJour()===new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date())),'jour du défi : date de Paris');
  // les 30 séries préparées : 300 questions différentes, bien formées, niveaux et thèmes répartis
  const v=await p.evaluate(()=>{const sp=new Set(S.map(s=>s[0])),pb=[],cles=new Set();
    const jours=Array.from({length:30},(_,k)=>{const d=new Date(Date.UTC(2026,0,1+k));return dfNum(d.toISOString().slice(0,10))});
    DQ.forEach((sr,j)=>{if(sr.length!==10)pb.push(j+' : '+sr.length+' questions');
      const niv=sr.map(q=>q.niveau);if(niv.filter(x=>x==='simple').length!==3||niv.slice(0,4).filter(x=>x==='simple').length!==3||!niv.includes('piege')||niv.filter(x=>x==='difficile').length<4)pb.push(j+' niveaux '+niv);
      if(new Set(sr.map(q=>q.theme)).size<6)pb.push(j+' : moins de 6 thèmes');
      sr.forEach((q,i)=>{const k=q.question+'|'+(q.texte||'')+'|'+q.choix.join();if(cles.has(k))pb.push('doublon '+q.question);cles.add(k);
        if(i&&sr[i-1].theme===q.theme)pb.push(j+'.'+i+' thème répété '+q.theme);
        if(!['qcm','images'].includes(q.format))pb.push('format '+q.format);
        if(q.choix.length!==4||new Set(q.choix).size!==4||!(q.bonne>=0&&q.bonne<4))pb.push('choix '+q.question);
        if((q.format==='images'||q.plantes)&&!q.choix.every(c=>sp.has(c)))pb.push('plante inconnue '+q.choix);
        if(!q.explication)pb.push('sans explication '+q.question);
        if((q.sources||[]).some(u=>!/^https?:\/\/\S+$/.test(u)))pb.push('source '+q.sources)})});
    return{n:DQ.length,pb,jours:new Set(jours).size,img:DQ.flat().filter(q=>q.format==='images').length,bonne:[0,1,2,3].map(k=>DQ.flat().filter(q=>q.bonne===k).length)}});
  ok(v.n===30&&v.jours===30&&!v.pb.length,'30 séries de 10 questions, une par jour pendant 30 jours ; propositions, plantes, explications et sources bien formées '+JSON.stringify(v.pb.slice(0,5)));
  ok(v.img>=60&&v.img<=240&&v.bonne.every(x=>x>=45),'formats mêlés (QCM et 4 images : '+v.img+' questions en images) ; bonne réponse à toutes les places '+JSON.stringify(v.bonne));
  // bouton à côté de la Famille du jour
  ok(await p.evaluate(()=>{const d=$('defi');return !!d&&d.parentElement===$('fday').parentElement&&/Défi du jour/.test(d.textContent)&&!!d.querySelector('.nd')&&!!d.querySelector('svg')}),'bouton « Défi du jour » à côté de la Famille du jour, avec pastille tant qu\'il n\'est pas joué');
  const sp0=await p.evaluate(()=>JSON.stringify(st.sp)),h0=await p.evaluate(()=>(st.hist[today()]||{n:0}).n);
  if(CAPT)await p.screenshot({path:path.join(CAPT,'defi-1-accueil.png')});
  await p.click('#defi');await p.waitForSelector('#dfr:not([hidden]) #df-o button',{timeout:10000});
  ok(await p.evaluate(()=>!$('trn').hidden&&$('chips').hidden&&$('qc').hidden&&/Défi du/.test($('trl').textContent)&&/Question 1 sur 10/.test($('trs').textContent)),'défi lancé : barre « Défi du … · Question 1 sur 10 », quiz et modes masqués');
  const repondre=async(k,juste)=>{
    await p.waitForFunction(k=>dfEtat()&&dfEtat().r.length===k&&document.querySelectorAll('#df-o button').length===4,k,{timeout:10000});
    const q=sA[k],img=q.format==='images';
    if(img)await p.waitForFunction(()=>document.querySelectorAll('#df-o button img').length===4,null,{timeout:15000}).catch(()=>{});
    const vu=await p.evaluate(()=>({q:$('df-q').textContent,th:$('dfr').querySelector('.dft').textContent,ph:$('df-o').classList.contains('ph'),imgs:document.querySelectorAll('#df-o button img').length,txt:[...document.querySelectorAll('#df-o button')].map(b=>b.textContent)}));
    const i=juste?q.bonne:(q.bonne+1)%4;
    await p.click(`#df-o button:nth-child(${i+1})`);await p.waitForTimeout(150);
    await p.click(`#df-o button:nth-child(${(i+1)%4+1})`,{force:true}).catch(()=>{});   // un second appui ne compte pas
    const fb=await p.evaluate(()=>({ok:!!$('df-fb').querySelector('.dfk.ok'),ko:!!$('df-fb').querySelector('.dfk.ko'),ex:$('df-fb').querySelector('.dfx-e').textContent,dis:[...document.querySelectorAll('#df-o button')].every(b=>b.disabled),bon:document.querySelector('#df-o button.ok')===document.querySelectorAll('#df-o button')[dfSerie(dfJour())[dfEtat().r.length-1].bonne],n:dfEtat().r.length}));
    return{vu,fb,q,img}};
  const R=[1,0,1,1,0,1,1,1,0,1],V=[];
  for(let k=0;k<4;k++){V.push(await repondre(k,R[k]));if(k===0&&CAPT)await p.screenshot({path:path.join(CAPT,'defi-2-question.png'),fullPage:true});await p.click('#df-nx')}
  ok(V.every(x=>x.vu.q===x.q.question&&x.vu.th===x.q.theme&&x.vu.ph===x.img),'questions imposées : énoncé, thème et forme de réponse de la série');
  ok(V.every(x=>!x.img||x.vu.imgs===4),'question en images : 4 photos à toucher');
  ok(V.every((x,k)=>x.fb.n===k+1&&x.fb.dis&&x.fb.bon&&(R[k]?x.fb.ok:x.fb.ko)&&x.fb.ex.includes((x.q.explication||'').slice(0,30))),'une seule réponse par question, bonne réponse montrée, correction expliquée');
  // reprise après rechargement : on repart à la question 5, les réponses données restent
  await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{const s=$('splash');if(s)s.click()});await p.waitForTimeout(1500);
  await p.evaluate(()=>{navigator.share=undefined;window.__copie='';navigator.clipboard.writeText=async t=>{window.__copie=t}});
  ok(await p.evaluate(()=>/4\/10/.test($('defi').textContent)&&dfEtat().r.join('')==='1011'),'rechargement : le défi reprend à 4/10, réponses gardées');
  await p.click('#defi');
  for(let k=4;k<10;k++){V.push(await repondre(k,R[k]));if(k<9)await p.click('#df-nx')}
  ok(V[4].vu.q===sA[4].question,'reprise à la question 5');
  ok(await p.evaluate(()=>$('df-nx').textContent==='Voir mon résultat'),'dernière question : « Voir mon résultat »');
  await p.click('#df-nx');await p.waitForSelector('#dfr:not([hidden]) .dfs',{timeout:10000});
  const res=await p.evaluate(()=>({s:$('dfr').querySelector('.dfs b').textContent,g:$('dfr').querySelectorAll('.dfg i').length,o:$('dfr').querySelectorAll('.dfg i.o').length,l:$('dfr').querySelectorAll('.dfv li').length,qc:$('qc').hidden}));
  ok(res.s==='7'&&res.g===10&&res.o===7&&res.l===10&&res.qc,'résultat : 7 / 10, grille de 10 cases, 10 questions à revoir avec leur réponse '+JSON.stringify(res));
  if(CAPT)await p.screenshot({path:path.join(CAPT,'defi-3-resultat.png'),fullPage:true});
  ok(await p.evaluate(()=>!$('dfr').querySelector('.tbl,[data-cv]')&&/Crée un compte/.test($('dfr').textContent)),'fin du défi sans compte : pas de classement, invitation à créer un compte');
  await p.click('#df-pa');await p.waitForTimeout(200);
  const txt=await p.evaluate(()=>window.__copie);
  ok(/Défi du \d+ \S+/.test(txt)&&txt.includes('🟩🟥🟩🟩🟥🟩🟩🟩🟥🟩 7/10'),'partage : date, grille et score');
  // pas de seconde partie
  await p.click('#df-ret');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>!dfOn&&$('dfr').hidden&&!$('qc').hidden&&!$('chips').hidden&&/7\/10/.test($('defi').textContent)&&!$('defi').querySelector('.nd')),'retour au quiz : bouton « Défi du jour · 7/10 », plus de pastille');
  await p.click('#defi');await p.waitForSelector('#dfr:not([hidden]) .dfs');
  ok(await p.evaluate(()=>dfEtat().r.length===10&&$('dfr').querySelector('.dfs b').textContent==='7'),'second appui : le résultat s\'affiche, pas de nouvelle partie');
  await p.click('#df-ret');await p.waitForTimeout(400);
  // mode à part : les 10 réponses ne comptent ni pour l'objectif du jour (historique), ni pour les plantes de l'herbier
  const pr=await p.evaluate(()=>({n:(st.hist[today()]||{n:0}).n,sp:JSON.stringify(st.sp)}));
  ok(pr.n===h0,'objectif du jour, Progrès, Régularité : les réponses du défi ne comptent pas ('+(pr.n-h0)+')');
  ok(pr.sp===sp0,'herbier : le défi ne fait ni avancer ni acquérir de plante');
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
  ok(await p.evaluate(async()=>{await dfResultat();const c=$('df-cl'),r=!!c&&c.querySelectorAll('.tbl li').length===4&&/Lucie/.test(c.textContent)&&!$('dfr').querySelector('[data-cv],[data-per]');$('df-ret').click();return r}),'avec un compte : classement du défi du jour seulement (ni Assiduité, ni périodes)');
  await p.waitForTimeout(400);
  ok(p.errs.length===0&&B.p.errs.length===0,'aucune erreur de page '+JSON.stringify(p.errs.concat(B.p.errs)));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'DÉFI DU JOUR : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
