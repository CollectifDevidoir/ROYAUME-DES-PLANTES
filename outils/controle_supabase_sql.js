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
  // défi du jour : un résultat par compte et par jour (jour de Paris), classement entre amis
  const JP=(await db.query("select (now() at time zone 'Europe/Paris')::date::text j")).rows[0].j;
  await f('antoine','select publier_defi($1::date,$2)',[JP,'1101110111']);
  await f('antoine','select publier_defi($1::date,$2)',[JP,'1111111111']);
  await refus(comme(db,U.antoine,"select publier_defi(current_date - 5,'1111111111')"),'défi : jour trop ancien','JOUR_INVALIDE');
  await refus(comme(db,U.antoine,'select publier_defi($1::date,$2)',[JP,'12x']),'défi : réponses invalides','REPONSES_INVALIDES');
  await f('paul',`select ajouter_ami('${pa.code_ami}')`);
  await f('paul','select publier_defi($1::date,$2)',[JP,'1111111100']);
  const dT=await r('antoine','select tableau_defi($1::date) r',[JP]),dA=dT.find(x=>x.moi),dP=dT.find(x=>x.pseudo==='Paul');
  ok(dA&&dA.score===8&&dA.reponses==='1101110111','défi : le premier résultat envoyé compte, rejouer ne le remplace pas '+JSON.stringify(dA));
  ok(dP&&dP.score===8&&dP.reponses==='1111111100','défi : on voit le score de ses amis '+JSON.stringify(dT.map(x=>[x.pseudo,x.score])));
  ok(!dT.some(x=>x.pseudo==='Intrus'),'défi : un non-ami n\'apparaît pas');
  ok((await r('paul','select tableau_defi($1::date - 1) r',[JP])).every(x=>x.score===null),'défi : un autre jour, personne n\'a encore joué');
  await refus(comme(db,null,'select tableau_defi(current_date) r'),'défi : visiteur non connecté','permission denied');
  await refus(comme(db,U.antoine,'select * from public.defis'),'défi : la table n\'est pas lisible directement','permission denied');
  // classement général du défi et demandes d'ami
  U.lea=require('crypto').randomUUID();await db.query('insert into auth.users(id,email) values($1,$2)',[U.lea,'lea@test.fr']);await f('lea',"select choisir_pseudo('Lea')");await f('lea',`select ajouter_ami('${pa.code_ami}')`);
  await f('intrus','select publier_defi($1::date,$2)',[JP,'1111100000']);   // Antoine (8) et Paul (8) ont déjà joué plus haut
  const gen=await r('lea','select tableau_defi_general($1::date) r',[JP]);
  ok(gen.map(x=>x.pseudo).join()==='Antoine_R,Paul,Intrus'&&gen.every(x=>!x.moi),'classement général : tous les joueurs qui ont joué (Lea n\'a pas joué et n\'y est pas)');
  ok(gen.map(x=>x.place).join()==='1,1,3'&&gen.map(x=>x.ami).join()==='true,false,false'&&gen[0].total===3,'… rangs avec ex æquo, drapeau « ami » (Antoine oui, Paul et Intrus non) '+JSON.stringify(gen.map(x=>[x.pseudo,x.place,x.ami])));
  ok((await r('lea','select tableau_defi($1::date) r',[JP])).map(x=>x.pseudo).join()==='Antoine_R,Lea','classement entre amis inchangé : Lea voit Antoine et elle (pas Paul ni Intrus)');
  ok((await r('lea','select tableau(current_date) r')).map(x=>x.pseudo).join()==='Antoine_R,Lea','Assiduité inchangée : amis seulement');
  ok((await r('lea','select tableau_periode(current_date - 6, current_date) r')).length===2,'Assiduité par période inchangée : amis seulement');
  ok((await r('intrus','select tableau_defi_general($1::date) r',[JP])).find(x=>x.moi).pseudo==='Intrus','le classement général marque ma ligne');
  await refus(comme(db,null,'select tableau_defi_general($1::date) r',[JP]),'classement général fermé aux visiteurs','permission denied');
  // fiche et demandes : aucune demande tant que je n'ai pas cliqué
  ok((await r('lea',"select profil_joueur('Paul') r")).relation==='aucune','fiche de Paul vue par Lea : aucune relation (Paul a joué le défi)');
  ok((await r('lea',"select profil_joueur('Antoine_R') r")).relation==='ami'&&(await r('lea',"select profil_joueur('Lea') r")).relation==='moi','fiches : ami, et moi');
  const fp=await r('lea',"select profil_joueur('Paul') r");ok(!('code_ami' in fp)&&!('email' in fp),'la fiche ne montre pas le code ami');
  ok((await r('lea',"select profil_joueur('Fantome') r")).erreur==='JOUEUR_INCONNU','joueur inconnu');
  ok((await r('lea',"select profil_joueur('Lea') r")).pseudo==='Lea'&&(await r('lea',"select demander_ami('Lea') r")).erreur==='SOI_MEME','demande à soi-même refusée');
  ok((await r('lea',"select demander_ami('Fantome') r")).erreur==='JOUEUR_INCONNU','demande à un inconnu refusée');
  ok((await r('lea',"select demander_ami('Antoine_R') r")).etat==='ami','demande à un ami : déjà amis, rien de créé');
  ok((await r('lea',"select demander_ami('Paul') r")).etat==='envoyee','Lea demande Paul : demande envoyée');
  ok((await r('lea',"select demander_ami('Paul') r")).etat==='envoyee'&&(await db.query("select count(*)::int n from public.demandes_ami")).rows[0].n===1,'demande répétée : aucun doublon');
  ok((await r('lea',"select profil_joueur('Paul') r")).relation==='envoyee'&&(await r('paul',"select profil_joueur('Lea') r")).relation==='recue','états : envoyée côté Lea, reçue côté Paul');
  ok((await r('lea','select tableau(current_date) r')).length===2&&!(await r('paul','select tableau(current_date) r')).some(x=>x.pseudo==='Lea'),'une demande en attente ne donne pas encore accès aux chiffres des amis');
  ok(JSON.stringify((await r('paul','select mes_demandes() r')).map(x=>x.pseudo))==='["Lea"]'&&(await r('lea','select mes_demandes() r')).length===0,'Paul voit la demande de Lea, pas Lea');
  ok((await r('paul',"select repondre_demande('Lea',false) r")).etat==='aucune'&&(await r('paul','select mes_demandes() r')).length===0,'Paul refuse : la demande disparaît de sa liste');
  ok((await r('lea',"select demander_ami('Paul') r")).etat==='envoyee'&&(await r('lea',"select profil_joueur('Paul') r")).relation==='envoyee','après refus : Lea voit toujours « envoyée » et ne peut pas relancer');
  ok((await r('paul',"select repondre_demande('Lea',true) r")).etat==='aucune','répondre à une demande refusée : sans effet');
  ok((await r('paul',"select demander_ami('Lea') r")).etat==='ami','Paul se ravise et demande Lea : amis tout de suite (elle avait demandé)');
  ok((await r('paul','select tableau(current_date) r')).some(x=>x.pseudo==='Lea'),'amitié réciproque : Paul voit Lea');
  ok((await r('lea','select tableau(current_date) r')).some(x=>x.pseudo==='Paul'),'… et Lea voit Paul');
  ok((await db.query("select count(*)::int n from public.demandes_ami")).rows[0].n===0,'demandes effacées une fois amis');
  ok((await r('intrus',"select demander_ami('Lea') r")).etat==='envoyee'&&(await r('lea',"select demander_ami('Intrus') r")).etat==='ami','demandes croisées : la seconde vaut acceptation');
  ok((await r('lea',"select profil_joueur('Intrus') r")).relation==='ami','… amis des deux côtés');
  await f('lea',"select retirer_ami('Intrus')");ok((await r('lea',"select demander_ami('Intrus') r")).etat==='envoyee','ami retiré : on peut à nouveau lui proposer');
  ok((await r('intrus',"select repondre_demande('Lea',true) r")).etat==='ami','acceptation d\'une demande reçue');
  await refus(comme(db,U.antoine,'select * from public.demandes_ami'),'lecture directe des demandes','permission denied');
  await refus(comme(db,U.antoine,'select _relation($1) r',[U.lea]),'fonction interne _relation','permission denied');
  await refus(comme(db,null,"select demander_ami('Paul') r"),'visiteur non connecté : pas de demande','permission denied');
  // limite de demandes : 20 par heure ; classement général plafonné aux 50 premiers et moi
  const B=[];for(let i=0;i<55;i++){const id=require('crypto').randomUUID();B.push(id);await db.query('insert into auth.users(id,email) values($1,$2)',[id,'x'+i+'@test.fr']);await comme(db,id,`select choisir_pseudo('Joueur${String(i).padStart(2,'0')}')`);await comme(db,id,'select publier_defi($1::date,$2)',[JP,'1000000000'])}
  let lim=false,envoyees=0;for(let i=0;i<24&&!lim;i++){try{await comme(db,U.antoine,`select demander_ami('Joueur${String(i).padStart(2,'0')}')`);envoyees++}catch(e){if(e.message.includes('TROP_DE_DEMANDES'))lim=true}}
  ok(lim&&envoyees===20,'demandes d\'ami : bloquées après 20 en une heure ('+envoyees+')');
  const g1=(await comme(db,U.antoine,'select tableau_defi_general($1::date) r',[JP])).rows[0].r,g2=(await comme(db,B[54],'select tableau_defi_general($1::date) r',[JP])).rows[0].r;
  ok(g1.length===50&&g1[0].total===58&&g2.length===51&&g2.at(-1).moi&&g2.at(-1).place===4,'classement général : 50 premiers + ma ligne si je suis plus loin, rang réel conservé ('+g1.length+', '+g2.length+')');
  // mesures d'usage anonymes et Coulisses
  const A3=require('crypto').randomUUID(),J=new Date().toISOString().slice(0,10);
  await comme(db,null,"select noter_visite($1,current_date,false,'telephone',394,true,'2026.10.14')",[A3]);
  await comme(db,null,"select noter_visite($1,current_date,false,'pirate',99999,null,'v<script>')",[A3]);
  const vi=(await db.query('select * from public.visites where appareil=$1',[A3])).rows[0];
  ok(vi.ouvertures===2&&vi.ecran==='telephone'&&vi.largeur===400&&vi.installee===true&&vi.version==='2026.10.14','visite : appareil, largeur arrondie, installée, version ; valeurs hors liste ignorées '+JSON.stringify(vi));
  const M=o=>JSON.stringify(Object.assign({v:'2026.10.14',t:'telephone'},o));
  await comme(db,null,'select envoyer_mesures($1,$2::jsonb)',[A3,M({
    u:[{j:J,q:'herbier',n:2},{j:J,q:'herbier',n:1},{j:J,q:'pirate',n:3},{j:'2001-01-01',q:'aide',n:1}],
    s:[{j:J,id:42,m:3,n:12,d:'quiz'},{j:J,id:43,m:0,n:0,d:'ailleurs'}],
    p:[{j:J,e:'Carpinus betulus',ph:111,v:8,ok:1},{j:J,e:'Carpinus betulus',ph:222,v:8,ok:8},{j:J,e:'<b>',ph:3,v:1,ok:1}],
    g:[{j:J,e:'Carpinus betulus',ph:111},{j:J,e:'Carpinus betulus',ph:111}],
    e:[{j:J,m:"Cannot read properties of null (reading 'x')",n:2},{j:J,m:'Erreur 40312 chez https://x.fr',n:1},{j:J,m:'mail a@b.fr',n:1}],
    r:{j:J,goal:40,vib:true,mode:'tout',sombre:false}})]);
  await comme(db,U.antoine,'select envoyer_mesures($1,$2::jsonb)',[A3,M({s:[{j:J,id:42,m:7,n:20,d:'herbier'}],e:[{j:J,m:"Cannot read properties of null (reading 'x')",n:1}],r:{j:J,goal:60,vib:false,mode:'arbre',sombre:true}})]);
  const us=(await db.query('select * from public.usages')).rows;
  ok(us.length===1&&us[0].quoi==='herbier'&&us[0].fois===3,'usages : écran compté, fonction inconnue et jour trop ancien ignorés '+JSON.stringify(us));
  const se=(await db.query('select * from public.sessions')).rows;
  ok(se.length===1&&se[0].minutes===7&&se[0].exercices===20&&se[0].dernier==='herbier','sessions : une session mise à jour (durée et exercices au plus haut), dernier écran inconnu refusé '+JSON.stringify(se));
  ok((await db.query('select count(*)::int n from public.photos_jeu')).rows[0].n===2,'photos : réussite par photo, nom invalide ignoré');
  ok((await db.query('select count(*)::int n from public.signalements')).rows[0].n===1,'signalements : une photo signalée une seule fois par jour et par appareil');
  const er=(await db.query('select * from public.erreurs')).rows;
  ok(er.length===1&&er[0].fois===3&&er[0].version==='2026.10.14'&&er[0].ecran==='telephone','erreurs : messages avec nombre, adresse ou e-mail refusés, sans identifiant d\'appareil '+JSON.stringify(er));
  ok(!Object.keys(er[0]).includes('appareil'),'erreurs : aucune colonne d\'appareil');
  const rg=(await db.query('select * from public.reglages')).rows;
  ok(rg.length===1&&rg[0].objectif===60&&rg[0].mode==='arbre'&&rg[0].sombre===true,'réglages : une ligne par jour, dernière valeur gardée');
  await comme(db,null,'select envoyer_mesures($1,$2::jsonb)',[A3,M({r:{j:J,goal:40,vib:true,mode:'<script>',sombre:false}})]);
  ok((await db.query('select mode from public.reglages')).rows[0].mode==='arbre','réglages : mode hors liste refusé');
  for(const tb of ['usages','sessions','photos_jeu','signalements','erreurs','reglages','admins'])await refus(comme(db,U.antoine,`select * from public.${tb}`),'mesures : un compte ne lit pas '+tb,'permission denied');
  await refus(comme(db,null,'select _purger()'),'mesures : un visiteur ne peut pas lancer l\'effacement','permission denied');
  // Coulisses : réservé aux administrateurs
  await refus(comme(db,null,'select coulisses(current_date - 6, current_date) r'),'coulisses : visiteur non connecté','permission denied');
  ok((await r('paul','select suis_admin() r'))===false,'coulisses : Paul n\'est pas administrateur');
  await refus(comme(db,U.paul,'select coulisses(current_date - 6, current_date) r'),'coulisses : compte non administrateur','NON_AUTORISE');
  await db.query('insert into public.admins values ($1)',[U.antoine]);
  ok((await r('antoine','select suis_admin() r'))===true,'coulisses : Antoine est administrateur');
  await refus(comme(db,U.antoine,'select coulisses(current_date - 500, current_date) r'),'coulisses : période trop longue','PERIODE_INVALIDE');
  // fidélité : 3 appareils arrivés il y a 10 jours, 2 reviennent 8 jours plus tard
  const C=[1,2,3].map(()=>require('crypto').randomUUID());
  for(const c of C)await db.query('insert into public.visites(jour,appareil) values (current_date - 10,$1)',[c]);
  for(const c of C.slice(0,2))await db.query('insert into public.visites(jour,appareil) values (current_date - 2,$1)',[c]);
  const co=await r('antoine','select coulisses(current_date - 29, current_date) r');
  ok(co.resume.appareils>=5&&co.resume.nouveaux>=5&&co.resume.telephone===100&&co.resume.installee===100,'coulisses : résumé (appareils, nouveaux, téléphone, installée) '+JSON.stringify(co.resume));
  ok(co.jours.length===30&&co.jours.at(-1).jour===J,'coulisses : 30 jours, aujourd\'hui compris');
  ok(co.retours.j7===67,'coulisses : 2 appareils sur 3 revenus après 7 jours '+JSON.stringify(co.retours));
  ok(Array.isArray(co.cohortes)&&co.cohortes.some(x=>x.appareils>=3&&Array.isArray(x.suite)&&x.suite.length===4),'coulisses : cohortes par semaine '+JSON.stringify(co.cohortes));
  ok(co.usages[0].quoi==='herbier'&&co.usages[0].appareils===1,'coulisses : fonctions utilisées');
  ok(co.durees.length===5&&co.durees.find(x=>x.tranche==='5 à 14 min').sessions===1&&co.departs[0].dernier==='herbier','coulisses : durée des sessions et dernier écran');
  ok(co.photos.length===1&&co.photos[0].photo===111&&co.photos[0].signalements===1,'coulisses : photo qui piège repérée et signalée '+JSON.stringify(co.photos));
  ok(co.erreurs[0].fois===3&&co.reglages.objectifs[0].objectif===60&&co.reglages.sombre===100,'coulisses : erreurs et réglages');
  ok(co.versions.some(x=>x.version==='2026.10.14')&&co.ecrans.some(x=>x.ecran==='telephone'),'coulisses : versions et types d\'écran');
  // effacement après 13 mois
  await db.query("insert into public.usages values (current_date - 400,$1,'aide',1)",[A3]);await db.query("insert into public.visites(jour,appareil) values (current_date - 400,$1)",[A3]);
  await db.query('select public._purger()');
  ok((await db.query("select count(*)::int n from public.usages where jour < current_date - 395")).rows[0].n===0&&(await db.query("select count(*)::int n from public.visites where jour < current_date - 395")).rows[0].n===0,'mesures : effacées après 13 mois');
  console.log(ech?ech+' ÉCHEC(S)':'SUPABASE (SQL) : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
