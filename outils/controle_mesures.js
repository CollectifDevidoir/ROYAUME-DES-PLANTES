// Mesures d'usage anonymes, de bout en bout, sans réseau : l'appli contre le faux Supabase (vraie base PostgreSQL).
// Visite (type d'appareil, version), écrans ouverts, session, réussite par photo, photo signalée, erreur technique,
// réglages ; repli sur l'ancienne fonction de visite si la base n'est pas à jour ; rien n'est gardé sans projet Supabase.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_mesures.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const URL_SB='https://demo.supabase.co';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8'),F=path.join(os.tmpdir(),'royaume-mesures.html');
  fs.writeFileSync(F,html.replace(/const SB_URL='[^']*',SB_KEY='[^']*';/,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const q=async(sql,pr)=>(await db.query(sql,pr)).rows;
  const cacher=p=>p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
  const montrer=p=>p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true})});
  const o=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F,http:true}),p=o.p,j=[];await brancher(p,db,URL_SB,j);
  await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});await p.waitForTimeout(5800);
  const ap=await p.evaluate(()=>localStorage.getItem('qp.app'));
  const vi=(await q('select * from public.visites where appareil=$1',[ap]))[0];
  ok(vi&&vi.ecran==='telephone'&&vi.largeur===400&&vi.installee===false&&/^\d{4}\.\d\d\.\d\d$/.test(vi.version),'visite : téléphone, largeur arrondie, appli non installée, version '+JSON.stringify(vi&&{e:vi.ecran,l:vi.largeur,v:vi.version}));
  // écrans ouverts
  await p.click('.tabs button[data-t="herb"]');await p.waitForTimeout(300);await p.click('.tabs button[data-t="pro"]');await p.waitForTimeout(300);
  await p.click('.tabs button[data-t="quiz"]');await p.waitForTimeout(300);
  await p.click('#help');await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.waitForTimeout(300);
  await p.click('#ring');await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.waitForTimeout(300);
  // deux QCM, dont un juste ; la photo montrée est notée
  await lance(p,'mcq');const ph1=await p.evaluate(()=>+(document.querySelector('#pic img').src.match(/\/photos\/(\d+)\//)||[])[1]);const e1=await p.evaluate(()=>cur[0]);
  await p.evaluate(()=>[...document.querySelectorAll('#opts button')].find(x=>x.dataset.l===cur[0]).click());
  await lance(p,'mcq');const e2=await p.evaluate(()=>cur[0]);
  // agrandir la photo du quiz : « Photo douteuse ? » visible, la signaler garde l'agrandissement ouvert
  await p.click('#pic img');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!$('zm').hidden&&!$('zms').hidden&&$('zms').textContent==='Photo douteuse ?'),'agrandissement de la photo du quiz : bouton « Photo douteuse ? »');
  await p.click('#zms');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!$('zm').hidden&&$('zms').disabled&&$('zms').textContent==='Photo signalée, merci'),'photo signalée : bouton désactivé, agrandissement toujours ouvert');
  await p.click('#zm img');await p.waitForTimeout(200);ok(await p.evaluate(()=>$('zm').hidden),'agrandissement refermé');
  const ph2=await p.evaluate(()=>+(document.querySelector('#pic img').src.match(/\/photos\/(\d+)\//)||[])[1]);
  await p.evaluate(()=>[...document.querySelectorAll('#opts button')].find(x=>x.dataset.l&&x.dataset.l!==cur[0]).click());
  // erreur technique : nombres et adresse retirés du message
  await p.evaluate(()=>setTimeout(()=>{throw new Error('Panne 4031 de test https://exemple.fr/x?id=9')},0));await p.waitForTimeout(200);
  await cacher(p);await p.waitForTimeout(900);
  const us=await q('select quoi,fois from public.usages where appareil=$1 order by quoi',[ap]),u=Object.fromEntries(us.map(x=>[x.quoi,x.fois]));
  ok(u.herbier===1&&u.progres===1&&u.aide===1&&u.reglages===1&&u.zoom===1&&!u.quiz,'écrans ouverts : herbier, progrès, aide, réglages, agrandissement '+JSON.stringify(u));
  const se=await q('select * from public.sessions where appareil=$1',[ap]);
  ok(se.length===1&&se[0].exercices===2&&se[0].dernier==='quiz','session : 2 exercices, partie quittée depuis le quiz '+JSON.stringify(se.map(x=>({m:x.minutes,n:x.exercices,d:x.dernier}))));
  const pj=await q('select espece,photo,vues,justes from public.photos_jeu where appareil=$1 order by justes desc',[ap]);
  ok(pj.length===2&&+pj[0].photo===ph1&&pj[0].espece===e1&&pj[0].justes===1&&+pj[1].photo===ph2&&pj[1].espece===e2&&pj[1].justes===0,'réussite par photo : la bonne photo pour chaque plante');
  const sg=await q('select espece,photo from public.signalements where appareil=$1',[ap]);
  ok(sg.length===1&&sg[0].espece===e2&&+sg[0].photo===ph2,'photo signalée reçue');
  const er=await q('select * from public.erreurs');
  ok(er.length===1&&er[0].message==='Panne # de test'&&er[0].ecran==='telephone','erreur technique : message nettoyé '+JSON.stringify(er.map(x=>x.message)));
  const rg=await q('select * from public.reglages where appareil=$1',[ap]);
  ok(rg.length===1&&rg[0].objectif===40&&rg[0].mode==='tout','réglages du jour : objectif 40, mode Classique');
  ok(await p.evaluate(()=>{const m=JSON.parse(localStorage.getItem('qp.mes'));return !Object.keys(m.u).length&&!Object.keys(m.p).length&&!Object.keys(m.g).length&&!Object.keys(m.e).length}),'paquet envoyé : retiré de l\'appareil');
  // hors ligne : les mesures restent sur l'appareil puis repartent, sans doublon
  await montrer(p);await p.route(URL_SB+'/rest/v1/rpc/envoyer_mesures',r=>r.abort());
  await p.evaluate(()=>tabTo('herb'));await p.waitForTimeout(200);await p.evaluate(()=>mesEnvoi());await p.waitForTimeout(500);
  ok(await p.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('qp.mes')).u)[0]===1),'hors ligne : le compteur reste sur l\'appareil');
  await p.unroute(URL_SB+'/rest/v1/rpc/envoyer_mesures');await p.evaluate(()=>mesEnvoi());await p.waitForTimeout(700);
  ok((await q("select fois from public.usages where appareil=$1 and quoi='herbier'",[ap]))[0].fois===2,'connexion revenue : compteur arrivé, sans doublon');
  ok(p.errs.length===1,'aucune autre erreur de page '+JSON.stringify(p.errs));
  ok(await p.evaluate(()=>{setPanel='priv';setRender('priv');return /effacées après 13 mois/.test(document.querySelector('#set').textContent)}),'confidentialité : statistiques anonymes et durée de conservation annoncées');
  // base pas encore mise à jour : la visite passe par l'ancienne fonction, les mesures sont refusées sans gêner l'appli
  const db2=await base();await db2.exec('drop function public.noter_visite(uuid, date, boolean, text, int, boolean, text); drop function public.envoyer_mesures(uuid, jsonb);');
  const o2=await open({browser:b,w:1280,h:800,seed:true,file:F,http:true}),j2=[];await brancher(o2.p,db2,URL_SB,j2);
  await o2.p.reload();await o2.p.waitForTimeout(400);await o2.p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});await o2.p.waitForTimeout(5800);
  ok((await db2.query('select count(*)::int n from public.visites')).rows[0].n===1,'base ancienne : visite comptée par compter_visite');
  await lance(o2.p,'mcq');await o2.p.click('#opts button');await cacher(o2.p);await o2.p.waitForTimeout(800);
  ok(o2.p.errs.length===0&&(await db2.query('select count(*)::int n from public.jeu')).rows[0].n>=1,'base ancienne : statistiques de jeu reçues, aucune erreur');
  // projet non configuré : rien n'est gardé
  const F0=path.join(os.tmpdir(),'royaume-mesures0.html');fs.writeFileSync(F0,html.replace(/const SB_URL='[^']*',SB_KEY='[^']*';/,"const SB_URL='',SB_KEY='';"));
  const o3=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F0});await o3.p.click('.tabs button[data-t="herb"]');await o3.p.waitForTimeout(200);
  ok(await o3.p.evaluate(()=>!JSON.parse(localStorage.getItem('qp.mes')||'{"u":{}}').u||!Object.keys(JSON.parse(localStorage.getItem('qp.mes')||'{"u":{}}').u).length),'sans projet Supabase : aucune mesure gardée');
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'MESURES D\'USAGE : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
