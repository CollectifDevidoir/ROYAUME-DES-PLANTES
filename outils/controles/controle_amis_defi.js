// Classement général du Défi du jour et demandes d'ami, sans réseau (faux Supabase adossé à PGlite) :
// - fin du défi : classement de tous les joueurs (pas seulement les amis), avec « ami » repéré ;
// - toucher un joueur ouvre sa fiche : proposer de devenir ami → demande en attente (pas de doublon) → il accepte → amis ;
// - profil / Amis : classement du défi et Assiduité toujours limités aux amis.
// Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_amis_defi.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const URL_SB='https://demo.supabase.co';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'..','..','index.html'),'utf8'),LIGNE=/const SB_URL='([^']*)',SB_KEY='([^']*)';/;
  const F=path.join(os.tmpdir(),'royaume-amis-defi.html');fs.writeFileSync(F,html.replace(LIGNE,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const appareil=async()=>{const o=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F,http:true});const j=[];await brancher(o.p,db,URL_SB,j);return o};
  const att=async(p,f,arg,ms=10000)=>{try{await p.waitForFunction(f,arg,{timeout:ms});return true}catch(e){return false}};
  const compte=async(p,mail,pseudo)=>{await p.click('#medal');await att(p,()=>!!document.querySelector('#sb-f'));
    await p.fill('#sb-mail',mail);await p.fill('#sb-mdp','Secret-123');await p.click('#sb-tup');await p.click('#sb-go');
    await att(p,()=>!!document.querySelector('#sb-pf'));await p.fill('#sb-ps',pseudo);await p.click('#sb-pf button');
    const r=await att(p,()=>!!document.querySelector('#sb-code'),null,15000);await fermer(p);return r};
  const fermer=p=>p.evaluate(()=>{const d=$('prf');if(d.close)d.close();else d.removeAttribute('open')});
  const defi=async(p,faux)=>{await p.click('#defi');await att(p,()=>dfOn&&!!document.querySelector('#df-o button'));
    await p.evaluate(f=>{for(let i=0;i<10;i++){dfRepond(i<f?dfSerie(dfJour())[i].bonne:(dfSerie(dfJour())[i].bonne+1)%4);if(i<9)dfQuestion()}},faux);
    await att(p,()=>dfFait()&&dfEtat().pub===1);await p.evaluate(()=>dfResultat())};
  const lignes=p=>p.evaluate(()=>[...document.querySelectorAll('#df-cl .tbl li')].map(li=>({n:li.querySelector('.tbn').textContent,r:li.querySelector('.tbp').textContent,ami:!!li.querySelector('.tbt.ami'),moi:li.classList.contains('moi'),clic:li.hasAttribute('data-jp')})));

  const A=await appareil(),B=await appareil(),C=await appareil();
  ok(await compte(A.p,'antoine@test.fr','Antoine'),'Antoine : compte créé');
  ok(await compte(B.p,'bea@test.fr','Bea'),'Béa : compte créé');
  ok(await compte(C.p,'cleo@test.fr','Cleo'),'Cléo : compte créé');
  await defi(B.p,1);await defi(C.p,4);await defi(A.p,3);   // Béa 1, Cléo 4 (elles ne sont amies de personne), Antoine 3

  // ---- classement général à la fin du défi
  ok(await att(A.p,()=>document.querySelectorAll('#df-cl .tbl li').length>=3),'Antoine : le classement du défi liste les 3 joueurs, pas seulement ses amis');
  let L=await lignes(A.p);
  ok(L.map(x=>x.n).join()==='Cleo,Antoine,Bea'&&L.map(x=>x.r).join()==='1,2,3','… classés par score : '+JSON.stringify(L.map(x=>[x.n,x.r])));
  ok(L.find(x=>x.moi).n==='Antoine'&&!L.find(x=>x.moi).clic&&L.filter(x=>!x.moi).every(x=>x.clic),'… sa ligne n\'est pas cliquable, celles des autres le sont');
  ok(await A.p.evaluate(()=>/tous les joueurs/.test($('df-cl').textContent)&&!/Touche un joueur/.test($('df-cl').textContent)),'… titre « tous les joueurs », sans phrase d\'explication');

  // ---- fiche du joueur et demande d'ami
  await A.p.click('#df-cl li[data-jp="Bea"]');
  ok(await att(A.p,()=>$('jou').open&&!!document.querySelector('#jou-add')),'toucher Béa ouvre sa fiche avec « Proposer de devenir ami »');
  ok(await A.p.evaluate(()=>/Bea/.test($('jou-b').textContent)&&!/RPL-/.test($('jou-b').textContent)),'… la fiche montre son pseudo mais pas son code ami');
  await A.p.click('#jou-add');
  ok(await att(A.p,()=>/Demande envoyée/.test($('jou-b').textContent)&&!document.querySelector('#jou-add')),'demande envoyée : plus de bouton, « Demande envoyée »');
  await A.p.evaluate(()=>$('jou').close());await A.p.click('#df-cl li[data-jp="Bea"]');
  ok(await att(A.p,()=>/Demande envoyée/.test($('jou-b').textContent)&&!document.querySelector('#jou-add')),'rouvrir la fiche : toujours « en attente », pas de nouvelle demande possible');
  ok((await db.query('select count(*)::int n from public.demandes_ami')).rows[0].n===1,'une seule demande enregistrée');
  await A.p.evaluate(()=>$('jou').close());
  ok(!(await lignes(A.p)).some(x=>x.ami),'… en attente : Béa n\'est pas encore marquée « ami »');

  // ---- pastille : Béa a une demande en attente
  ok(await att(B.p,()=>{sbDem();return $('medal').classList.contains('dm')},null,8000),'Béa : pastille sur le médaillon (demande reçue)');
  ok(await A.p.evaluate(()=>!$('medal').classList.contains('dm')),'Antoine : pas de pastille');
  // ---- côté Béa : demande reçue, profil
  await B.p.click('#medal');
  ok(await att(B.p,()=>/Demandes d'ami \(1\)/.test($('ami').textContent)&&!!document.querySelector('[data-dok="Antoine"]')),'Béa : « Demandes d\'ami (1) » dans son profil, avec Accepter / Refuser');
  ok(await B.p.evaluate(()=>!/Antoine/.test(document.querySelector('#sb-cl').textContent)),'Béa : avant acceptation, Antoine n\'est pas dans son classement entre amis');
  // fiche d'Antoine depuis le classement du défi de Béa : demande reçue → Accepter / Refuser
  await fermer(B.p);await B.p.evaluate(()=>dfResultat());await att(B.p,()=>document.querySelectorAll('#df-cl .tbl li').length>=3);
  await B.p.click('#df-cl li[data-jp="Antoine"]');
  ok(await att(B.p,()=>!!document.querySelector('#jou-ok')&&!!document.querySelector('#jou-no')&&/te propose/.test($('jou-b').textContent)),'Béa : la fiche d\'Antoine propose Accepter / Refuser');
  await B.p.click('#jou-ok');
  ok(await att(B.p,()=>/Vous êtes amis/.test($('jou-b').textContent)),'Béa accepte : « Vous êtes amis »');
  await B.p.evaluate(()=>$('jou').close());
  ok(await att(B.p,()=>[...document.querySelectorAll('#df-cl .tbl li')].some(li=>li.querySelector('.tbn').textContent==='Antoine'&&li.querySelector('.tbt.ami'))),'classement général de Béa : Antoine marqué « ami »');
  ok((await db.query('select count(*)::int n from public.demandes_ami')).rows[0].n===0&&(await db.query('select count(*)::int n from public.amities')).rows[0].n===2,'demande effacée, amitié dans les deux sens');

  ok(await att(B.p,()=>!$('medal').classList.contains('dm')),'Béa : pastille disparue une fois la demande traitée');
  // ---- masquer son profil : Cléo disparaît du classement d'Antoine mais se voit elle-même
  await C.p.click('#medal');await att(C.p,()=>!!document.querySelector('#sb-vis'));
  ok(await C.p.evaluate(()=>$('sb-vis').getAttribute('aria-checked')==='true'&&!$('ami').querySelector('.sbc small')),'profil : interrupteur « Classement général du défi » activé par défaut, sans phrase d\'explication');
  await C.p.click('#sb-vis');await att(C.p,()=>document.querySelector('#sb-vis')&&$('sb-vis').getAttribute('aria-checked')==='false');
  ok((await db.query("select visible from public.profils where pseudo='Cleo'")).rows[0].visible===false,'interrupteur désactivé : enregistré');
  await fermer(C.p);
  await A.p.evaluate(()=>dfClGeneral(dfJour()));await att(A.p,()=>document.querySelectorAll('#df-cl .tbl li').length===2);
  ok((await lignes(A.p)).map(x=>x.n).join()==='Antoine,Bea','Antoine ne voit plus Cléo dans le classement général');
  await C.p.evaluate(()=>dfResultat());await att(C.p,()=>document.querySelectorAll('#df-cl .tbl li').length>=3);
  ok((await lignes(C.p)).some(x=>x.n==='Cleo'&&x.moi)&&await C.p.evaluate(()=>/masqué/.test($('df-cl').textContent)),'Cléo se voit toujours, marquée « masqué »');
  await C.p.click('#medal');await att(C.p,()=>!!document.querySelector('#sb-vis'));await C.p.click('#sb-vis');await att(C.p,()=>document.querySelector('#sb-vis')&&$('sb-vis').getAttribute('aria-checked')==='true');await fermer(C.p);
  // ---- classements entre amis et d'Assiduité inchangés (amis seulement)
  const amisA=await A.p.evaluate(async()=>{sbTab=null;sbVue='d';const c=await sbCl();const d=document.createElement('div');d.innerHTML=c.h;return {n:[...d.querySelectorAll('.tbl li .tbn')].map(x=>x.textContent),t:d.textContent}});
  ok(amisA.n.sort().join()==='Antoine,Bea'&&/entre amis/.test(amisA.t),'Profil / Amis, Défi du jour : Antoine ne voit que lui et Béa (Cléo absente), titre « entre amis » '+JSON.stringify(amisA.n));
  const assA=await A.p.evaluate(async()=>{sbTab=null;sbVue='a';sbPer='j';const c=await sbCl();const d=document.createElement('div');d.innerHTML=c.h;sbVue='';return [...d.querySelectorAll('.tbl li .tbn')].map(x=>x.textContent).sort()});
  ok(assA.join()==='Antoine,Bea','Profil / Amis, Assiduité : amis seulement '+JSON.stringify(assA));

  // ---- Cléo : refus, puis plus de relance possible
  await C.p.evaluate(()=>dfResultat());await att(C.p,()=>document.querySelectorAll('#df-cl .tbl li').length>=3);
  await C.p.click('#df-cl li[data-jp="Bea"]');await att(C.p,()=>!!document.querySelector('#jou-add'));await C.p.click('#jou-add');await att(C.p,()=>/Demande envoyée/.test($('jou-b').textContent));await C.p.evaluate(()=>$('jou').close());
  await B.p.click('#medal');await att(B.p,()=>!!document.querySelector('[data-dno="Cleo"]'));await B.p.click('[data-dno="Cleo"]');
  ok(await att(B.p,()=>!document.querySelector('[data-dno]')&&!/Demandes d'ami/.test($('ami').textContent)),'Béa refuse Cléo : la demande disparaît de son profil');
  await C.p.click('#df-cl li[data-jp="Bea"]');
  ok(await att(C.p,()=>/Demande envoyée/.test($('jou-b').textContent)&&!document.querySelector('#jou-add')),'Cléo voit toujours « envoyée » et ne peut pas relancer');
  // ---- sans compte : pas de classement général, message d'invitation
  const H=await appareil();await H.p.click('#defi');await att(H.p,()=>dfOn&&!!document.querySelector('#df-o button'));
  await H.p.evaluate(()=>{for(let i=0;i<10;i++){dfRepond(0);if(i<9)dfQuestion()}dfResultat()});
  ok(await att(H.p,()=>/Crée un compte/.test($('dfr').textContent)&&!document.querySelector('#df-cl')),'sans compte : invitation à créer un compte, pas de classement');
  for(const [m,o] of [['Antoine',A],['Béa',B],['Cléo',C],['sans compte',H]])ok(o.p.errs.length===0,m+' : aucune erreur JavaScript '+(o.p.errs.length?JSON.stringify(o.p.errs.slice(0,2)):''));
  await b.close();fs.unlinkSync(F);
  console.log(ech?ech+' ÉCHEC(S)':'AMIS ET CLASSEMENT GÉNÉRAL DU DÉFI : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
