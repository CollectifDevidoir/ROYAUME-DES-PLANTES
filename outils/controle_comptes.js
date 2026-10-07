// Comptes (Supabase), de bout en bout, sans réseau : la vraie bibliothèque supabase-js parle à un faux
// Supabase (outils/supabase/faux_supabase.js) adossé à une vraie base PostgreSQL (PGlite) qui exécute
// supabase/schema.sql. Deux « appareils » : Antoine et Coline ; puis Antoine sur un nouvel appareil.
// Ensuite : adresse du tableau de bord collée par erreur, clé secrète refusée, lien de connexion par e-mail
// (l'appli est alors servie à une adresse https simulée).
// Usage : NODE_PATH=$(npm root -g) node outils/controle_comptes.js [index.html] [dossier_captures]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const SRC=process.argv[2]||path.resolve(__dirname,'..','index.html'),DOS=process.argv[3]||null,URL_SB='https://demo.supabase.co';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  // copie de l'appli avec un projet Supabase de test
  const html=fs.readFileSync(SRC,'utf8'),LIGNE=/const SB_URL='([^']*)',SB_KEY='([^']*)';/,cfg=html.match(LIGNE);
  ok(cfg&&(!cfg[1]&&!cfg[2]||/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(cfg[1])&&/^(sb_publishable_|eyJ)/.test(cfg[2])),'appli livrée sans projet, ou avec l\'URL du projet et sa clé publique ('+(cfg?cfg[1]||'vide':'ligne introuvable')+')');
  const copie=(nom,url,cle)=>{const f=path.join(os.tmpdir(),'royaume-'+nom+'.html');fs.writeFileSync(f,html.replace(LIGNE,`const SB_URL='${url}',SB_KEY='${cle}';`));return f};
  const F=copie('comptes',URL_SB,'cle-anon-test');
  if(DOS)fs.mkdirSync(DOS,{recursive:true});
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const appareil=async(w=390,h=844,file=F,url=URL_SB)=>{const o=await open({browser:b,w,h,touch:w<900,seed:true,file});const j=[];await brancher(o.p,db,url,j);o.j=j;return o};
  const T=async(p,n)=>{await p.waitForTimeout(250);if(DOS)await p.screenshot({path:path.join(DOS,n+'.png')})};
  const att=async(p,f,arg,ms=8000)=>{try{await p.waitForFunction(f,arg,{timeout:ms});return true}catch(e){return false}};
  const txt=p=>p.evaluate(()=>$('ami').innerText);
  // ---- Antoine : premier appareil
  const A=await appareil();
  ok(!A.j.length,'au démarrage sans session : aucune requête vers Supabase');
  await lance(A.p,'mcq');await A.p.click('#opts button');await A.p.waitForTimeout(500);await A.p.click('#shn');await A.p.waitForTimeout(400);
  await A.p.click('.tabs button[data-t=ami]');ok(await att(A.p,()=>!!document.querySelector('#sb-f')),'onglet Profil : formulaire de connexion');await T(A.p,'1-connexion');
  await A.p.fill('#sb-mail','antoine@test.fr');await A.p.fill('#sb-mdp','mauvais');await A.p.click('#sb-in');
  ok(await att(A.p,()=>/incorrect/.test($('ami').innerText)),'mauvais identifiants : « E-mail ou mot de passe incorrect »');
  await A.p.fill('#sb-mail','antoine@test.fr');await A.p.fill('#sb-mdp','secret123');await A.p.click('#sb-up');
  ok(await att(A.p,()=>!!document.querySelector('#sb-pf')),'compte créé : choix du pseudo');await T(A.p,'2-pseudo');
  await A.p.fill('#sb-ps','Antoine');await A.p.click('#sb-pf button');
  ok(await att(A.p,()=>/RPL-[A-Z0-9]{5}/.test($('ami').innerText)),'profil créé avec un code ami');
  const codeA=await A.p.evaluate(()=>$('sb-code').textContent);
  ok(/Antoine/.test(await txt(A.p))&&/1\s*\n?\s*jour de suite/.test(await txt(A.p)),'profil : pseudo, rang, bilan et jours de suite');
  ok(A.j.some(x=>x.includes('rpc/publier'))&&A.j.some(x=>x.includes('rpc/sauver_progression')),'chiffres et progression envoyés au compte');
  // ---- Coline : second appareil
  const B=await appareil();for(let i=0;i<2;i++){await lance(B.p,'mcq');await B.p.click('#opts button');await B.p.waitForTimeout(400);await B.p.click('#shn');await B.p.waitForTimeout(400)}
  await B.p.click('.tabs button[data-t=ami]');await att(B.p,()=>!!document.querySelector('#sb-f'));
  await B.p.fill('#sb-mail','coline@test.fr');await B.p.fill('#sb-mdp','secret456');await B.p.click('#sb-up');await att(B.p,()=>!!document.querySelector('#sb-pf'));
  await B.p.fill('#sb-ps','Antoine');await B.p.click('#sb-pf button');ok(await att(B.p,()=>/déjà pris/.test($('ami').innerText)),'pseudo déjà pris : message clair');
  await B.p.fill('#sb-ps','Coline');await B.p.click('#sb-pf button');await att(B.p,()=>!!document.querySelector('#sb-af'));
  const codeB=await B.p.evaluate(()=>$('sb-code').textContent);
  await B.p.fill('#sb-ac',codeB);await B.p.click('#sb-af button');ok(await att(B.p,()=>/propre code/.test($('ami').innerText)),'son propre code : refusé');
  await B.p.fill('#sb-ac','RPL-ZZZZZ');await B.p.click('#sb-af button');ok(await att(B.p,()=>/Aucun ami avec ce code/.test($('ami').innerText)),'code inconnu : message clair');
  await B.p.fill('#sb-ac',codeA.toLowerCase());await B.p.click('#sb-af button');
  ok(await att(B.p,()=>/Antoine fait maintenant partie/.test($('ami').innerText)&&document.querySelectorAll('.tbm tbody tr').length===2),'ami ajouté avec son code (minuscules acceptées) : tableau à 2 lignes');
  const lignes=await B.p.evaluate(()=>[...document.querySelectorAll('.tbm tbody tr')].map(r=>[...r.cells].map(c=>c.innerText.trim())));
  ok(lignes[0][0]==='Coline'&&lignes[0][1]==='2'&&lignes[1][0]==='Antoine'&&lignes[1][1]==='1','tableau du jour : Coline 2 exercices, Antoine 1, du plus actif au moins actif');
  ok(await B.p.evaluate(()=>document.querySelector('.tbm tr.moi td').innerText.trim()==='Coline'),'ma ligne est mise en avant');await T(B.p,'3-tableau');
  // ---- Antoine voit Coline après actualisation
  await A.p.click('#sb-maj');ok(await att(A.p,()=>/Coline/.test($('ami').innerText)),'Antoine voit Coline (amitié réciproque)');
  // ---- Antoine sur un nouvel appareil : sa progression revient
  const kA=await A.p.evaluate(()=>Object.keys(st.sp).length);
  const C=await appareil(1440,900);await C.p.click('.tabs button[data-t=ami]');await att(C.p,()=>!!document.querySelector('#sb-f'));
  await C.p.fill('#sb-mail','antoine@test.fr');await C.p.fill('#sb-mdp','secret123');await C.p.click('#sb-in');
  ok(await att(C.p,()=>!!document.querySelector('#sb-code')),'connexion sur un nouvel appareil');
  ok(await C.p.evaluate(k=>Object.keys(st.sp).length===k&&(st.hist[today()]||{}).n===1,kA),'nouvel appareil : la progression du compte est reprise ('+kA+' plante(s), 1 exercice)');await T(C.p,'4-ordinateur');
  // la session est gardée : rechargement
  await C.p.reload();await C.p.waitForTimeout(600);await C.p.evaluate(()=>{const s=$('splash');if(s)s.click()});await C.p.waitForTimeout(1600);
  await C.p.click('.tabs button[data-t=ami]');ok(await att(C.p,()=>!!document.querySelector('#sb-code'),null,15000),'session gardée après rechargement');
  // réseau coupé ou projet Supabase en pause : message clair, pas de demande de pseudo, puis reprise
  await C.p.route(URL_SB+'/rest/**',r=>r.abort());await C.p.evaluate(()=>sbConnecte());
  ok(await att(C.p,()=>/Le serveur des comptes ne répond pas/.test($('ami').innerText)&&!document.querySelector('#sb-pf')&&!!document.querySelector('#sb-re')),'réseau coupé : « Le serveur des comptes ne répond pas… » et bouton Réessayer');
  await C.p.unroute(URL_SB+'/rest/**');await C.p.click('#sb-re');ok(await att(C.p,()=>!!document.querySelector('#sb-code')),'réseau revenu : Réessayer rétablit le profil');
  await C.p.click('#sb-out');ok(await att(C.p,()=>!!document.querySelector('#sb-f')),'déconnexion : retour au formulaire');
  // ---- Coline supprime son compte
  B.p.once('dialog',d=>d.accept());await B.p.click('#sb-del');ok(await att(B.p,()=>!!document.querySelector('#sb-f')),'compte supprimé : retour au formulaire');
  await A.p.click('#sb-maj');ok(await att(A.p,()=>!/Coline/.test($('ami').innerText)),'Coline a disparu du tableau d\'Antoine');
  // ---- lien de connexion par e-mail : seulement si l'appli est servie en http(s)
  ok(await C.p.evaluate(()=>!document.querySelector('#sb-otp')),'fichier local : pas de bouton « lien par e-mail » (il exige une adresse web)');
  // ---- adresse de la page du tableau de bord collée par erreur : l'appli en déduit l'URL du projet
  const ID='abcdefghijklmnopqrst',URL_D='https://'+ID+'.supabase.co';
  const D=await appareil(390,844,copie('tableau',`https://supabase.com/dashboard/project/${ID}/settings/api-keys`,'cle-anon-test'),URL_D);
  const versTdb=[];D.p.on('request',q=>{if(q.url().startsWith('https://supabase.com/'))versTdb.push(q.url())});
  ok(await D.p.evaluate(u=>SBU===u,URL_D),'adresse du tableau de bord corrigée en '+URL_D);
  await D.p.click('.tabs button[data-t=ami]');await att(D.p,()=>!!document.querySelector('#sb-f'));
  await D.p.fill('#sb-mail','antoine@test.fr');await D.p.fill('#sb-mdp','secret123');await D.p.click('#sb-in');
  ok(await att(D.p,()=>!!document.querySelector('#sb-code'))&&D.j.length>0&&!versTdb.length,'adresse corrigée : connexion réussie, aucune requête vers supabase.com');
  // ---- clé secrète collée par erreur : refusée, rien n'est chargé ni envoyé
  const E=await appareil(390,844,copie('secret',URL_SB,'sb_secret_abc123'));
  const sorties=[];E.p.on('request',q=>{if(/jsdelivr|supabase\.co/.test(q.url()))sorties.push(q.url())});
  await E.p.click('.tabs button[data-t=ami]');
  ok(await att(E.p,()=>/clé secrète/.test($('ami').innerText)&&!document.querySelector('#sb-f')),'clé secrète : message d\'alerte, pas de formulaire de connexion');
  await E.p.waitForTimeout(500);ok(!E.j.length&&!sorties.length,'clé secrète : ni bibliothèque chargée ni requête vers Supabase');
  const jwt=r=>'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({role:r})).toString('base64url')+'.sig';
  ok(await E.p.evaluate(([s,a])=>sbSecret(s)&&!sbSecret(a)&&!sbSecret('sb_publishable_x'),[jwt('service_role'),jwt('anon')]),'ancienne clé « service_role » refusée ; clés « anon » et « publishable » acceptées');
  // ---- lien de connexion par e-mail : appli servie à une adresse https simulée
  const SITE='https://royaume.test/',ctxL=await b.newContext({viewport:{width:390,height:844}});
  await ctxL.route(/^https?:/,r=>r.fulfill({status:404,body:''}));
  const L={p:await ctxL.newPage()},jl=[];L.p.errs=[];L.p.on('pageerror',e=>L.p.errs.push(e.message));
  await L.p.addInitScript(()=>{try{localStorage.setItem('qp.coach','1')}catch(e){}});   // try : about:blank n'a pas de localStorage
  await L.p.route(SITE+'**',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(F,'utf8')}));await brancher(L.p,db,URL_SB,jl);
  const ouvre=async u=>{await L.p.goto(u);await L.p.waitForTimeout(400);await L.p.evaluate(()=>{const s=$('splash');if(s)s.click()});await L.p.waitForTimeout(1700)};
  await ouvre(SITE);await L.p.click('.tabs button[data-t=ami]');
  ok(await att(L.p,()=>!!document.querySelector('#sb-otp')),'appli en ligne (https) : bouton « lien par e-mail » proposé');
  await L.p.fill('#sb-mail','lea@test.fr');await L.p.click('#sb-otp');
  ok(await att(L.p,()=>/Lien envoyé/.test($('ami').innerText))&&jl.includes('lien:lea@test.fr')&&(jl.lien||'').startsWith(SITE+'#'),'lien demandé : « Lien envoyé », il renvoie vers l\'adresse de l\'appli');
  await L.p.goto('about:blank');await ouvre(jl.lien);await L.p.click('.tabs button[data-t=ami]');
  ok(await att(L.p,()=>!!document.querySelector('#sb-pf'),null,15000),'lien ouvert : connectée, choix du pseudo');
  ok(await L.p.evaluate(()=>!/access_token/.test(location.href)),'le jeton est retiré de la barre d\'adresse');
  await L.p.fill('#sb-ps','Lea');await L.p.click('#sb-pf button');ok(await att(L.p,()=>!!document.querySelector('#sb-code')),'compte créé par le lien : profil et code ami');
  for(const [n,o] of [['Antoine',A],['Coline',B],['nouvel appareil',C],['adresse corrigée',D],['clé secrète',E],['lien par e-mail',L]])ok(o.p.errs.length===0,n+' : aucune erreur JavaScript '+(o.p.errs.length?JSON.stringify(o.p.errs.slice(0,2)):''));
  ok(await A.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390 px : pas de défilement horizontal');
  await b.close();for(const n of ['comptes','tableau','secret'])fs.unlinkSync(path.join(os.tmpdir(),'royaume-'+n+'.html'));
  console.log(ech?ech+' ÉCHEC(S)':'COMPTES : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
