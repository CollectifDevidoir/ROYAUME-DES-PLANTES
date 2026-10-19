// Famille du jour sur ordinateur : feuilleter les cartes en glissant à la souris, avec les flèches ‹ › et au clavier ; un glissement ne déclenche pas de clic.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_famille_ordi.js
const {chromium}=require('playwright');const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
 for(const [w,h] of [[1366,800],[1024,700]]){
  const {ctx,p}=await open({browser:b,w,h,seed:true});
  await p.evaluate(()=>openFamily(famDay()));await p.waitForTimeout(500);
  const carte=()=>p.evaluate(()=>{const z=$('fz');return Math.round(z.scrollLeft/(z.clientWidth+10))});
  // le défilement est animé : on attend que la carte attendue soit en place (4 s au plus) plutôt qu'un délai fixe
  const attend=n=>p.waitForFunction(n=>{const z=$('fz');return Math.abs(z.scrollLeft-n*(z.clientWidth+10))<2},n,{timeout:4000}).then(()=>p.waitForTimeout(150),()=>{});
  const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&!e.hidden&&getComputedStyle(e).display!=='none'},s);
  ok(!(await vis('#fam .fpv'))&&await vis('#fam .fnv'),`${w} : carte 1, seule la flèche « suivante » est affichée`);
  const r=await p.evaluate(()=>{const r=$('fz').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]});
  await p.mouse.move(r[0]+150,r[1]);await p.mouse.down();for(let k=1;k<=10;k++)await p.mouse.move(r[0]+150-k*30,r[1]);await p.mouse.up();await attend(1);
  ok(await carte()===1&&await p.evaluate(()=>$('fam').open),`${w} : glisser à la souris vers la gauche : carte 2, la famille reste ouverte`);
  await p.click('#fam .fnv');await attend(2);ok(await carte()===2,`${w} : flèche « suivante » : carte 3`);
  await p.click('#fam .fpv');await attend(1);ok(await carte()===1,`${w} : flèche « précédente » : carte 2`);
  await p.keyboard.press('ArrowRight');await attend(2);ok(await carte()===2,`${w} : flèche droite du clavier : carte 3`);
  await p.keyboard.press('ArrowRight');await attend(3);ok(await carte()===3&&!(await vis('#fam .fnv')),`${w} : dernière carte, plus de flèche « suivante »`);
  ok(p.errs.length===0,`${w} : aucune erreur JavaScript`);await ctx.close()}
 await b.close();console.log(ech?ech+' ÉCHEC(S)':'FAMILLE (ORDINATEUR) : tout est OK');process.exit(ech?1:0)})();
