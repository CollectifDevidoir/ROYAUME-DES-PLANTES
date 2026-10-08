// Étape 10.4 : recette complète sur les 7 tailles d'écran de référence (Playwright).
// Usage : node outils/recette.js [index.html] [dossier_captures]
// Pour chaque taille : accueil, QCM, réponse et correction, saisie, 4 photos, Herbier, Progrès,
// Réglages, Aide. Contrôles : aucune erreur JavaScript, aucun défilement horizontal de la page,
// boutons principaux visibles et entièrement dans l'écran. Le hasard est figé (graine fixe)
// pour que deux passages donnent les mêmes captures et puissent être comparés.
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const {open}=require('./banc_essai.js');
const lance=require('./lance_exercice.js');
const FICHIER=process.argv[2]||path.resolve(__dirname,'..','index.html');
const DOS=process.argv[3]||null;
const TAILLES=[[360,640],[375,667],[390,844],[412,915],[768,1024],[1366,800],[1920,1080]];
let echecs=0;
const ok=(c,m)=>{if(!c)echecs++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
if(DOS)fs.mkdirSync(DOS,{recursive:true});
for(const [w,h] of TAILLES){
  const tag=w+'x'+h, touch=w<1000;
  const {ctx,p}=await open({browser:b,w,h,touch,seed:true,file:FICHIER});
  const cap=async n=>{await p.waitForTimeout(450);if(DOS)await p.screenshot({path:path.join(DOS,tag+'-'+n+'.png')})};
  const pasDeDebord=async n=>ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tag+' '+n+' : pas de défilement horizontal');
  const visible=async(sel,n)=>ok(await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1},sel),tag+' '+n+' : visible et dans l’écran');
  await cap('accueil');await pasDeDebord('accueil');
  ok(await lance(p,'mcq'),tag+' QCM affiché');await cap('qcm');await pasDeDebord('QCM');await visible('#opts button','QCM, première réponse');
  await p.click('#opts button');await p.waitForTimeout(700);await cap('correction');await pasDeDebord('correction');
  ok(await p.evaluate(()=>{const f=$('sh');return !!f&&/À retenir/i.test(f.textContent)&&f.querySelectorAll('li').length>=3}),tag+' fiche de correction avec les 3 clés');
  await visible('#shn','correction, bouton « Plante suivante »');
  ok(await lance(p,'typed'),tag+' saisie affichée');await cap('saisie');await pasDeDebord('saisie');await visible('#q-input','saisie, champ de réponse');
  ok(await lance(p,'pv'),tag+' 4 photos affichées');await cap('4photos');await pasDeDebord('4 photos');
  await p.click('.tabs button[data-t=herb]');await cap('herbier');await pasDeDebord('herbier');await visible('#herb-search','herbier, recherche');
  await p.click('.tabs button[data-t=pro]');await cap('progres');await pasDeDebord('progrès');
  await p.click('.tabs button[data-t=quiz]');await p.waitForTimeout(300);
  await p.click('#ring');await cap('reglages');await pasDeDebord('réglages');
  ok(await p.evaluate(()=>$('set').open),tag+' réglages ouverts');await p.click('#set-x');await p.waitForTimeout(250);
  await p.click('#help');await cap('aide');await pasDeDebord('aide');
  ok(p.errs.length===0,tag+' aucune erreur JavaScript '+(p.errs.length?JSON.stringify(p.errs.slice(0,3)):''));
  await ctx.close();
}
await b.close();
console.log(echecs?echecs+' ÉCHEC(S)':'RECETTE : tout est OK');
process.exit(echecs?1:0);
})();
