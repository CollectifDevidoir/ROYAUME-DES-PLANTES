// « Mot de passe oublié » de bout en bout, sans réseau : la vraie bibliothèque supabase-js parle au faux Supabase
// (outils/controles/supabase/faux_supabase.js : /auth/v1/recover et mise à jour du mot de passe), l'appli est servie à une adresse https simulée.
// Couvre : demande de lien (resetPasswordForEmail, adresse de retour autorisée), réponse identique que le compte existe ou non,
// écran « Nouveau mot de passe » avec confirmation, règle de 8 caractères + un spécial (même règle que la création de compte),
// updateUser, ancien mot de passe refusé / nouveau accepté, lien expiré ou déjà utilisé, pas de bouton hors adresse web, aucune connexion par simple lien :
// quitter l'écran sans finir (Plus tard, fermeture, Échap, rechargement) déconnecte.
// Ce que ce test ne prouve PAS : l'envoi réel de l'e-mail, le modèle e-mail et la liste d'adresses autorisées de Supabase
// (à vérifier à la main : voir supabase/LISEZ-MOI.md, « Mot de passe oublié »).
// Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_mdp_oublie.js [index.html]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const SRC=process.argv[2]||path.resolve(__dirname,'..','..','index.html'),URL_SB='https://demo.supabase.co',SITE='https://royaume.test/';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const html=fs.readFileSync(SRC,'utf8'),LIGNE=/const SB_URL='([^']*)',SB_KEY='([^']*)';/;
  const F=path.join(os.tmpdir(),'royaume-mdp.html');fs.writeFileSync(F,html.replace(LIGNE,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const att=async(p,f,arg,ms=8000)=>{try{await p.waitForFunction(f,arg,{timeout:ms});return true}catch(e){return false}};
  const MAIL='lea@test.fr',ANCIEN='Ancien-123',NOUVEAU='Nouveau-456';
  await db.query('insert into auth.users(id,email,mdp) values(gen_random_uuid(),$1,$2)',[MAIL,ANCIEN]);
  const mdpBase=async()=>(await db.query('select mdp from auth.users where email=$1',[MAIL])).rows[0].mdp;

  // ---- appareil en ligne (https simulé)
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  await ctx.route(/^https?:/,r=>r.fulfill({status:404,body:''}));
  const p=await ctx.newPage(),j=[];p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('qp.coach','1')}catch(e){}});
  await p.route(SITE+'**',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(F,'utf8')}));await brancher(p,db,URL_SB,j);
  const ouvre=async u=>{await p.goto(u);await p.waitForTimeout(400);await p.evaluate(()=>{const s=$('splash');if(s)s.click()});await p.waitForTimeout(1700)};
  const cnx=async(m,mdp)=>{await p.fill('#sb-mail',m);await p.fill('#sb-mdp',mdp);await p.click('#sb-tin');await p.click('#sb-go')};
  await ouvre(SITE);await p.click('#medal');await att(p,()=>!!document.querySelector('#sb-f'));
  // connexion normale, choix du pseudo, puis déconnexion : le compte « Lea » existe avec son profil
  await cnx(MAIL,ANCIEN);ok(await att(p,()=>!!document.querySelector('#sb-pf')),'compte existant : connexion avec l\'ancien mot de passe');
  await p.fill('#sb-ps','Lea');await p.click('#sb-pf button');await att(p,()=>!!document.querySelector('#sb-code'));
  const code0=await p.textContent('#sb-code');
  await p.click('#sb-out');await att(p,()=>!!document.querySelector('#sb-f'));

  // ---- formulaire : règle de mot de passe alignée, bouton « mot de passe oublié » distinct du lien de connexion
  await p.click('#sb-tin');
  ok(await p.evaluate(()=>$('sb-mdp').minLength===8&&/8 caractères/.test($('sb-mh').textContent)),'règle du mot de passe : attribut minlength = 8, comme le texte affiché (8 caractères au moins, dont un spécial)');
  ok(await p.isVisible('#sb-rec')&&(await p.textContent('#sb-rec')).includes('Mot de passe oublié')&&await p.evaluate(()=>!document.querySelector('#sb-otp')&&!/sans mot de passe|lien de connexion/i.test($('ami').innerText)),
    '« J\'ai déjà un compte » : « Mot de passe oublié ? » est le seul lien par e-mail ; plus de connexion par simple lien');
  await p.click('#sb-tup');ok(!(await p.isVisible('#sb-rec')),'« Créer un compte » : pas de « mot de passe oublié »');
  await p.click('#sb-tin');

  // ---- demande de lien
  const n0=j.length;await p.fill('#sb-mail','');await p.click('#sb-rec');
  ok(await att(p,()=>/Indique ton adresse e-mail/.test($('ami').innerText))&&j.length===n0,'sans adresse : message clair, aucune requête');
  await p.fill('#sb-mail',MAIL);await p.click('#sb-rec');
  ok(await att(p,()=>/Si un compte existe/.test($('ami').innerText)),'adresse indiquée : « Si un compte existe… un e-mail vient de partir »');
  const rec=j.find(x=>x.startsWith('/auth/v1/recover'));
  ok(!!rec&&j.includes('recover:'+MAIL)&&new URLSearchParams(rec.split('?')[1]).get('redirect_to')===SITE,'resetPasswordForEmail : requête /recover avec l\'adresse de l\'appli comme retour (celle à autoriser dans Supabase)');
  ok(!j.some(x=>x.startsWith('/auth/v1/otp')),'aucune demande de lien de connexion (otp) n\'est jamais envoyée');
  const lienA=j.recup;ok(/#access_token=.*type=recovery/.test(lienA||''),'lien reçu (simulé) : retour de type « recovery » vers l\'appli');
  // adresse inconnue : même réponse, aucun lien
  j.recup=null;const msgA=await p.evaluate(()=>document.querySelector('#ami .stm.ok').textContent);
  await p.fill('#sb-mail','inconnue@test.fr');await p.click('#sb-rec');await att(p,()=>/inconnue@/.test($('sb-mail').value)&&/Si un compte existe/.test($('ami').innerText));
  ok(j.includes('recover:inconnue@test.fr')&&!j.recup&&await p.evaluate(m=>document.querySelector('#ami .stm.ok').textContent===m,msgA),'adresse inconnue : exactement la même réponse affichée (on ne révèle pas si un compte existe)');

  // ---- ouverture du lien : écran « Nouveau mot de passe », pas le reste du profil
  await p.goto('about:blank');await ouvre(lienA);
  ok(await att(p,()=>$('prf').open&&!!document.querySelector('#sb-rf'),null,15000),'lien ouvert : le profil s\'ouvre seul sur « Nouveau mot de passe »');
  ok(await p.evaluate(()=>/Nouveau mot de passe/.test($('ami').innerText)&&!document.querySelector('#sb-f,#sb-pf,#sb-code')&&!!$('sb-np')&&!!$('sb-np2')&&$('sb-np').minLength===8&&$('sb-np2').type==='password'),
    'l\'écran propose le nouveau mot de passe et sa confirmation (champs masqués, minlength 8) ; ni connexion ni code ami à ce stade');
  ok(await p.evaluate(()=>!/access_token|type=recovery/.test(location.href)),'le jeton est retiré de la barre d\'adresse');
  // validations côté appli : rien n'est envoyé
  const nPut=()=>j.filter(x=>x.startsWith('mdp-change')).length;
  await p.fill('#sb-np','court');await p.fill('#sb-np2','court');await p.click('#sb-rgo');
  ok(await att(p,()=>/8 caractères au moins, dont un caractère spécial/.test($('ami').innerText)&&!!document.querySelector('#sb-rf')),'mot de passe trop court : refusé, on reste sur l\'écran');
  await p.fill('#sb-np','longmaissimple');await p.fill('#sb-np2','longmaissimple');await p.click('#sb-rgo');
  ok(await att(p,()=>/caractère spécial/.test($('ami').innerText)),'sans caractère spécial : refusé (même règle qu\'à la création du compte)');
  await p.fill('#sb-np',NOUVEAU);await p.fill('#sb-np2',NOUVEAU+'x');await p.click('#sb-rgo');
  ok(await att(p,()=>/pas identiques/.test($('ami').innerText)),'confirmation différente : « Les deux mots de passe ne sont pas identiques »');
  ok(nPut()===0&&await mdpBase()===ANCIEN,'aucune de ces erreurs n\'a modifié le mot de passe (aucun appel updateUser)');
  // refus du serveur : même mot de passe qu'avant
  await p.fill('#sb-np',ANCIEN);await p.fill('#sb-np2',ANCIEN);await p.click('#sb-rgo');
  ok(await att(p,()=>/déjà le tien/.test($('ami').innerText)&&!!document.querySelector('#sb-rf')),'même mot de passe qu\'avant (refus du serveur) : message clair, on reste sur l\'écran');
  // succès
  await p.fill('#sb-np',NOUVEAU);await p.fill('#sb-np2',NOUVEAU);await p.click('#sb-rgo');
  ok(await att(p,()=>/Mot de passe changé/.test($('ami').innerText)&&!document.querySelector('#sb-rf')&&!!document.querySelector('#sb-code')),'bon mot de passe : « Mot de passe changé », écran refermé, profil et code ami retrouvés');
  ok(await mdpBase()===NOUVEAU&&nPut()===1&&await p.textContent('#sb-code')===code0,'le mot de passe du compte est bien le nouveau (1 seul appel updateUser) ; même compte, même code ami');
  // rechargement : on ne retombe pas sur l'écran « Nouveau mot de passe »
  await ouvre(SITE);await p.click('#medal');
  ok(await att(p,()=>!!document.querySelector('#sb-code'))&&await p.evaluate(()=>!document.querySelector('#sb-rf')),'après rechargement : connecté, plus d\'écran « Nouveau mot de passe »');

  // ---- l'ancien mot de passe ne marche plus, le nouveau oui
  await p.click('#sb-out');await att(p,()=>!!document.querySelector('#sb-f'));
  await cnx(MAIL,ANCIEN);ok(await att(p,()=>/E-mail ou mot de passe incorrect/.test($('ami').innerText)),'ancien mot de passe : refusé');
  await cnx(MAIL,NOUVEAU);ok(await att(p,()=>!!document.querySelector('#sb-code')),'nouveau mot de passe : connexion réussie');
  await p.click('#sb-out');await att(p,()=>!!document.querySelector('#sb-f'));

  // ---- lien expiré ou déjà utilisé (retour d'erreur de Supabase)
  await p.goto('about:blank');await ouvre(SITE+'#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
  ok(await att(p,()=>$('prf').open&&/a expiré ou a déjà servi/.test($('ami').innerText)&&!!document.querySelector('#sb-rec')&&!document.querySelector('#sb-rf')),'lien expiré / déjà utilisé : message clair, pas d\'écran de mot de passe, « Mot de passe oublié ? » proposé pour en redemander un');
  ok(await p.evaluate(()=>!/error/.test(location.href)),'l\'erreur est retirée de la barre d\'adresse');

  // ---- quitter l'écran sans changer le mot de passe ne doit JAMAIS laisser connecté (le lien n'est pas un moyen de connexion)
  const ouvreLien=async()=>{await p.evaluate(()=>{if(!$('prf').open)openProfil()});await att(p,()=>!!document.querySelector('#sb-mail'));await p.fill('#sb-mail',MAIL);await p.click('#sb-rec');await att(p,()=>/Si un compte existe/.test($('ami').innerText));
    await p.goto('about:blank');await ouvre(j.recup);return att(p,()=>!!document.querySelector('#sb-rf'),null,15000)};
  const dehors=()=>att(p,()=>!document.querySelector('#sb-rf')&&!!document.querySelector('#sb-f')&&!sbU);
  const nPut2=nPut();
  await ouvreLien();await p.click('#sb-rx');
  ok(await dehors()&&nPut()===nPut2&&await mdpBase()===NOUVEAU,'« Plus tard » : déconnecté, formulaire de connexion, mot de passe inchangé');
  ok(await p.evaluate(()=>!localStorage.getItem('qp.sbrec')),'« Plus tard » : la marque de changement en cours est effacée');
  await ouvreLien();await p.click('#prf-x');
  ok(await att(p,()=>!sbU&&!sbRec)&&await p.evaluate(()=>!localStorage.getItem('qp.sb')||!JSON.parse(localStorage.getItem('qp.sb')||'null')),'fermer le volet sans finir : déconnecté, plus de session enregistrée');
  await p.click('#medal');ok(await att(p,()=>!!document.querySelector('#sb-f')&&!document.querySelector('#sb-rf')),'on rouvre le profil : formulaire de connexion, pas connecté');
  await ouvreLien();await p.keyboard.press('Escape');
  ok(await att(p,()=>!sbU&&!sbRec),'Échap sans finir : déconnecté');
  await ouvreLien();await ouvre(SITE);
  ok(await att(p,()=>$('prf').open&&/n\'a pas été terminé/.test($('ami').innerText)&&!!document.querySelector('#sb-f')&&!sbU),'rechargement en cours de route : déconnecté, avec une explication');
  await p.click('#prf-x');
  await ouvreLien();await p.fill('#sb-np',NOUVEAU+'z!');await p.fill('#sb-np2',NOUVEAU+'z!');await p.click('#sb-rgo');
  ok(await att(p,()=>/Mot de passe changé/.test($('ami').innerText)&&!!sbU)&&await p.evaluate(()=>!localStorage.getItem('qp.sbrec')),'changement terminé : connecté, marque effacée');
  await db.query('update auth.users set mdp=$1 where email=$2',[NOUVEAU,MAIL]);
  await p.click('#prf-x');ok(await p.evaluate(()=>!!sbU),'après un changement terminé, fermer le volet ne déconnecte pas');
  await p.click('#medal');await att(p,()=>!!document.querySelector('#sb-out'));await p.click('#sb-out');await att(p,()=>!!document.querySelector('#sb-f'));

  // ---- session perdue pendant la saisie : message clair, retour à la connexion
  await ouvreLien();
  await db.query('delete from auth.users where email=$1',[MAIL]);   // le serveur ne reconnaît plus la session (lien périmé entre-temps)
  await p.fill('#sb-np','Troisieme-789!');await p.fill('#sb-np2','Troisieme-789!');await p.click('#sb-rgo');
  ok(await att(p,()=>/a expiré ou a déjà servi|Redemande/.test($('ami').innerText)&&!document.querySelector('#sb-rf')),'session périmée pendant la saisie : message clair, plus d\'écran de mot de passe');

  // ---- appli ouverte comme un fichier (pas d'adresse web) : le lien ne pourrait pas revenir, le bouton n'est pas proposé
  const L=await open({browser:b,w:390,h:844,touch:true,seed:true,file:F,http:false});await brancher(L.p,db,URL_SB,[]);
  await L.p.click('#medal');await att(L.p,()=>!!document.querySelector('#sb-f'));await L.p.click('#sb-tin');
  ok(await L.p.evaluate(()=>!document.querySelector('#sb-rec')),'appli ouverte comme un fichier : pas de bouton « mot de passe oublié » (il exige une adresse web)');
  ok(p.errs.length===0&&L.p.errs.length===0,'aucune erreur JavaScript '+(p.errs.concat(L.p.errs)[0]||''));
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'390 px : pas de défilement horizontal');
  await b.close();fs.unlinkSync(F);
  console.log(ech?ech+' ÉCHEC(S)':'MOT DE PASSE OUBLIÉ : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
