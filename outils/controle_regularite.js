// Lot 2, point 4 : graphique de régularité — ligne repère de l'objectif (réglage goal()) et initiales des jours.
// Usage : node outils/controle_regularite.js [largeur hauteur] [dossier_captures]   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const W=+process.argv[2]||360,H=+process.argv[3]||640,DOS=process.argv[4];
(async()=>{const {b,p}=await open({w:W,h:H,touch:W<900,file:process.env.F});
await p.evaluate(()=>{const n=[12,40,55,0,30,8,46,0,20,62,35,40,10,25];n.forEach((v,i)=>{if(v)st.hist[dstr(Date.now()-(13-i)*864e5)]={n:v,ok:Math.round(v*.8)}});save()});
await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(400);
const mes=()=>p.evaluate(()=>{const h=document.querySelector('#pro .hist').getBoundingClientRect(),l=document.querySelector('#pro .hgl').getBoundingClientRect(),mx=Math.max(goal(),...[...Array(14)].map((_,i)=>(st.hist[dstr(Date.now()-(13-i)*864e5)]||{n:0}).n));
  return{attendu:h.bottom-h.height*goal()/mx,ligne:l.top+l.height/2,goal:goal(),lab:document.querySelector('#pro .hgl small').textContent}});
let m=await mes();
ok(Math.abs(m.ligne-m.attendu)<=1.5,`ligne de l'objectif ${m.goal} à la bonne hauteur (écart ${(m.ligne-m.attendu).toFixed(1)} px)`);
ok(m.lab==='objectif '+m.goal,'mention « '+m.lab+' »');
const j=await p.evaluate(()=>{const lt=[...document.querySelectorAll('#pro .hdl span')].map(s=>s.textContent);const att=[...Array(14)].map((_,i)=>new Date(Date.now()-(13-i)*864e5).toLocaleDateString('fr-FR',{weekday:'narrow'}).toUpperCase());const t=document.querySelectorAll('#pro .hdl .tdy');return{lt,att,tdy:t.length===1&&t[0]===document.querySelector('#pro .hdl span:last-child')}});
ok(j.lt.length===14&&j.lt.join('')===j.att.join(''),'initiales des 14 jours conformes au calendrier : '+j.lt.join(' '));
ok(j.tdy,'aujourd’hui mis en évidence (dernière initiale)');
if(DOS)await p.screenshot({path:DOS+`/regularite-${W}.png`});
// changement d'objectif depuis Réglages, onglet Progrès ouvert
await p.click('#pro-set');await p.waitForTimeout(400);
await p.focus('#set-g');for(let k=0;k<3;k++)await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
m=await mes();ok(m.goal===70&&Math.abs(m.ligne-m.attendu)<=1.5,`objectif passé à ${m.goal} : la ligne suit aussitôt (écart ${(m.ligne-m.attendu).toFixed(1)} px)`);
await p.focus('#set-g');for(let k=0;k<6;k++)await p.keyboard.press('ArrowLeft');await p.waitForTimeout(200);
m=await mes();ok(m.goal===10&&Math.abs(m.ligne-m.attendu)<=1.5,`objectif ${m.goal} : la ligne descend (écart ${(m.ligne-m.attendu).toFixed(1)} px)`);
ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
await b.close();console.log(ech?ech+' ÉCHEC(S)':'RÉGULARITÉ : tout est OK');process.exit(ech?1:0)})();
