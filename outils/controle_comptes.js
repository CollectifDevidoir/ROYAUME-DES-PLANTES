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
  ok(!A.j.length,'au démarrage sans session : aucune requête liée au compte');
  await A.p.waitForTimeout(3300);
  ok(A.j.visites===1&&(await db.query('select count(*)::int n, bool_or(compte) c from public.visites')).rows[0].n===1,'visite anonyme comptée une fois (appareil tiré au hasard, sans compte)');
  await lance(A.p,'mcq');await A.p.click('#opts button');await A.p.waitForTimeout(500);await A.p.click('#shn');await A.p.waitForTimeout(400);
  await A.p.click('#medal');ok(await att(A.p,()=>!!document.querySelector('#sb-f')),'profil (logo de rang) : formulaire de connexion');await T(A.p,'1-connexion');
  ok(await A.p.evaluate(()=>$('sb-tup').getAttribute('aria-selected')==='true'&&$('sb-go').textContent==='Créer mon compte'),'nouveau venu : onglet « Créer un compte » choisi, bouton « Créer mon compte »');
  await A.p.fill('#sb-mail','essai@test.fr');await A.p.click('#sb-tin');
  ok(await A.p.evaluate(()=>$('sb-go').textContent==='Se connecter'&&$('sb-mail').value==='essai@test.fr'&&$('sb-mdp').autocomplete==='current-password'),'« J\'ai déjà un compte » : bouton « Se connecter », l\'adresse tapée reste');
  await A.p.fill('#sb-mail','');
  // formulaire incomplet : rien n'est envoyé (sans e-mail, Supabase répondait « Anonymous sign-ins are disabled »)
  const n0=A.j.length;await A.p.click('#sb-tup');await A.p.click('#sb-go');ok(await att(A.p,()=>/Indique ton adresse e-mail/.test($('ami').innerText)),'« Créer un compte » sans e-mail : « Indique ton adresse e-mail »');
  await A.p.fill('#sb-mail','antoine@test');await A.p.click('#sb-tup');await A.p.click('#sb-go');ok(await att(A.p,()=>/Adresse e-mail invalide/.test($('ami').innerText)),'adresse incomplète : « Adresse e-mail invalide »');
  await A.p.fill('#sb-mail','antoine@test.fr');await A.p.fill('#sb-mdp','12345');await A.p.click('#sb-tup');await A.p.click('#sb-go');ok(await att(A.p,()=>/8 caractères/.test($('ami').innerText)),'mot de passe trop court : message clair');
  await A.p.fill('#sb-mdp','longmaissimple');await A.p.click('#sb-go');ok(await att(A.p,()=>/caractère spécial/.test($('ami').innerText)),'mot de passe sans caractère spécial : refusé à la création');
  ok(A.j.length===n0,'formulaire incomplet ou mot de passe faible : aucune requête envoyée à Supabase');
  await A.p.fill('#sb-mdp','mauvais');await A.p.click('#sb-tin');await A.p.click('#sb-go');
  ok(await att(A.p,()=>/incorrect/.test($('ami').innerText)),'mauvais identifiants : « E-mail ou mot de passe incorrect »');
  ok(await A.p.evaluate(()=>$('sb-mail').value==='antoine@test.fr'),'après une erreur, l\'adresse tapée reste dans la case');
  await A.p.fill('#sb-mail','antoine@test.fr');await A.p.fill('#sb-mdp','Secret-123');await A.p.click('#sb-tup');await A.p.click('#sb-go');
  ok(await att(A.p,()=>!!document.querySelector('#sb-pf')),'compte créé : choix du pseudo');await T(A.p,'2-pseudo');
  await A.p.fill('#sb-ps','Antoine');await A.p.click('#sb-pf button');
  ok(await att(A.p,()=>/RPL-[A-Z0-9]{5}/.test($('ami').innerText)),'profil créé avec un code ami');
  const codeA=await A.p.evaluate(()=>$('sb-code').textContent);
  ok(/Antoine/.test(await txt(A.p))&&/Prochain rang/.test(await txt(A.p))&&await A.p.evaluate(()=>document.querySelectorAll('#ami .rgs li').length===12),'profil : pseudo, rang et échelle des 12 rangs');
  ok(await A.p.evaluate(()=>{pro();return /1\s*\n?\s*jour de suite/.test($('pro').innerText)}),'Progrès : jours de suite (les chiffres ne sont plus répétés dans le profil)');
  ok(A.j.some(x=>x.includes('rpc/publier'))&&A.j.some(x=>x.includes('rpc/sauver_progression')),'chiffres et progression envoyés au compte');
  // ---- Coline : second appareil
  const B=await appareil();for(let i=0;i<2;i++){await lance(B.p,'mcq');await B.p.click('#opts button');await B.p.waitForTimeout(400);await B.p.click('#shn');await B.p.waitForTimeout(400)}
  await B.p.click('#medal');await att(B.p,()=>!!document.querySelector('#sb-f'));
  await B.p.fill('#sb-mail','coline@test.fr');await B.p.fill('#sb-mdp','Secret-456');await B.p.click('#sb-tup');await B.p.click('#sb-go');await att(B.p,()=>!!document.querySelector('#sb-pf'));
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
  await B.p.click('[data-per="s"]');ok(await att(B.p,()=>[...document.querySelectorAll('.tbm th')].some(x=>x.textContent==='Jours')&&document.querySelectorAll('.tbm tbody tr').length===2&&document.querySelector('[data-per="s"]').getAttribute('aria-selected')==='true'),'classement « Cette semaine » : mêmes amis, colonne des jours joués');await T(B.p,'3s-semaine');
  await B.p.click('[data-per="m"]');ok(await att(B.p,()=>document.querySelector('[data-per="m"]').getAttribute('aria-selected')==='true'&&document.querySelectorAll('.tbm tbody tr').length===2),'classement « Ce mois-ci »');
  await B.p.click('[data-per="j"]');ok(await att(B.p,()=>!/Jours/.test(document.querySelector('.tbm thead').textContent)),'retour à « Aujourd\'hui »');
  // ---- Antoine voit Coline après actualisation
  await A.p.click('#sb-maj');ok(await att(A.p,()=>/Coline/.test($('ami').innerText)),'Antoine voit Coline (amitié réciproque)');
  // ---- Coline change de pseudo : pseudo pris refusé, annuler ne change rien, puis nouveau pseudo visible par son ami
  await B.p.evaluate(()=>$('sb-pn').scrollIntoView({block:'center'}));await T(B.p,'3b-pseudo');await B.p.click('#sb-pe');await T(B.p,'3c-pseudo-modif');await B.p.fill('#sb-ps2','antoine');await B.p.click('#sb-pf2 button[type=submit]');
  ok(await att(B.p,()=>/déjà pris/.test($('ami').innerText)&&!!$('sb-ps2')),'changer de pseudo : pseudo déjà pris (casse ignorée) refusé, le champ reste ouvert');
  await B.p.click('#sb-pa');ok(await att(B.p,()=>$('sb-pn')&&$('sb-pn').textContent==='Coline'),'changer de pseudo : « Annuler » garde l\'ancien');
  await B.p.click('#sb-pe');await B.p.fill('#sb-ps2','x');await B.p.click('#sb-pf2 button[type=submit]');ok(await att(B.p,()=>/2 à 20/.test($('ami').innerText)),'changer de pseudo : trop court refusé');
  await B.p.fill('#sb-ps2','Coline_B');await B.p.click('#sb-pf2 button[type=submit]');
  ok(await att(B.p,()=>$('sb-pn')&&$('sb-pn').textContent==='Coline_B'&&document.querySelector('.tbm tr.moi td').innerText.trim()==='Coline_B'),'changer de pseudo : nouveau pseudo affiché dans le compte et le tableau');
  await A.p.click('#sb-maj');ok(await att(A.p,()=>/Coline_B/.test($('ami').innerText)),'l\'ami voit le nouveau pseudo, l\'amitié est gardée');
  await B.p.click('#sb-pe');await B.p.fill('#sb-ps2','Coline');await B.p.click('#sb-pf2 button[type=submit]');await att(B.p,()=>$('sb-pn')&&$('sb-pn').textContent==='Coline');await A.p.click('#sb-maj');await att(A.p,()=>/Coline\b/.test($('ami').innerText));
  // ---- Antoine sur un nouvel appareil : sa progression revient
  const kA=await A.p.evaluate(()=>Object.keys(st.sp).length);
  const C=await appareil(1440,900);await C.p.click('#medal');await att(C.p,()=>!!document.querySelector('#sb-f'));
  await C.p.fill('#sb-mail','antoine@test.fr');await C.p.fill('#sb-mdp','Secret-123');await C.p.click('#sb-tin');await C.p.click('#sb-go');
  ok(await att(C.p,()=>!!document.querySelector('#sb-code')),'connexion sur un nouvel appareil');
  ok(await C.p.evaluate(k=>Object.keys(st.sp).length===k&&(st.hist[today()]||{}).n===1,kA),'nouvel appareil : la progression du compte est reprise ('+kA+' plante(s), 1 exercice)');await T(C.p,'4-ordinateur');
  // la session est gardée : rechargement
  await C.p.reload();await C.p.waitForTimeout(600);await C.p.evaluate(()=>{const s=$('splash');if(s)s.click()});await C.p.waitForTimeout(1600);
  await C.p.click('#medal');ok(await att(C.p,()=>!!document.querySelector('#sb-code'),null,15000),'session gardée après rechargement');
  await C.p.waitForTimeout(3300);ok((await db.query('select bool_or(compte) c from public.visites')).rows[0].c===true,'visite comptée « avec compte » quand une session est enregistrée sur l\'appareil');
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
  await D.p.click('#medal');await att(D.p,()=>!!document.querySelector('#sb-f'));
  await D.p.fill('#sb-mail','antoine@test.fr');await D.p.fill('#sb-mdp','Secret-123');await D.p.click('#sb-tin');await D.p.click('#sb-go');
  ok(await att(D.p,()=>!!document.querySelector('#sb-code'))&&D.j.length>0&&!versTdb.length,'adresse corrigée : connexion réussie, aucune requête vers supabase.com');
  // ---- clé secrète collée par erreur : refusée, rien n'est chargé ni envoyé
  const E=await appareil(390,844,copie('secret',URL_SB,'sb_secret_abc123'));
  const sorties=[];E.p.on('request',q=>{if(/jsdelivr|supabase\.co/.test(q.url()))sorties.push(q.url())});
  await E.p.click('#medal');
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
  await ouvre(SITE);await L.p.click('#medal');
  ok(await att(L.p,()=>!!document.querySelector('#sb-otp')),'appli en ligne (https) : bouton « lien par e-mail » proposé');
  await L.p.fill('#sb-mail','lea@test.fr');await L.p.click('#sb-tin');ok(await L.p.isVisible('#sb-otp'),'« J\'ai déjà un compte » : lien « Mot de passe oublié ? » visible');await L.p.click('#sb-otp');
  ok(await att(L.p,()=>/Lien envoyé/.test($('ami').innerText))&&jl.includes('lien:lea@test.fr')&&(jl.lien||'').startsWith(SITE+'#'),'lien demandé : « Lien envoyé », il renvoie vers l\'adresse de l\'appli');
  await L.p.goto('about:blank');await ouvre(jl.lien);
  ok(await att(L.p,()=>$('prf').open&&!!document.querySelector('#sb-pf'),null,15000),'lien ouvert : connectée, le profil s\'ouvre seul sur le choix du pseudo');
  ok(await L.p.evaluate(()=>!/access_token/.test(location.href)),'le jeton est retiré de la barre d\'adresse');
  await L.p.fill('#sb-ps','Lea');await L.p.click('#sb-pf button');ok(await att(L.p,()=>!!document.querySelector('#sb-code')),'compte créé par le lien : profil et code ami');
  // e-mail de confirmation d'un nouveau compte : il doit ramener à l'adresse de l'appli (sinon : page 404)
  await L.p.click('#sb-out');await att(L.p,()=>!!document.querySelector('#sb-f'));
  await L.p.fill('#sb-mail','zoe@test.fr');await L.p.fill('#sb-mdp','Secret-789');await L.p.click('#sb-tup');await L.p.click('#sb-go');await att(L.p,()=>!!document.querySelector('#sb-pf'));
  ok(jl.some(x=>x.startsWith('/auth/v1/signup')&&new URLSearchParams(x.split('?')[1]).get('redirect_to')===SITE),'création de compte : le lien de confirmation ramène à l\'adresse de l\'appli');
  // ---- même compte sur deux appareils : chacun apprend de son côté, rien n'est écrasé ; un 3e appareil retrouve tout
  const cnx=async(o,m,mdp,ps)=>{await o.p.click('#medal');await att(o.p,()=>!!document.querySelector('#sb-f'));await o.p.fill('#sb-mail',m);await o.p.fill('#sb-mdp',mdp);
    await o.p.click(ps?'#sb-tup':'#sb-tin');await o.p.click('#sb-go');if(ps){await att(o.p,()=>!!document.querySelector('#sb-pf'));await o.p.fill('#sb-ps',ps);await o.p.click('#sb-pf button')}
    return att(o.p,()=>!!document.querySelector('#sb-code'),null,15000)};
  const P1=await appareil(),P2=await appareil();
  // P1 a commencé sans compte : 3 plantes acquises, puis il crée son compte
  const sp=await P1.p.evaluate(()=>{const n=[S[0][0],S[1][0],S[2][0],S[3][0],S[4][0]];n.slice(0,3).forEach(k=>st.sp[k]={b:4,s:6,e:0,d:0});save();return n});
  ok(await cnx(P1,'multi@test.fr','Secret-999','Multi'),'progression locale puis création de compte : profil prêt');
  ok(await P1.p.evaluate(n=>n.slice(0,3).every(k=>st.sp[k]&&st.sp[k].b===4),sp),'création du compte : les 3 espèces acquises avant le compte sont gardées');
  ok(await cnx(P2,'multi@test.fr','Secret-999'),'même compte sur un 2e appareil');
  ok(await P2.p.evaluate(n=>n.slice(0,3).every(k=>st.sp[k]&&st.sp[k].b===4),sp),'2e appareil : il retrouve les 3 espèces');
  await P1.p.evaluate(async n=>{st.sp[n[3]]={b:4,s:5,e:0,d:0};save();await sbEnvoi()},sp);
  await P2.p.evaluate(async n=>{st.sp[n[4]]={b:4,s:5,e:0,d:0};save();await sbEnvoi()},sp);   // P2 n'avait pas vu la 4e : elle ne doit pas disparaître du compte
  const P3=await appareil(1440,900);ok(await cnx(P3,'multi@test.fr','Secret-999'),'même compte sur un 3e appareil');
  ok(await P3.p.evaluate(n=>n.every(k=>st.sp[k]&&st.sp[k].b===4),sp),'3e appareil : les 5 espèces apprises sur les deux autres sont toutes là (aucun écrasement)');
  ok(await P2.p.evaluate(n=>!!st.sp[n[3]],sp),'2e appareil : il a récupéré l\'espèce apprise sur le 1er au moment d\'enregistrer');
  // Réinitialiser en étant connecté : le message le dit, et le compte est vidé aussi (sinon la fusion ferait tout revenir)
  await P2.p.evaluate(()=>{$('prf').close();openSettings()});await P2.p.click('#set-reset');
  ok(/dans ton compte/.test(await P2.p.textContent('#set')),'Réinitialiser (connecté) : le message précise que le compte est aussi vidé');
  await P2.p.click('#set-yes');await P2.p.evaluate(()=>sbEnvoi());
  ok(await P2.p.evaluate(async()=>{const d=await sbRpc('lire_progression');return Object.keys(st.sp).length===0&&d&&Object.keys(d.sp||{}).length===0}),'Réinitialiser (connecté) : appareil et compte vides, rien ne revient');
  // déconnexion : seulement cet appareil
  await P2.p.evaluate(()=>{$('set').close();openProfil()});await att(P2.p,()=>!!document.querySelector('#sb-out'));
  await P2.p.click('#sb-out');ok(await att(P2.p,()=>!!document.querySelector('#sb-f')),'déconnexion du 2e appareil : formulaire');
  ok(P2.j.some(x=>/\/auth\/v1\/logout\?scope=local/.test(x)),'déconnexion : seulement sur cet appareil (les autres restent connectés)');
  // suppression : message clair, plus rien de connecté
  P3.p.once('dialog',d=>d.accept());await P3.p.click('#sb-del');
  ok(await att(P3.p,()=>/Compte supprimé/.test($('ami').innerText)&&!!document.querySelector('#sb-f')&&!sbU&&!sbP),'suppression : « Compte supprimé », formulaire, état remis à zéro');
  for(const [n,o] of [['Antoine',A],['Coline',B],['nouvel appareil',C],['adresse corrigée',D],['clé secrète',E],['lien par e-mail',L],['appareil 1',P1],['appareil 2',P2],['appareil 3',P3]])ok(o.p.errs.length===0,n+' : aucune erreur JavaScript '+(o.p.errs.length?JSON.stringify(o.p.errs.slice(0,2)):''));
  ok(await A.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390 px : pas de défilement horizontal');
  await b.close();for(const n of ['comptes','tableau','secret'])fs.unlinkSync(path.join(os.tmpdir(),'royaume-'+n+'.html'));
  console.log(ech?ech+' ÉCHEC(S)':'COMPTES : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
