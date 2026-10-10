// Comptes (Supabase) : vérifie supabase/schema.sql sur une vraie base PostgreSQL (PGlite, sans réseau).
// Parcours complet et sécurité : tables inaccessibles en direct, un inconnu ne voit rien,
// on ne voit que ses amis, on ne modifie que ses données, limite d'essais de codes ami.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_supabase_sql.js
const {base,comme}=require('./supabase/faux_supabase.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const refus=async(p,m,motif)=>{try{await p;ok(false,m+' (accepté à tort)')}catch(e){ok(!motif||e.message.includes(motif),m+' : refusé ('+e.message.split('\n')[0]+')')}};
(async()=>{
  const db=await base();ok(true,'schéma chargé sans erreur');
  // le schéma doit pouvoir être relancé
  await db.exec(require('fs').readFileSync(require('path').resolve(__dirname,'..','supabase','schema.sql'),'utf8'));ok(true,'schéma relancé sans erreur');
  const U={};for(const n of ['antoine','coline','paul','intrus']){U[n]=require('crypto').randomUUID();await db.query('insert into auth.users(id,email) values($1,$2)',[U[n],n+'@test.fr'])}
  const f=async(qui,sql,p)=>(await comme(db,U[qui],sql,p)).rows[0];
  const r=async(qui,sql,p)=>(await f(qui,sql,p)).r;
  // profils
  ok(await r('antoine','select mon_profil() r')===null,'avant pseudo : pas de profil');
  const pa=await r('antoine',"select choisir_pseudo('Antoine') r");ok(/^RPL-[A-HJKMNP-Z2-9]{5}$/.test(pa.code_ami),'pseudo choisi, code ami '+pa.code_ami);
  const pc=await r('coline',"select choisir_pseudo('Coline') r"),pp=await r('paul',"select choisir_pseudo('Paul') r");
  await refus(comme(db,U.intrus,"select choisir_pseudo('antoine') r"),'pseudo déjà pris (casse ignorée)','PSEUDO_PRIS');
  await refus(comme(db,U.intrus,"select choisir_pseudo('<script>') r"),'pseudo invalide','PSEUDO_INVALIDE');
  ok((await r('antoine',"select choisir_pseudo('Antoine_R') r")).code_ami===pa.code_ami,'changer de pseudo garde le code ami');
  await refus(comme(db,null,'select mon_profil() r'),'visiteur non connecté','permission denied');
  // publication
  await f('antoine','select publier(current_date,38,31,4,6,127,68,8)');await f('coline','select publier(current_date,31,24,3,5,90,79,3)');await f('paul','select publier(current_date,27,19,2,4,60,71,1)');
  await refus(comme(db,U.antoine,"select publier(current_date - 5,10,5,1,1,1,1,1)"),'jour trop ancien','JOUR_INVALIDE');
  await f('antoine','select publier(current_date,10,99,0,6,127,68,8)');
  ok((await r('antoine','select tableau(current_date) r'))[0].justes===10,'justes plafonnés au nombre d\'exercices');
  await f('antoine','select publier(current_date,38,31,4,6,127,68,8)');
  // amis
  ok((await r('antoine','select tableau(current_date) r')).length===1,'sans ami : le tableau ne montre que moi');
  ok((await r('antoine',`select ajouter_ami('${pc.code_ami.toLowerCase().replace('-','')}') r`)).pseudo==='Coline','ajout de Coline avec son code (minuscules, sans tiret)');
  await f('paul',`select ajouter_ami('${pa.code_ami}')`);
  const t=await r('antoine','select tableau(current_date) r');
  ok(t.length===3&&t.map(x=>x.pseudo).join()==='Antoine_R,Coline,Paul','tableau d\'Antoine : moi, Coline et Paul, du plus actif au moins actif');
  ok(t[0].moi===true&&t[1].moi===false&&t[0].exercices===38&&t[1].nouvelles===3,'chiffres du jour et ligne « moi »');
  ok((await r('coline','select tableau(current_date) r')).map(x=>x.pseudo).join()==='Antoine_R,Coline','Coline voit Antoine (amitié réciproque) mais pas Paul');
  ok((await r('intrus','select tableau(current_date) r')).length===0,'sans profil : tableau vide');
  ok((await r('coline',`select ajouter_ami('${pc.code_ami}') r`)).erreur==='SOI_MEME','s\'ajouter soi-même : refusé');
  ok((await r('coline',"select ajouter_ami('RPL-ZZZZZ') r")).erreur==='CODE_INCONNU','code inconnu : refusé');
  // périodes : rattrapage des jours passés et totaux de la semaine
  await f('paul','select publier_jours($1::jsonb)',[JSON.stringify([{j:'2001-01-01',n:99,ok:99},{j:new Date(Date.now()-2*864e5).toISOString().slice(0,10),n:12,ok:9},{j:new Date(Date.now()-864e5).toISOString().slice(0,10),n:5,ok:50,na:2}])]);
  const tp=await r('paul','select tableau_periode(current_date - 6, current_date) r');
  const mp=tp.find(x=>x.moi);ok(mp.exercices===27+12+5&&mp.justes===19+9+5&&mp.nouvelles===2+2&&mp.jours===3,'semaine de Paul : 3 jours joués, totaux additionnés, justes plafonnés, jour trop ancien ignoré '+JSON.stringify(mp));
  ok(tp.length===2&&tp.some(x=>x.pseudo==='Antoine_R'&&x.exercices===38),'semaine : Paul voit Antoine (ami)');
  await refus(comme(db,U.paul,'select tableau_periode(current_date - 100, current_date) r'),'période de plus de 62 jours','PERIODE_INVALIDE');
  await f('antoine',"select retirer_ami('Paul')");
  ok((await r('paul','select tableau(current_date) r')).length===1,'ami retiré des deux côtés');
  // sécurité : aucun accès direct aux tables
  for(const tb of ['profils','amities','jours','progressions','essais_ami'])await refus(comme(db,U.antoine,`select * from public.${tb}`),'lecture directe de la table '+tb,'permission denied');
  await refus(comme(db,U.antoine,"update public.profils set acquises=9999"),'modification directe d\'un profil','permission denied');
  await refus(comme(db,U.antoine,'select _nouveau_code() r'),'fonction interne','permission denied');
  // limite d'essais de codes
  await f('intrus',"select choisir_pseudo('Intrus')");let bloque=false;
  for(let i=0;i<25&&!bloque;i++){try{await comme(db,U.intrus,"select ajouter_ami('RPL-AAAAA')")}catch(e){if(e.message.includes('TROP_D_ESSAIS'))bloque=i}}
  ok(bloque===20,'deviner des codes : bloqué après 20 essais en une heure');
  // progression
  await f('antoine',`select sauver_progression('{"sp":{"Quercus robur":{"b":4}}}'::jsonb)`);
  ok((await r('antoine','select lire_progression() r')).sp['Quercus robur'].b===4,'progression sauvée et relue');
  ok((await r('coline','select lire_progression() r'))===null,'la progression d\'Antoine est invisible pour Coline');
  // suppression du compte
  await f('coline','select supprimer_compte()');
  ok((await db.query('select count(*)::int n from auth.users where id=$1',[U.coline])).rows[0].n===0&&(await db.query('select count(*)::int n from public.profils where id=$1',[U.coline])).rows[0].n===0,'compte supprimé avec toutes ses données');
  ok((await r('antoine','select tableau(current_date) r')).length===1,'Coline a disparu du tableau d\'Antoine');
  // visites anonymes : un visiteur sans compte peut compter son ouverture, mais ne lit rien
  const A1=require('crypto').randomUUID(),A2=require('crypto').randomUUID();
  await comme(db,null,'select compter_visite($1,current_date,false)',[A1]);await comme(db,null,'select compter_visite($1,current_date,false)',[A1]);
  await comme(db,U.antoine,'select compter_visite($1,current_date,true)',[A2]);
  await comme(db,null,"select compter_visite($1,current_date - 30,false)",[A2]);
  const v=(await db.query('select * from public.visites_par_jour')).rows;
  ok(v.length===1&&+v[0].appareils===2&&+v[0].ouvertures===3&&+v[0].avec_compte===1,'visites : 2 appareils, 3 ouvertures, 1 avec compte (jour trop ancien ignoré) '+JSON.stringify(v));
  await refus(comme(db,null,'select * from public.visites'),'visites : un visiteur ne lit pas la table','permission denied');
  await refus(comme(db,U.antoine,'select * from public.visites_par_jour'),'visites : un compte ne lit pas les statistiques','permission denied');
  // statistiques de jeu anonymes : envoi par paquets, valeurs vérifiées, tableaux récap illisibles depuis l'appli
  const L=(o)=>Object.assign({j:new Date().toISOString().slice(0,10),h:10,e:'Carpinus betulus',c:'arbre',x:'qcm',o:'plante',m:'classique',v:3,ok:1,a:0,s:24},o);
  await comme(db,null,'select envoyer_jeu($1,$2::jsonb,$3::jsonb)',[A1,JSON.stringify([L(),L({e:'Fagus sylvatica',v:2,ok:2,a:1,s:9999}),L({x:'pirate'}),L({e:'<script>'}),L({j:'2001-01-01'})]),JSON.stringify([{j:L().j,e:'Carpinus betulus',r:'Fagus sylvatica',n:2},{j:L().j,e:'Carpinus betulus',r:'Carpinus betulus',n:1}])]);
  await comme(db,U.antoine,'select envoyer_jeu($1,$2::jsonb,$3::jsonb)',[A2,JSON.stringify([L({v:1,ok:0,x:'saisie',o:'feuillage',m:'erreurs'})]),JSON.stringify([{j:L().j,e:'Carpinus betulus',r:'Fagus sylvatica',n:1}])]);
  await comme(db,null,'select envoyer_jeu($1,$2::jsonb,$3::jsonb)',[A1,JSON.stringify([L({v:1,ok:1})]),'[]']);
  const jj=(await db.query('select * from public.jeu_par_jour')).rows[0];
  ok(+jj.joueurs===2&&+jj.exercices===7&&+jj.justes===4&&+jj.fautes===3&&+jj.plantes_acquises===1,'jeu : 2 joueurs, 7 exercices, 4 justes (lignes invalides ignorées) '+JSON.stringify(jj));
  ok(+(await db.query("select secondes from public.jeu where espece='Fagus sylvatica'")).rows[0].secondes===240,'jeu : temps de réponse plafonné (2 min par exercice)');
  const ev=(await db.query('select * from public.especes_vues')).rows;
  ok(ev[0].espece==='Carpinus betulus'&&+ev[0].vues===5&&+ev[0].reussite===40&&+ev[0].joueurs===2,'jeu : plantes les plus vues '+JSON.stringify(ev[0]));
  const cf=(await db.query('select * from public.confusions')).rows;
  ok(cf.length===1&&+cf[0].fois===3&&+cf[0].joueurs===2,'jeu : confusions (une plante n\'est pas confondue avec elle-même) '+JSON.stringify(cf));
  const pe=(await db.query("select * from public.par_exercice where critere='1 exercice' order by valeur")).rows;
  ok(pe.length===2&&pe[0].valeur==='qcm'&&+pe[0].exercices===6,'jeu : réussite par type d\'exercice');
  ok((await db.query('select * from public.par_heure')).rows.length===1,'jeu : exercices par heure');
  await refus(comme(db,null,'select envoyer_jeu($1,$2::jsonb,$3::jsonb)',[A1,JSON.stringify(Array(401).fill(L())),'[]']).then(async()=>{if(+(await db.query('select sum(vues) n from public.jeu')).rows[0].n!==7)throw new Error('trop gros paquet ignoré');throw new Error('ignoré')}),'jeu : paquet de plus de 400 lignes','ignoré');
  for(const tb of ['jeu','jeu_confusions','jeu_par_jour','especes_vues','especes_ratees','confusions','par_exercice','par_heure'])await refus(comme(db,null,`select * from public.${tb}`),'jeu : un visiteur ne lit pas '+tb,'permission denied');
  await refus(comme(db,U.antoine,'select * from public.especes_vues'),'jeu : un compte ne lit pas les statistiques','permission denied');
  console.log(ech?ech+' ÉCHEC(S)':'SUPABASE (SQL) : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
