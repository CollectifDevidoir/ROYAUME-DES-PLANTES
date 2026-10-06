// Étape 6 (variante A) : passages de niveau, sans erreur. Usage : node outils/controle_niveaux.js
const {chromium}=require('playwright');const path=require('path');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const ctx=await b.newContext();await ctx.route(/^https?:/,r=>r.abort());const p=await ctx.newPage();
await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(500);
const run=seq=>p.evaluate(seq=>{const q={b:1,s:0,e:0,d:0},l=[];for(const f of seq){srs(q,true,f);l.push(q.b)}return l},seq);
const t=async(seq,att,lbl)=>{const r=await run(seq);ok(JSON.stringify(r)===JSON.stringify(att),lbl+' : '+seq.join(' → ')+' donne les niveaux '+r.join(','))};
await t(['mcq','mcq','mcq','mcq','typed'],[2,2,2,3,4],'QCM seulement : 3 QCM au niveau 2');
await t(['mcq','pv','mcq','typed'],[2,2,3,4],'exercice difficile + 1 QCM au niveau 2');
await t(['mcq','typed','typed','typed'],[2,2,3,4],'2 exercices difficiles au niveau 2');
await t(['mcq','pv','typed'],[2,2,3],'1 seul exercice difficile ne suffit plus');
const e=await p.evaluate(()=>{const q={b:2,s:3,e:0,d:0,c:2};srs(q,false,'mcq');return [q.b,q.c]});ok(e[0]===1&&e[1]===0,'une erreur au niveau 2 renvoie au niveau 1');
const m=await p.evaluate(()=>{const q={b:4,s:9,e:0,d:0,c:0};srs(q,false,'typed');return q.b});ok(m===3,'niveaux 4 à 6 inchangés : une erreur renvoie au niveau 3');
await b.close()})();
