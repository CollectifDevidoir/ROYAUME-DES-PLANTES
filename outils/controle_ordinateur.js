// Lot 2, étape D : version ordinateur (souris). Usage : node outils/controle_ordinateur.js [index.html]
// Jusqu'à 1 099 px : colonne commune de 1 120 px, Herbier en accordéon. Dès 1 100 px (souris) : barre latérale (rang, objectif,
// navigation, compte), contenu de 1 180 px au plus, séance à la hauteur de l'écran, Herbier en onglets de catégorie.
// Partout : QCM centré face à la photo, « ? » des 4 photos sur la ligne du nom, Réglages et Famille du jour en fenêtres centrées.
// Le téléphone garde son volet Réglages en bas d'écran.
const {chromium}=require('playwright');const path=require('path');
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const FICHIER=process.argv[2]||path.resolve(__dirname,'..','index.html');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const R=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height,cx:(r.left+r.right)/2,cy:(r.top+r.bottom)/2}},s);
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h] of [[860,900],[1280,650],[1440,900],[1920,1080]]){
  const {ctx,p}=await open({browser:b,w,h,touch:false,seed:true,file:FICHIER});const t=`${w}×${h}`;
  await p.evaluate(()=>{st.sp['Quercus robur']={b:2,s:4,e:2,d:0};S.filter(x=>x[2]===S.find(y=>y[0]==='Quercus robur')[2]).slice(0,9).forEach(x=>{if(!st.sp[x[0]])st.sp[x[0]]={b:4,s:6,e:0,d:0}});save()});
  const dk=await p.evaluate(()=>document.documentElement.classList.contains('dk'));ok(dk===(w>=1100),`${t} ${w>=1100?'barre latérale':'pas de barre latérale'}`);
  const m=await R(p,'main'),hd=await R(p,'.rank'),ch=await R(p,'#chips'),sd=dk&&await R(p,'#side');
  if(dk){const q=await R(p,'#quiz');ok(q.w<=1180+1&&q.l>=sd.r,`${t} contenu de ${Math.round(q.w)} px à droite de la barre latérale`);
    ok(await p.evaluate(()=>!!document.querySelector('#side .rank')&&!!document.querySelector('#side .tabs')),`${t} rang et navigation dans la barre latérale`)}
  else{ok(m.w<=1120+1,`${t} colonne commune : ${Math.round(m.w)} px`);ok(Math.abs(hd.l-ch.l)<2&&Math.abs(hd.r-ch.r)<2,`${t} en-tête aligné sur les cartes`)}
  await lance(p,'mcq');await p.evaluate(()=>$('qc').scrollIntoView());await p.waitForTimeout(300);
  const pic=await R(p,'#qc .pic'),q=await R(p,'#q'),o=await R(p,'#opts'),tb=await R(p,'.tabs');
  const bloc=(q.t+o.b)/2;ok(Math.abs(bloc-pic.cy)<24,`${t} QCM : question et réponses centrées face à la photo (écart ${Math.round(bloc-pic.cy)} px)`);
  ok(o.l>pic.r,`${t} QCM : réponses à droite de la photo`);
  const hb=await p.evaluate(()=>Math.min(...[...document.querySelectorAll('#opts button')].map(x=>x.getBoundingClientRect().height)));ok(hb>=48,`${t} QCM : réponses de ${Math.round(hb)} px de haut`);
  if(dk)ok(o.b<=h+1&&pic.b<=h+1&&pic.l>=sd.r,`${t} QCM : photo et réponses entières à l'écran, à droite de la barre latérale`);
  else ok(o.b<=tb.t+1&&pic.b<=tb.t+1,`${t} QCM : photo et réponses au-dessus de la barre d'onglets`);
  await lance(p,'typed');await p.evaluate(()=>$('qc').scrollIntoView());await p.waitForTimeout(300);
  {const pc=await R(p,'#qc .pic'),f=await R(p,'#q-form');ok(Math.abs(f.cy-pc.cy)<12,`${t} saisie : champ centré face à la photo (écart ${Math.round(f.cy-pc.cy)} px)`)}
  await lance(p,'pv');ok(await p.evaluate(()=>/\?\s*$/.test(document.querySelector('#q .pvn').textContent)),`${t} 4 photos : « ? » sur la ligne du nom`);
  await p.click('.tabs button[data-t=herb]');await p.evaluate(()=>{document.querySelectorAll('#herb details').forEach(d=>d.open=true)});await p.waitForTimeout(400);
  if(dk){const k=await p.evaluate(()=>{const t=[...document.querySelectorAll('#herb .hk-t button')];const c=new Set([...document.querySelectorAll('#herb .hk-g .pk')].map(e=>Math.round(e.getBoundingClientRect().left))).size;return{n:t.length,on:t.filter(b=>b.getAttribute('aria-pressed')==='true').length,c}});
    ok(k.n===5&&k.on===1,`${t} Herbier : 5 onglets de catégorie, 1 sélectionné`);ok(k.c>=4,`${t} Herbier : grille de ${k.c} colonnes`);
    {const pk=await p.evaluate(()=>{const e=document.querySelector('#herb .pk');return e?e.getBoundingClientRect().width:0});ok(pk>=100,`${t} Herbier : vignettes de ${Math.round(pk)} px`)}
    await p.click('#herb .hk-t button:nth-child(3)');await p.waitForTimeout(300);
    ok(await p.evaluate(()=>document.querySelector('#herb .hk-t button:nth-child(3)').getAttribute('aria-pressed')==='true'&&st.hk===document.querySelector('#herb .hk-t button:nth-child(3)').dataset.hk),`${t} Herbier : changer d'onglet, choix mémorisé`)}
  else{const hc=await p.evaluate(()=>[...document.querySelectorAll('#herb .hc')].map(e=>Math.round(e.getBoundingClientRect().left)));const cols=new Set(hc).size;
  ok(cols===1,`${t} Herbier : ${cols} colonne(s)`)}
  if(!dk){const pk=await p.evaluate(()=>{const e=document.querySelector('#herb .pk');return e?e.getBoundingClientRect().width:0});ok(pk>=100,`${t} Herbier : vignettes de ${Math.round(pk)} px`);}
  await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(300);
  const c=await p.evaluate(()=>[...document.querySelectorAll('#pro>.card')].slice(0,2).map(e=>Math.round(e.getBoundingClientRect().top)));
  ok(w>=1200?c[0]===c[1]:c[0]!==c[1],`${t} Progrès : ${w>=1200?'Aujourd\'hui et Régularité côte à côte':'une colonne'}`);
  if(dk){ok(await p.evaluate(()=>!!document.querySelector('#side [data-sd=prf]')&&!!document.querySelector('#side [data-sd=set]')),`${t} Profil et Réglages dans la barre latérale`)}
  await p.click('.tabs button[data-t=quiz]');await p.click('#ring');await p.waitForTimeout(400);
  const s=await R(p,'#set');ok(Math.abs(s.cx-w/2)<2&&Math.abs(s.cy-h/2)<2&&s.w<=561,`${t} Réglages : fenêtre centrée de ${Math.round(s.w)} px`);
  await p.click('#set-x');await p.waitForTimeout(300);await p.click('#fday');await p.waitForTimeout(500);
  const f=await R(p,'#fam');ok(Math.abs(f.cx-w/2)<2&&Math.abs(f.cy-h/2)<2&&f.w<=601,`${t} Famille du jour : carte centrée de ${Math.round(f.w)} px`);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${t} pas de défilement horizontal`);
  ok(p.errs.length===0,`${t} aucune erreur JavaScript`);await ctx.close()}
{const {ctx,p}=await open({browser:b,w:390,h:844,touch:true,seed:true,file:FICHIER});
 await p.click('#ring');await p.waitForTimeout(500);const s=await R(p,'#set');ok(Math.abs(s.b-844)<2,'390×844 téléphone : Réglages reste un volet en bas d\'écran');
 const m=await R(p,'.rank');ok(m.l<=0&&m.r>=389,'390×844 téléphone : en-tête de bord à bord');await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'ORDINATEUR : tout est OK');process.exit(ech?1:0);
})();
