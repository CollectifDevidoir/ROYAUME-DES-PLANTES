// Coulisses (coulisses.html), de bout en bout, sans réseau : faux Supabase (vraie base PostgreSQL) rempli de données d'exemple.
// Connexion, accès refusé à un compte non administrateur, chiffres affichés, changement de période, base pas à jour,
// téléphone et ordinateur, thème sombre, aucune erreur de page, aucun défilement horizontal.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_coulisses.js [dossier où enregistrer des captures]
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),http=require('http'),crypto=require('crypto');
const {base,brancher}=require('./supabase/faux_supabase.js');
const URL_SB='https://demo.supabase.co',CAPT=process.argv[2];
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
// données d'exemple : 80 appareils sur 40 jours, une partie revient ; tirage fixe
let g=7;const rnd=()=>{g=(g*1103515245+12345)%2147483648;return g/2147483648};
async function remplir(db){
  const P=['Carpinus betulus','Fagus sylvatica','Quercus robur','Quercus petraea','Acer campestre','Carex testacea','Tilia cordata','Tilia platyphyllos','Abies koreana','Salix repens'];
  const V=[],Jx=[],Se=[],Us=[],Ph=[],Rg=[];
  for(let a=0;a<80;a++){
    const id=crypto.randomUUID(),deb=Math.floor(rnd()*40),tel=rnd()<.65,ecr=tel?'telephone':rnd()<.2?'tablette':'ordi',l=tel?400:ecr==='tablette'?800:1400;
    for(let d=deb;d>=0;d--){if(d!==deb&&rnd()>.22)continue;
      V.push(`(current_date - ${d},'${id}',${1+Math.floor(rnd()*3)},${rnd()<.3},'${ecr}',${l},${rnd()<.25},'${rnd()<.7?'2026.10.14':'2026.10.01'}')`);
      const n=3+Math.floor(rnd()*30);Se.push(`(current_date - ${d},'${id}',${Math.floor(rnd()*1e9)},${Math.floor(rnd()*35)},${n},'${['quiz','quiz','herbier','progres','profil','fenetre'][Math.floor(rnd()*6)]}')`);
      for(const p of P)if(rnd()<.5){const v=1+Math.floor(rnd()*4),dur=p==='Carex testacea'||p==='Abies koreana'?.25:p.startsWith('Quercus')?.5:.8;
        Jx.push(`(current_date - ${d},${8+Math.floor(rnd()*14)},'${id}','${p}','arbre','${rnd()<.75?'qcm':'saisie'}','${['plante','feuillage','fleurs','fruits'][Math.floor(rnd()*4)]}','${rnd()<.8?'classique':'erreurs'}',${v},${Math.round(v*dur*(.7+rnd()*.6))>v?v:Math.round(v*dur*(.7+rnd()*.6))},${rnd()<.2?1:0},${v*(4+Math.floor(rnd()*8))})`);
        Ph.push(`(current_date - ${d},'${id}','${p}',${p==='Tilia cordata'&&rnd()<.5?10778:100+P.indexOf(p)},${v},${p==='Tilia cordata'?0:v})`)}
      for(const q of ['herbier','progres','fiche','profil','aide','famille_jour','joker','zoom'])if(rnd()<({herbier:.6,progres:.4,fiche:.3,profil:.25,aide:.1,famille_jour:.35,joker:.2,zoom:.3})[q])Us.push(`(current_date - ${d},'${id}','${q}',${1+Math.floor(rnd()*3)})`);
      Rg.push(`(current_date - ${d},'${id}',${[20,40,40,40,60,100][Math.floor(rnd()*6)]},${rnd()<.8},'${rnd()<.8?'tout':'arbre'}',${rnd()<.35})`);
    }
  }
  const ins=async(t,c,l)=>{for(let i=0;i<l.length;i+=500)await db.exec(`insert into public.${t} ${c} values ${l.slice(i,i+500).join(',')} on conflict do nothing`)};
  await ins('visites','(jour,appareil,ouvertures,compte,ecran,largeur,installee,version)',V);
  await ins('jeu','(jour,heure,appareil,espece,categorie,exercice,organe,mode,vues,justes,acquises,secondes)',Jx);
  await ins('sessions','(jour,appareil,sid,minutes,exercices,dernier)',Se);await ins('usages','(jour,appareil,quoi,fois)',Us);
  await ins('photos_jeu','(jour,appareil,espece,photo,vues,justes)',Ph);await ins('reglages','(jour,appareil,objectif,vibrations,mode,sombre)',Rg);
  await db.exec(`insert into public.jeu_confusions select current_date - 1, appareil, 'Carpinus betulus', 'Fagus sylvatica', 2 from (select distinct appareil from public.jeu limit 20) a on conflict do nothing;
    insert into public.signalements select current_date - 2, appareil, 'Tilia cordata', 10778 from (select distinct appareil from public.jeu limit 3) a on conflict do nothing;
    insert into public.erreurs values (current_date - 3, '2026.10.01', 'telephone', 'Cannot read properties of null (reading ''classList'')', 4)`);
}
(async()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'..','coulisses.html'),'utf8'),F=path.join(path.resolve(__dirname,'..'),'.coulisses-test.html');
  fs.writeFileSync(F,html.replace(/const SB_URL='[^']*',SB_KEY='[^']*';/,`const SB_URL='${URL_SB}',SB_KEY='cle-anon-test';`));
  // petit serveur local (comme GitHub Pages) : la page lit donnees/photos.json pour les noms communs et les vignettes
  const RAC=path.resolve(__dirname,'..'),TYPES={'.html':'text/html; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
  const srv=http.createServer((rq,rs)=>{const f=path.join(RAC,decodeURIComponent(rq.url.split('?')[0]));if(!f.startsWith(RAC)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);return rs.end()}
    rs.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rs)});
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));const ADR='http://127.0.0.1:'+srv.address().port+'/.coulisses-test.html';
  try{
  const db=await base();await remplir(db);
  const A=crypto.randomUUID(),Bq=crypto.randomUUID();
  await db.query("insert into auth.users(id,email,mdp) values($1,'admin@test.fr','secret-1'),($2,'invite@test.fr','secret-2')",[A,Bq]);await db.query('insert into public.admins values($1)',[A]);
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const page=async(w,h,cs,dbx)=>{const c=await b.newContext({viewport:{width:w,height:h},colorScheme:cs||'light',deviceScaleFactor:1});const p=await c.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))p.errs.push(m.text())});
    await c.route(/^https?:/,r=>/demo\.supabase\.co|cdn\.jsdelivr\.net|127\.0\.0\.1/.test(r.request().url())?r.fallback():r.fulfill({status:404,body:''}));await brancher(p,dbx||db,URL_SB,[]);await p.goto(ADR);return p};
  const connecter=async(p,m,mdp)=>{await p.waitForSelector('#lg');await p.fill('#lg-m',m);await p.fill('#lg-p',mdp);await p.click('#lg button[type=submit]')};
  // 1. sans session : formulaire ; mauvais mot de passe ; compte non administrateur
  let p=await page(390,844);
  ok(await p.waitForSelector('#lg',{timeout:15000}).then(()=>true,()=>false),'sans session : formulaire de connexion');
  await connecter(p,'invite@test.fr','faux');await p.waitForTimeout(600);ok(/incorrect/.test(await p.textContent('#lg-e')),'mauvais mot de passe : message clair');
  await p.fill('#lg-p','secret-2');await p.click('#lg button[type=submit]');await p.waitForTimeout(800);
  ok(/Accès réservé/.test(await p.textContent('#vue'))&&/insert into public\.admins/.test(await p.textContent('#vue'))&&!(await p.$('.kpis')),'compte non administrateur : accès refusé, commande SQL pour l\'autoriser, aucun chiffre');
  await p.click('#out');await p.waitForSelector('#lg');ok(true,'changer de compte : retour au formulaire');
  // 2. administrateur, téléphone : chiffres de 30 jours
  await connecter(p,'admin@test.fr','secret-1');await p.waitForSelector('.kpis',{timeout:15000});await p.waitForTimeout(300);
  const t=await p.textContent('#vue');
  for(const s of ['appareils différents','reviennent après 7 jours','Fréquentation','Fidélité','Fonctions utilisées','Sessions','Appareils','Heures de jeu','Plantes les plus ratées','Confusions','Photos qui piègent','Photos signalées','Erreurs techniques','Réglages choisis'])ok(t.includes(s),'section affichée : '+s);
  ok(await p.evaluate(()=>document.querySelector('#per button[aria-pressed="true"]').dataset.n==='30'),'période par défaut : 30 jours');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.kpi')].some(k=>/^2comptesutilisateurs/.test(k.textContent.replace(/\s/g,'')))),'indicateur : 2 comptes utilisateurs (les deux comptes de test)');
  ok(await p.evaluate(()=>{const g=document.querySelector('.vb svg').querySelectorAll('g[data-tip]'),r=g[g.length-1].getBoundingClientRect(),h=g[g.length-1].querySelector('rect.h').getBoundingClientRect();return Math.abs(r.width-h.width)<1}),'dernière barre : la zone de sélection (focus) a la largeur de la colonne, pas celle de l\'étiquette');
  ok(await p.evaluate(()=>document.querySelectorAll('.vb svg g[data-tip]').length)>=30+30+24,'graphiques : une barre par jour (deux graphiques) et par heure');
  ok(/Carex testacea/.test(await p.textContent('.grid'))&&/Sapin de Corée/.test(await p.textContent('.grid')),'plantes les plus ratées, avec leur nom commun (Carex testacea, Abies koreana : Sapin de Corée)');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.ph .im')].some(x=>/photos\/10778\/square\.jpg/.test(x.style.backgroundImage))),'vignette de la photo tirée de l\'index de l\'appli');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.ph a')].some(a=>/photos\/10778$/.test(a.href))),'photo qui piège repérée, avec lien iNaturalist');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'téléphone : aucun défilement horizontal');
  await p.evaluate(()=>document.querySelector('.vb').scrollIntoView());await p.waitForTimeout(200);await p.hover('.vb svg g[data-tip]:nth-of-type(10)');await p.waitForTimeout(150);ok(await p.evaluate(()=>!$('tip').hidden&&/appareils/.test($('tip').textContent)),'infobulle au survol d\'une barre');
  if(CAPT){await p.screenshot({path:path.join(CAPT,'coulisses-tel.png'),fullPage:true})}
  // changement de période : 7 jours, retenu au retour
  await p.click('#per button[data-n="7"]');await p.waitForTimeout(800);
  ok(await p.evaluate(()=>document.querySelector('#per button[aria-pressed="true"]').dataset.n==='7'&&document.querySelectorAll('.vb')[0].querySelectorAll('g[data-tip]').length===7),'période 7 jours : 7 barres');
  await p.reload();await p.waitForSelector('.kpis',{timeout:15000});
  ok(await p.evaluate(()=>document.querySelector('#per button[aria-pressed="true"]').dataset.n==='7'),'session gardée et période retenue après rechargement');
  ok(p.errs.length===0,'téléphone : aucune erreur de page '+JSON.stringify(p.errs));
  // 3. ordinateur, thème sombre, 12 mois
  const q=await page(1440,900,'dark');await connecter(q,'admin@test.fr','secret-1');await q.waitForSelector('.kpis',{timeout:15000});
  await q.click('#per button[data-n="365"]');await q.waitForTimeout(1200);
  ok(await q.evaluate(()=>document.querySelectorAll('.vb')[0].querySelectorAll('g[data-tip]').length===365),'12 mois : 365 jours');
  ok(await q.evaluate(()=>getComputedStyle(document.body).color!=='rgb(20, 40, 26)'),'thème sombre appliqué');
  ok(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&q.errs.length===0,'ordinateur : ni défilement horizontal, ni erreur '+JSON.stringify(q.errs));
  if(CAPT){await q.click('#per button[data-n="30"]');await q.waitForTimeout(900);await q.screenshot({path:path.join(CAPT,'coulisses-ordi.png'),fullPage:true})}
  // 4. base vide : messages « pas encore de données » ; base pas à jour : message clair
  const vide=await base();await vide.query("insert into auth.users(id,email,mdp) values($1,'admin@test.fr','secret-1')",[A]);await vide.query('insert into public.admins values($1)',[A]);
  const r=await page(390,844,'light',vide);await connecter(r,'admin@test.fr','secret-1');await r.waitForSelector('.kpis',{timeout:15000});
  ok((await r.$$('.vide')).length>=8&&r.errs.length===0,'base vide : « Pas encore de données » partout, aucune erreur');
  const vieille=await base();await vieille.exec('drop function public.suis_admin(); drop function public.coulisses(date, date);');await vieille.query("insert into auth.users(id,email,mdp) values($1,'admin@test.fr','secret-1')",[A]);
  const s=await page(390,844,'light',vieille);await connecter(s,'admin@test.fr','secret-1');await s.waitForTimeout(900);
  ok(/pas à jour/.test(await s.textContent('#vue')),'base pas à jour : invite à relancer schema.sql');
  await b.close();
  }finally{fs.rmSync(F,{force:true});srv.close()}
  console.log(ech?ech+' ÉCHEC(S)':'COULISSES : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
