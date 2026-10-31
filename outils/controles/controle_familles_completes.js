// Conception cible, lot 5.2 : « Famille complète ». Acquérir la dernière espèce d'une famille du jeu (3 espèces ou plus)
// déclenche une fois la célébration existante ; jamais rejouée (rechute puis nouvelle acquisition, restauration, autre appareil) ;
// la carte « Ta collection » de la Famille du jour l'indique. Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_familles_completes.js
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {b,p}=await open({w:390,h:844,touch:true,file:process.env.F});
  const F='Cannabaceae';
  // acquiert la plante n en écrivant son nom (vrai parcours answer → srs → célébrations)
  const acquiert=async n=>{await lance(p,'typed');return p.evaluate(([n,F])=>{celQ=[];document.querySelectorAll('.rku').forEach(e=>e.remove());
    cur=S.find(s=>s[0]===n);st.sp[n]={b:3,s:4,e:0,c:0,d:0};done=false;curTrain=false;answer(n);
    const t=[...document.querySelectorAll('.rku')].map(e=>e.textContent).join(' | ')+' | '+celQ.map(o=>o.title).join(' | ');return{b:st.sp[n].b,cel:/Famille complète/.test(t),fc:st.fc[F]||null}},[n,F])};
  const L=await p.evaluate(F=>FAMSP[F].map(s=>s[0]),F);
  await p.evaluate(([F,L])=>{st.fc={};L.forEach(n=>delete st.sp[n])},[F,L]);
  const a1=await acquiert(L[0]);ok(a1.b===4&&!a1.cel,`${F} : 1re espèce acquise sur ${L.length}, pas de célébration`);
  await acquiert(L[1]);const a3=await acquiert(L[2]);
  ok(a3.cel&&a3.fc===await p.evaluate(()=>today()),`${F} : dernière espèce acquise → « Famille complète ! », datée du jour`);
  // rechute puis nouvelle acquisition : pas de seconde célébration
  await p.evaluate(n=>{st.sp[n].b=3},L[2]);const a4=await acquiert(L[2]);
  ok(!a4.cel,'rechute puis nouvelle acquisition : pas de seconde célébration');
  // carte de la Famille du jour
  await p.evaluate(F=>openFamily(F),F);await p.waitForTimeout(300);
  ok(await p.evaluate(()=>/famille complète/.test(document.querySelector('#fz .fc4 summary').textContent)),'Famille du jour : la carte « Ta collection » indique « famille complète »');
  await p.evaluate(()=>$('fam').close());
  // autre appareil : la fusion garde les familles des deux côtés
  const fu=await p.evaluate(()=>{const a={sp:{},fc:{Rosaceae:'2026-10-01'}},c={sp:{},fc:{Pinaceae:'avant'}};const m=fusion(a,c);return Object.keys(m.fc).sort().join(',')});
  ok(fu==='Pinaceae,Rosaceae','fusion de deux appareils : familles complètes des deux côtés conservées');
  // restauration d'une sauvegarde sans fc où la famille est complète : notée sans célébration
  const re=await p.evaluate(([F,L])=>{const o=JSON.parse(JSON.stringify(st));delete o.fc;celQ=[];st=o;fix();return{fc:st.fc[F],cel:celQ.length}},[F,L]);
  ok(re.fc==='avant'&&re.cel===0,'sauvegarde sans la liste des familles : famille complète notée « avant », sans célébration');
  ok(await p.evaluate(()=>checkBackup({sp:{},fc:[]})!==''&&checkBackup({sp:{},fc:{Rosaceae:'avant'}})===''),'restauration : liste des familles illisible refusée, liste correcte acceptée');
  ok(await p.evaluate(()=>Object.values(FAMSP).every(l=>l.length>=3)&&Object.keys(FAMSP).length>=60),'familles concernées : 3 espèces ou plus dans le jeu');
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'FAMILLES COMPLÈTES : tout est OK');process.exit(ech?1:0)})();
