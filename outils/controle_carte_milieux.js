// Herbier, volet « Carte des milieux » : chaque milieu se sélectionne en touchant sa surface (pas seulement son étiquette),
// le contour et l'étiquette suivent, et le nombre d'espèces affiché est celui de donnees/milieux-habitats.csv (associations
// vérifiées, une espèce comptée une fois par milieu). Aussi : Échap revient à la vue générale, la rangée d'étiquettes change
// de milieu, un sous-milieu filtre les plantes, une plante ouvre sa fiche, aucun identifiant en double, aucun défilement horizontal.
// Usage : node outils/controle_carte_milieux.js
const {open}=require('./banc_essai.js');const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
let echecs=0;const ok=(c,m)=>{if(!c)echecs++;console.log((c?'OK   ':'ÉCHEC ')+m)};
// lecture CSV (séparateur « ; », champs entre guillemets possibles)
const lignes=t=>{const R=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===';'){r.push(f);f=''}else if(c==='\n'){r.push(f);R.push(r);r=[];f=''}else if(c!=='\r')f+=c}
  if(f||r.length){r.push(f);R.push(r)}return R};
const csv=lignes(fs.readFileSync(path.resolve(__dirname,'..','donnees','milieux-habitats.csv'),'utf8')),H=csv[0];
const iN=H.indexOf('Nom latin'),iT=H.indexOf('Territoire'),iC=H.indexOf('Confiance'),attendu={};
csv.slice(1).forEach(c=>{if(c[iC]==='verified')(attendu[c[iT]]=attendu[c[iT]]||new Set()).add(c[iN])});
const TER=['FOR','LIS','PRA','LAN','HUM','EAU','ROC','LIT','HAB'];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h,t] of [[1366,800,0],[390,844,1]]){const tag=w+'x'+h;
  const {p,ctx}=await open({browser:b,w,h,touch:!!t,state:JSON.stringify({sp:{'Quercus robur':{b:5,s:2,e:0,d:0,c:0}},hist:{},m:{}})});
  await p.click('.tabs button[data-t=herb]');await p.waitForTimeout(400);
  ok(await p.evaluate(()=>!!document.querySelector('#herb [data-hv=col][aria-selected=true]')&&!!document.querySelector('#herb .hc,#herb .hk-t')),tag+' Herbier : volet Collection par défaut, inchangé');
  await p.click('[data-hv=map]');await p.waitForFunction(()=>document.querySelector('#herb .msvg'),null,{timeout:5000}).catch(()=>{});
  ok(await p.evaluate(()=>!!document.querySelector('#herb .msvg')),tag+' carte affichée');
  const clic=async k=>{const r=await p.evaluate(k=>{const m=CARTE_MILIEUX,b=document.querySelector('#herb .msvg').getBoundingClientRect();return[b.left+m.Z[k].p[0]/m.W*b.width,b.top+m.Z[k].p[1]/m.H*b.height]},k);await p.mouse.click(r[0],r[1]);await p.waitForTimeout(250)};
  for(const k of TER){await clic(k);const r=await p.evaluate(()=>({z:document.querySelector('.z.on')?.dataset.m,l:document.querySelector('.zl.on')?.dataset.for,e:document.querySelector('.zsw.on')?.dataset.m,n:+document.querySelector('.mp-k b')?.textContent}));
    ok(r.z===k&&r.l===k&&r.e===k&&r.n===attendu[k].size,`${tag} ${k} : surface, contour et étiquette sélectionnés, ${r.n} espèces (attendu ${attendu[k].size})`)}
  await p.keyboard.press('Escape');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!document.querySelector('.z.on')&&!document.querySelector('.mp-h')),tag+' Échap : retour à la vue générale');
  await clic('PRA');await p.click('.mp-sm [data-sub="PRA-04"]');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>document.querySelectorAll('.mpan .pk').length)===9,tag+' sous-milieu « pelouses alpines » : 9 plantes');
  await p.click('.mstrip [data-sw=HUM]');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>document.querySelector('.z.on')?.dataset.m)==='HUM',tag+' rangée d\'étiquettes : changement de milieu sans fermer le panneau');
  await p.click('.mpan .pk[data-l]');await p.waitForTimeout(800);
  ok(await p.evaluate(()=>!!document.querySelector('dialog[open]')),tag+' une plante du panneau ouvre sa fiche');
  ok(await p.evaluate(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.values(c).every(v=>v===1)}),tag+' aucun identifiant en double dans la page');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tag+' pas de défilement horizontal');
  ok(p.errs.length===0,tag+' aucune erreur JavaScript '+p.errs.join(' | '));
  await ctx.close()}
await b.close();process.exit(echecs?1:0)})();
