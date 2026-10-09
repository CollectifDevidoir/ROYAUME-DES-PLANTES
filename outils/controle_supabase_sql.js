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
  console.log(ech?ech+' ÉCHEC(S)':'SUPABASE (SQL) : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
