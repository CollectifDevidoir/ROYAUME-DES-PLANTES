// Statistiques de jeu anonymes, de bout en bout, sans réseau : l'appli joue contre le faux Supabase
// (outils/supabase/faux_supabase.js, vraie base PostgreSQL) ; on vérifie ce qui arrive dans les tables « jeu »
// et « jeu_confusions » : compteurs, type d'exercice, mode, confusions, envoi groupé, paquet gardé hors ligne.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_jeu.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const URL_SB='https://demo.supabase.co';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8'),F=path.join(os.tmpdir(),'royaume-jeu.html');
  fs.writeFileSync(F,html.replace(/const SB_URL='[^']*',SB_KEY='[^']*';/,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const o=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F}),p=o.p,j=[];await brancher(p,db,URL_SB,j);
  const q=async sql=>(await db.query(sql)).rows;
  await p.waitForTimeout(5500);   // premier envoi au démarrage passé (rien à envoyer)
  const tampon=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('qp.jeu')||'{"l":{},"c":{}}'));
  // 3 QCM : 1 juste, 2 fautes ; 1 nom à écrire, faux
  const faux=async()=>p.evaluate(()=>{const b=[...document.querySelectorAll('#opts button')].find(x=>x.dataset.l&&x.dataset.l!==cur[0]);const r=[cur[0],b.dataset.l];b.click();return r});
  await lance(p,'mcq');const c1=await p.evaluate(()=>cur[0]);await p.evaluate(()=>[...document.querySelectorAll('#opts button')].find(x=>x.dataset.l===cur[0]).click());
  await lance(p,'mcq');const f1=await faux();
  await lance(p,'mcq');const f2=await faux();
  await lance(p,'typed');const c4=await p.evaluate(()=>cur[0]);await p.fill('#q-input','Nimporte quoi');await p.press('#q-input','Enter');
  const t=await tampon(),L=Object.entries(t.l);
  ok(L.reduce((n,[,v])=>n+v.v,0)===4&&L.reduce((n,[,v])=>n+v.ok,0)===1,'4 réponses notées sur l\'appareil, 1 juste');
  ok(L.some(([k])=>k.includes('|saisie|'))&&L.filter(([k])=>k.includes('|qcm|')).length>=1&&L.every(([k])=>k.endsWith('|classique')),'type d\'exercice (QCM, saisie) et mode Classique');
  ok(Object.keys(t.c).length===(f1[0]===f2[0]&&f1[1]===f2[1]?1:2)&&Object.keys(t.c).some(k=>k.endsWith(f1[0]+'|'+f1[1])),'confusions : plante montrée et plante répondue');
  ok(!j.jeu,'rien n\'est envoyé tout de suite (paquet groupé)');
  // départ de la page : envoi immédiat
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
  await p.waitForTimeout(800);
  const r=await q('select * from public.jeu_par_jour');
  ok(j.jeu===1&&r.length===1&&+r[0].exercices===4&&+r[0].justes===1&&+r[0].joueurs===1,'page quittée : paquet envoyé en une requête '+JSON.stringify(r[0]));
  ok(Object.keys((await tampon()).l).length===0,'paquet envoyé : retiré de l\'appareil');
  const cf=await q('select * from public.confusions');ok(cf.some(x=>x.plante_montree===f1[0]&&x.reponse_donnee===f1[1]),'confusion reçue : '+f1.join(' → '));
  const ap=await p.evaluate(()=>localStorage.getItem('qp.app'));ok((await q(`select distinct appareil::text a from public.jeu`)).every(x=>x.a===ap),'même identifiant d\'appareil anonyme que les visites');
  ok((await q(`select * from public.jeu where espece='${c4}' and exercice='saisie'`)).length===1&&(await q(`select * from public.jeu where espece='${c1}' and justes=1`)).length===1,'plante, exercice et réussite par ligne');
  // hors ligne : le paquet reste sur l'appareil et repart ensuite
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true})});
  await p.route(URL_SB+'/rest/v1/rpc/envoyer_jeu',r=>r.abort());
  await p.evaluate(()=>{startReplay0([cur[0],cur[0]],'Mes erreurs du jour')});await p.waitForFunction(()=>!$('pic').classList.contains('sk')&&curTrain,null,{timeout:20000});
  await p.waitForTimeout(400);await p.evaluate(()=>{const b=document.querySelector('#opts button');if(b)b.click();else answer('X')});
  await p.evaluate(()=>jeuEnvoi());await p.waitForTimeout(600);
  const t2=await tampon();ok(Object.keys(t2.l).length===1&&Object.keys(t2.l)[0].endsWith('|erreurs'),'hors ligne : la réponse reste sur l\'appareil (mode « erreurs »)');
  await p.unroute(URL_SB+'/rest/v1/rpc/envoyer_jeu');
  await p.evaluate(()=>jeuEnvoi());await p.waitForTimeout(800);
  ok(+(await q('select sum(vues) n from public.jeu'))[0].n===5&&(await q("select * from public.jeu where mode='erreurs'")).length===1,'connexion revenue : le paquet est arrivé, sans doublon');
  // projet non configuré : rien n'est noté
  const F0=path.join(os.tmpdir(),'royaume-jeu0.html');fs.writeFileSync(F0,html.replace(/const SB_URL='[^']*',SB_KEY='[^']*';/,"const SB_URL='',SB_KEY='';"));
  const o2=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F0});await lance(o2.p,'mcq');await o2.p.click('#opts button');
  ok(await o2.p.evaluate(()=>localStorage.getItem('qp.jeu')===null),'sans projet Supabase : aucune statistique gardée');
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'STATISTIQUES DE JEU : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
