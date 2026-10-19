// Défi du jour et compte, sans réseau (faux Supabase adossé à PGlite, comme controle_comptes.js) :
// - les réponses au défi ne comptent pas dans le classement d'Assiduité (jour, et jours passés renvoyés au compte) ;
// - défi terminé sur ordinateur → téléphone connecté au même compte : pas de seconde partie, résultat de la première ;
// - même quand la progression sauvegardée sur le compte ne contient pas le défi (seul le résultat publié fait foi),
//   et même si l'on touche « Défi du jour » dès l'ouverture, avant la fin de la connexion.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_defi_compte.js
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const {base,brancher}=require('./supabase/faux_supabase.js');
const URL_SB='https://demo.supabase.co';
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8'),LIGNE=/const SB_URL='([^']*)',SB_KEY='([^']*)';/;
  const F=path.join(os.tmpdir(),'royaume-defi-compte.html');fs.writeFileSync(F,html.replace(LIGNE,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  const db=await base(),b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const appareil=async(w,h)=>{const o=await open({browser:b,w,h,touch:w<900,seed:true,file:F,http:true});const j=[];await brancher(o.p,db,URL_SB,j);o.j=j;return o};
  const att=async(p,f,arg,ms=10000)=>{try{await p.waitForFunction(f,arg,{timeout:ms});return true}catch(e){return false}};
  const connexion=async(p,creer)=>{await p.click('#medal');await att(p,()=>!!document.querySelector('#sb-f'));
    await p.fill('#sb-mail','antoine@test.fr');await p.fill('#sb-mdp','Secret-123');await p.click(creer?'#sb-tup':'#sb-tin');await p.click('#sb-go');
    if(creer){await att(p,()=>!!document.querySelector('#sb-pf'));await p.fill('#sb-ps','Antoine');await p.click('#sb-pf button')}
    return att(p,()=>!!document.querySelector('#sb-code'),null,15000)};
  const fermer=p=>p.evaluate(()=>{const d=$('prf');if(d.close)d.close();else d.removeAttribute('open')});
  const jours=async()=>(await db.query('select jour::text j, exercices, justes from public.jours order by jour')).rows;

  // ---- Ordinateur : 2 exercices ordinaires, compte créé, puis le défi en entier
  const A=await appareil(1440,900);
  for(let i=0;i<2;i++){await lance(A.p,'mcq');await A.p.click('#opts button');await A.p.waitForTimeout(400);await A.p.click('#shn');await A.p.waitForTimeout(300)}
  ok(await connexion(A.p,true),'ordinateur : compte créé');await fermer(A.p);
  await A.p.click('#defi');await att(A.p,()=>dfOn&&!!document.querySelector('#df-o button'));
  await A.p.evaluate(()=>{for(let i=0;i<10;i++){dfRepond(i%2?0:dfSerie(dfJour())[i].bonne);if(i<9)dfQuestion()}});
  await att(A.p,()=>dfFait()&&dfEtat().pub===1);await A.p.evaluate(()=>dfResultat());
  const hA=await A.p.evaluate(()=>({h:st.hist[today()],b:monBilan(),s:dfScore(dfEtat())}));
  ok(hA.h.n===12&&hA.h.dn===10&&hA.b.ex===2,'ordinateur : objectif du jour 12 réponses (2 exercices + 10 du défi), Assiduité 2 exercices '+JSON.stringify(hA.h));
  await A.p.evaluate(()=>sbEnvoi());
  let J=await jours();ok(J.length===1&&J[0].exercices===2&&J[0].justes===hA.h.ok-hA.h.dok,'classement d\'Assiduité du jour (serveur) : 2 exercices, le défi n\'y est pas '+JSON.stringify(J));
  const cl=await A.p.evaluate(async()=>{sbVue='a';sbPer='j';sbTab=null;const c=await sbCl();const d=document.createElement('div');d.innerHTML=c.h;return d.querySelector('.tbl li.moi .tbs b').textContent});
  ok(cl==='2','profil, Assiduité « Aujourd\'hui » : 2 exercices affichés');
  // jours passés : un jour avec 5 exercices dont 3 du défi, un jour avec seulement le défi
  await A.p.evaluate(()=>{st.hist[dstr(Date.now()-864e5)]={n:5,ok:4,dn:3,dok:3};st.hist[dstr(Date.now()-2*864e5)]={n:10,ok:7,dn:10,dok:7};save();sbJk=''});await A.p.evaluate(()=>sbEnvoi());
  J=await jours();const hier=J.find(x=>x.j===(new Date(Date.now()-864e5)).toISOString().slice(0,10))||J[J.length-2];
  ok(J.length===2&&hier&&hier.exercices===2&&hier.justes===1,'jours passés : seuls les exercices ordinaires sont renvoyés ; un jour de défi seul ne compte pas comme jour joué '+JSON.stringify(J));
  const sem=await A.p.evaluate(async()=>{const r=await sbRpc('tableau_periode',{p_debut:dstr(Date.now()-3*864e5),p_fin:today()});return r.find(x=>x.moi)});
  ok(sem.exercices===4&&sem.jours===2,'Assiduité sur une période : 4 exercices sur 2 jours joués '+JSON.stringify(sem));
  const resA=await A.p.evaluate(()=>dfEtat().r.join(''));

  // ---- Téléphone, même compte : le défi n'est plus proposé, le résultat de l'ordinateur s'affiche
  const P=await appareil(390,844);
  ok(await P.p.evaluate(()=>!dfFait()&&!!$('defi').querySelector('.nd')),'téléphone avant connexion : défi pas encore joué sur cet appareil');
  ok(await connexion(P.p,false),'téléphone : connexion au même compte');await fermer(P.p);
  ok(await att(P.p,()=>dfFait()&&!$('defi').querySelector('.nd')&&/\d+\/10/.test($('defi').textContent)),'téléphone : le bouton affiche le score de l\'ordinateur, plus de pastille');
  await P.p.click('#defi');
  ok(await att(P.p,()=>dfOn&&!!document.querySelector('#dfr .dfs')&&!document.querySelector('#df-o')),'téléphone : « Défi du jour » ouvre le résultat, pas de nouvelle question');
  ok(await P.p.evaluate(r=>dfEtat().r.join('')===r&&document.querySelector('#dfr .dfs b').textContent==String(dfScore(dfEtat())),resA),'téléphone : mêmes réponses et même score que sur l\'ordinateur');
  ok(await P.p.evaluate(()=>{const n=dfEtat().r.length;dfRepond(0);return dfEtat().r.length===n}),'téléphone : aucune réponse supplémentaire acceptée');

  // ---- Progression du compte sans le défi (sauvegarde pas encore faite) : le résultat publié fait foi
  await db.query("update public.progressions set donnees = donnees - 'df'");
  const T=await appareil(390,844);ok(await connexion(T.p,false),'2e téléphone : connexion (progression du compte sans le défi)');await fermer(T.p);
  ok(await att(T.p,r=>dfFait()&&dfEtat().r.join('')===r,resA),'2e téléphone : défi reconnu comme joué d\'après le résultat enregistré sur le compte');
  // ouverture de l'appli, session gardée, appareil sans trace du défi : appui immédiat sur « Défi du jour »
  await T.p.evaluate(()=>{delete st.df;localStorage.setItem(K,JSON.stringify(st))});
  await db.query("update public.progressions set donnees = donnees - 'df'");
  await T.p.reload();await T.p.evaluate(()=>{const s=$('splash');if(s)s.click()});
  await T.p.evaluate(()=>{if(!dfFait())dfLancer()});
  ok(await att(T.p,()=>dfOn&&!!document.querySelector('#dfr .dfs')),'2e téléphone, appui dès l\'ouverture : on attend la connexion, puis le résultat s\'affiche');
  ok(await T.p.evaluate(()=>!document.querySelector('#df-o')),'… sans jamais montrer une question du défi');
  const n=(await db.query('select count(*)::int n from public.defis')).rows[0].n;ok(n===1,'un seul résultat de défi enregistré pour le compte');

  // ---- Hors compte : le défi reste jouable normalement
  const H=await appareil(390,844);await H.p.click('#defi');ok(await att(H.p,()=>dfOn&&!!document.querySelector('#df-o button')),'sans compte : le défi se lance normalement');
  for(const [m,o] of [['ordinateur',A],['téléphone',P],['2e téléphone',T],['sans compte',H]])ok(o.p.errs.length===0,m+' : aucune erreur JavaScript '+(o.p.errs.length?JSON.stringify(o.p.errs.slice(0,2)):''));
  await b.close();fs.unlinkSync(F);
  console.log(ech?ech+' ÉCHEC(S)':'DÉFI ET COMPTE : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
