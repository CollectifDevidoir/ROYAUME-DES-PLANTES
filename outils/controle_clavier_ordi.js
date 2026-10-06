// Étape 7 : ordinateur (deux colonnes) et parcours complet au clavier. Usage : node outils/controle_clavier_ordi.js
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
(async()=>{
const {b,p}=await open({w:1366,h:800});
const R=s=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom}},s);
const fv=()=>p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const c=getComputedStyle(e);return {id:e.id||e.className||e.tagName,ring:c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>=2}});
// 7.1 / 7.2
await lance(p,'mcq');let pic=await R('#pic'),op=await R('#opts'),m=await R('main');
ok(op.l>pic.r,'7.1 : réponses à droite de la photo');
ok(m.l<150&&1366-m.r<150,'7.1 : pas de grand vide latéral à 1366 px (marges '+Math.round(m.l)+' / '+Math.round(1366-m.r)+' px)');
ok(pic.b-pic.t<=800*.5+1,'7.2 : photo ≤ 50 % de la hauteur ('+Math.round(pic.b-pic.t)+' px)');
ok(pic.b<=800&&op.b<=800,'7.2 : photo et 4 réponses visibles sans défilement (bas '+Math.round(Math.max(pic.b,op.b))+' px)');
// 7.5 : touche 2 pour répondre, focus sur « Question suivante »
await p.keyboard.press('2');await p.waitForTimeout(900);
const sh=await R('#sh');pic=await R('#pic');
ok(sh.l>=pic.r&&sh.t<pic.b,'7.3 : correction affichée à côté de la photo');
ok(await p.evaluate(()=>$('veil').style.clipPath.startsWith('path')),'7.3 : photo nette pendant la lecture des clés');
let f=await fv();ok(f&&f.id==='shn'&&f.ring,'7.5 : après la réponse, focus visible sur « Question suivante » ('+JSON.stringify(f)+')');
ok(await p.evaluate(()=>$('shr').getAttribute('aria-live')==='polite'&&$('shr').textContent.length>5),'7.5 : correction annoncée (aria-live)');
// Plus de détails au clavier, galerie et agrandissement
await p.keyboard.press('Shift+Tab');f=await fv();ok(f&&f.id==='sh-more','7.5 : Maj+Tab atteint « Plus de détails »');
await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelectorAll('#sh-dt .gal img').length>=3,null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);
const g=await p.evaluate(()=>[...document.querySelectorAll('#sh-dt .gal img')].map(i=>Math.round(i.getBoundingClientRect().width)));
ok(g.length>=3&&g.length<=4&&g.every(w=>w>=150),'7.4 : galerie de '+g.length+' photos larges ('+g.join(', ')+' px)');
await p.focus('#sh-dt .gal img');f=await fv();ok(f&&f.ring,'7.5 : vignette atteignable, focus visible');
await p.keyboard.press('Enter');await p.waitForTimeout(300);ok(await p.evaluate(()=>!$('zm').hidden),'7.4 : Entrée agrandit la photo');
await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(await p.evaluate(()=>$('zm').hidden),'Échap referme la photo');
await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(await p.evaluate(()=>!$('sh').classList.contains('full')),'Échap replie les détails');
await p.focus('#shn');await p.keyboard.press('Enter');await p.waitForTimeout(400);
// écriture au clavier
await lance(p,'typed');f=await fv();ok(f&&f.id==='q-input','7.5 : écriture : la saisie a le focus');
pic=await R('#pic');const qi=await R('#q-input');ok(qi.l>pic.r,'écriture : barre de réponse à droite de la photo');
await p.keyboard.type('Abcd efgh');await p.keyboard.press('Enter');await p.waitForTimeout(900);f=await fv();ok(f&&f.id==='shn','7.5 : Entrée valide la saisie, focus sur « Question suivante »');
await p.keyboard.press('Enter');await p.waitForTimeout(500);
// 4 photos : touches 1 à 4
await lance(p,'pv');await p.keyboard.press('3');await p.waitForTimeout(700);ok(await p.evaluate(()=>done&&!$('sh').hidden),'7.5 : 4 photos : la touche 3 répond');
await p.keyboard.press('Enter');await p.waitForTimeout(500);
await p.evaluate(()=>{st.sp['Acer campestre']={b:2,s:2,e:0,d:0};st.ho.arbre=true;save()});
// Herbier au clavier
let n=0;while(n<60){await p.keyboard.press('Tab');n++;const t=await p.evaluate(()=>document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.t);if(t==='herb')break}
f=await fv();ok(f&&f.ring,'7.5 : onglet Herbier atteint au clavier ('+n+' tabulations), focus visible');
await p.keyboard.press('Enter');await p.waitForTimeout(400);
const tile=await p.$('.hc[open] .pk[data-l]');
if(tile){await tile.focus();f=await fv();ok(f&&f.ring,'7.5 : vignette d\'Herbier atteignable, focus visible');await p.keyboard.press('Enter');await p.waitForTimeout(500);ok(await p.evaluate(()=>$('fch').open),'7.5 : Entrée ouvre la fiche');await p.keyboard.press('Escape');}
else ok(false,'vignette d\'Herbier introuvable');
ok(p.errs.length===0,'aucune erreur JavaScript '+p.errs.join(' | '));
await b.close()})();
