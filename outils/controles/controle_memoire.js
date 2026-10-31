// Conception cible, lot 1.1 et 1.2 : replanification des plantes acquises et délais croissants au niveau 6.
// Usage : node outils/controles/controle_memoire.js   (variable F = autre fichier html)
const {chromium}=require('playwright');const path=require('path');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext();await ctx.route(/^https?:/,r=>r.abort());const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.resolve(process.env.F||path.resolve(__dirname,'..','..','index.html')));await p.waitForTimeout(500);
const J=864e5;
// une bonne réponse sur une plante due (échéance passée d'un jour) : prochaine échéance en jours, niveau, compteur k
const due=(b0,fmt,k)=>p.evaluate(([b0,fmt,k])=>{const now=Date.now(),q={b:b0,s:5,e:0,c:0,d:now-864e5};if(k!==undefined)q.k=k;srs(q,true,fmt);return{b:q.b,k:q.k,j:Math.round((q.d-now)/864e5*10)/10}},[b0,fmt,k]);
// 1.1 : toute bonne réponse sur une plante due la replanifie
for(const [b0,fmt] of [[4,'mcq'],[4,'pv'],[5,'mcq'],[6,'mcq'],[6,'pv'],[6,'typed']]){const r=await due(b0,fmt);ok(r.j>0,`niveau ${b0}, ${fmt} juste sur une plante due : replanifiée dans ${r.j} j (avant : restait due)`)}
// paliers : écrire le nom latin fait monter, le délai suit le niveau
let r=await due(4,'typed');ok(r.b===5&&r.j===3,`niveau 4 → 5 en écrivant le nom : prochaine révision à 3 j (${r.b}, ${r.j} j)`);
r=await due(5,'typed');ok(r.b===6&&r.j===7&&!r.k,`niveau 5 → 6 : 7 j (${r.b}, ${r.j} j)`);
r=await due(5,'pv');ok(r.b===6,'niveau 5 → 6 aussi avec la photo à retrouver');
r=await due(4,'mcq');ok(r.b===4&&r.j===1,`QCM juste au niveau 4 : pas de palier, revue dans 1 j (${r.j} j)`);
// 1.2 : au niveau 6, le délai double à chaque entretien réussi, 60 j au plus
const suite=await p.evaluate(()=>{const q={b:6,s:5,e:0,c:0,d:0},l=[];let t=Date.now();const real=Date.now;
  for(let i=0;i<7;i++){Date.now=()=>t;srs(q,true,'typed');l.push(Math.round((q.d-t)/864e5));t=q.d+1}Date.now=real;return{l,k:q.k}});
ok(JSON.stringify(suite.l)==='[14,28,56,60,60,60,60]',`niveau 6, entretiens réussis en écrivant le nom : ${suite.l.join(', ')} j (attendu 14, 28, 56, 60…)`);
r=await due(6,'mcq',2);ok(r.k===2&&r.j===28,`QCM juste au niveau 6 (k=2) : délai inchangé, 28 j (${r.j} j, k=${r.k})`);
// une erreur sur une plante acquise : niveau 3 (inchangé), délais remis à zéro
r=await p.evaluate(()=>{const q={b:6,s:9,e:0,c:0,d:Date.now()-864e5,k:3};srs(q,false,'typed');return{b:q.b,k:q.k}});
ok(r.b===3&&r.k===undefined,`erreur au niveau 6 : retour au niveau 3, délais croissants remis à zéro (b=${r.b}, k=${r.k})`);
// pas encore due : rien ne change
r=await p.evaluate(()=>{const now=Date.now(),q={b:6,s:5,e:0,c:0,d:now+10*864e5,k:1};srs(q,true,'typed');return{b:q.b,k:q.k,j:Math.round((q.d-now)/864e5)}});
ok(r.b===6&&r.k===1&&r.j===10,'bonne réponse avant l’échéance : ni palier, ni nouveau délai');
// au chargement, fix() ne raccourcit plus un délai long à 7 j
r=await p.evaluate(()=>{const now=Date.now();st.sp['Quercus robur']={b:6,s:9,e:0,c:0,d:now+50*864e5,k:3};st.sp['Fagus sylvatica']={b:6,s:9,e:0,c:0,d:now+50*864e5};fix();
  return{a:Math.round((st.sp['Quercus robur'].d-now)/864e5),b:Math.round((st.sp['Fagus sylvatica'].d-now)/864e5)}});
ok(r.a===50,`chargement : un délai de 50 j acquis (k=3) est gardé (${r.a} j)`);
ok(r.b===7,`chargement : une ancienne progression sans k est ramenée à 7 j (${r.b} j)`);
// sauvegardes : k accepté, k invalide refusé, ancienne sauvegarde sans k acceptée
r=await p.evaluate(()=>[checkBackup({sp:{a:{b:6,s:3,e:0,d:0,k:2}}}),checkBackup({sp:{a:{b:6,s:3,e:0,d:0,k:-1}}}),checkBackup({sp:{a:{b:6,s:3,e:0,d:0,k:'x'}}}),checkBackup({sp:{a:{b:4,s:3,e:0,d:0}}})]);
ok(r[0]===''&&r[3]==='','restauration : sauvegarde avec k, et ancienne sauvegarde sans k, acceptées');
ok(r[1]!==''&&r[2]!=='','restauration : k négatif ou non entier refusé');
// synchronisation entre appareils : la fiche la plus travaillée gagne, avec son compteur k
r=await p.evaluate(()=>{const a={sp:{x:{b:6,s:12,e:0,c:0,d:1,k:2}}},b={sp:{x:{b:6,s:8,e:0,c:0,d:1}}};return [fusion(b,a).sp.x.k,fusion(a,b).sp.x.k]});
ok(r[0]===2&&r[1]===2,'fusion de deux appareils : le compteur k de la fiche la plus travaillée est gardé');
ok(errs.length===0,'aucune erreur JavaScript '+JSON.stringify(errs));
await b.close();console.log(ech?ech+' ÉCHEC(S)':'MÉMOIRE : tout est OK');process.exit(ech?1:0)})();
