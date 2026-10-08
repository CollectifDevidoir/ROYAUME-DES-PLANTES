// Tout premier lancement : la première plante et ses 4 réponses tiennent à l'écran, sans défiler ;
// le choix des modes n'apparaît qu'après la première réponse, puis reste visible aux visites suivantes.
// Usage : node outils/controle_premier.js
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h] of [[360,640],[390,844],[1440,900]]){const {ctx,p}=await open({browser:b,w,h,touch:w<900,fresh:true,file:process.env.F});const tag=w+'×'+h;
  await p.waitForFunction(()=>!$('pic').classList.contains('sk')&&document.querySelectorAll('#opts button').length===4&&(()=>{const i=document.querySelector('#pic .sl img');return i&&i.complete})(),null,{timeout:20000}).catch(()=>{});
  const r=await p.evaluate(()=>{const o=[...document.querySelectorAll('#opts button')].map(x=>x.getBoundingClientRect().bottom),t=document.querySelector('.tabs').getBoundingClientRect().top;
    const im=document.querySelector('#pic .sl img');return{img:!!im&&im.naturalWidth>0&&im.getBoundingClientRect().height>100,q:$('q').textContent,modes:getComputedStyle($('chips')).display,o,t,x:document.documentElement.scrollWidth<=innerWidth+1}});
  ok(/^Bienvenue/.test(r.q),`${tag} : accueil dans la question (« ${r.q} »)`);
  ok(r.modes==='none','${tag} : choix des modes masqué avant la première réponse'.replace('${tag}',tag));
  ok(r.o.length===4&&Math.max(...r.o)<=r.t+1,`${tag} : les 4 réponses visibles au-dessus des onglets (bas ${Math.round(Math.max(...r.o))} ≤ ${Math.round(r.t)})`);
  ok(r.x,tag+' : pas de défilement horizontal');
  ok(r.img,tag+' : la photo de la première plante est affichée');
  await p.click('#opts button');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>getComputedStyle($('chips')).display==='none'&&!$('sh').hidden),tag+' : pendant la correction, rien ne s\'insère au-dessus de la photo');
  await p.click('#shn');await p.waitForTimeout(800);
  ok(await p.evaluate(()=>!document.body.classList.contains('fresh')&&getComputedStyle($('chips')).display!=='none'),tag+' : à la question suivante, les modes apparaissent');
  await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{const s=$('splash');if(s)s.click()});await p.waitForTimeout(1700);
  ok(await p.evaluate(()=>!document.body.classList.contains('fresh')&&!/^Bienvenue/.test($('q').textContent)),tag+' : visite suivante : affichage habituel');
  ok(p.errs.length===0,tag+' : aucune erreur JavaScript '+JSON.stringify(p.errs));await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'PREMIER LANCEMENT : tout est OK');process.exit(ech?1:0)})();
