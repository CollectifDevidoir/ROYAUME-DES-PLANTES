// Étape 4 : contrôle du volet Réglages (Playwright). Usage : node outils/controle_reglages.js [index.html]
// Variable CHROMIUM facultative : chemin d'un Chromium local.
const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
const ctx=await b.newContext({viewport:{width:360,height:640},deviceScaleFactor:2});
await ctx.route(/^https?:/,r=>r.abort());
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__vib=[];navigator.vibrate=v=>{window.__vib.push(v);return true}});
await p.goto('file://'+require('path').resolve(process.argv[2]||'index.html'));await p.waitForTimeout(600);
await p.click('#splash');await p.waitForTimeout(1700);
ok(await p.textContent('#gt')==='/ 40','anneau : objectif 40 par défaut');
await p.click('#ring');await p.waitForTimeout(400);
ok(await p.evaluate(()=>$('set').open),"toucher l'anneau ouvre les réglages");

ok(await p.evaluate(()=>{const r=$('set-g');return r.type==='range'&&r.min==='10'&&r.max==='100'&&r.step==='10'&&r.value==='40'}),'objectif : curseur de 10 à 100 par dizaine, sur 40');
ok((await p.$$eval('.tks span',b=>b.map(x=>x.textContent).join(',')))==='10,20,30,40,50,60,70,80,90,100','frise graduée de 10 à 100');
await p.focus('#set-g');await p.keyboard.press('ArrowRight');
ok((await p.textContent('#gt'))==='/ 50'&&(await p.textContent('#set-gv'))==='50','flèche droite : 50 (anneau et valeur affichée suivent)');
const bx=await p.$eval('#set-g',e=>{const r=e.getBoundingClientRect();return [r.left,r.width,r.top+r.height/2]});
await p.mouse.click(bx[0]+14+(bx[1]-28)*(10/90),bx[2]);await p.waitForTimeout(100);
ok(await p.textContent('#gt')==='/ 20','objectif 20 : anneau mis à jour');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('quizplantes.v1')).set.goal)===20,'objectif mémorisé');
await p.click('#set-vib');
ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('quizplantes.v1')).set.vib)===false,'vibration désactivée et mémorisée');
await p.evaluate(()=>{window.__vib=[];vib(15)});ok((await p.evaluate(()=>window.__vib.length))===0,'aucune vibration quand désactivée');
await p.click('#set-vib');await p.evaluate(()=>{window.__vib=[];vib(15)});ok((await p.evaluate(()=>window.__vib.length))===1,'vibration réactivée');
await p.click('#set-x');await p.waitForTimeout(200);
await p.click('#help');await p.waitForTimeout(300);
const ht=await p.textContent('#dbody');ok(ht.includes('20 exercices par jour')&&!ht.includes('50'),"aide : lit l'objectif (20)");
ok(await p.isVisible('.lvf'),'aide : frise des niveaux visible');
const lvb=await p.evaluate(()=>{const r=document.querySelector('.lvb').getBoundingClientRect();return r.right<=innerWidth});ok(lvb,'frise : tient dans 360 px');

await p.click('#dx');
await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(400);
ok(!(await p.$('#pro-export'))&&!(await p.$('#pro-reset')),'Progrès : plus de carte Sauvegarde ni de bouton Effacer');
ok((await p.textContent('#pro')).includes('/ 20 exercices'),'Progrès : objectif lu');
await p.evaluate(()=>document.getElementById('pro-set').scrollIntoView());
ok(!(await p.$('#pro-help'))&&!(await p.textContent('#pro')).includes('Comment ça marche'),'Progrès : plus de ligne « Comment ça marche »');
ok(!(await p.textContent('#pro')).includes('Collection'),'Progrès : plus de carte Collection');
await p.click('#pro-set');await p.waitForTimeout(300);ok(await p.evaluate(()=>$('set').open),'Progrès > Réglages ouvre le volet');
// donner un peu de progression
await p.evaluate(()=>{st.sp['Acer campestre']={b:4,s:5,e:1,d:0};save();stats()});
const before=await p.evaluate(()=>localStorage.getItem('quizplantes.v1'));
await p.click('#set-save');await p.click('#set-paste');
for(const [t,lbl] of [['n importe quoi','texte illisible'],['{"a":1}','sans progression'],['{"sp":{"X":{"b":9,"s":1,"e":0}}}','niveau impossible'],['{"sp":{},"hist":{"2026-01-01":"x"}}','historique abîmé'],['[1,2]','tableau']]){
  await p.fill('#set-in',t);await p.click('#set-go');const m=await p.textContent('#set-msg');
  ok(m.length>10&&(await p.evaluate(()=>localStorage.getItem('quizplantes.v1')))===before,'import refusé ('+lbl+') : « '+m+' »');}

const good=JSON.stringify({sp:{'Fagus sylvatica':{b:5,s:9,e:0,d:0},'Acer campestre':{b:4,s:5,e:1,d:0}},hist:{},m:{}});
await p.fill('#set-in',good);await p.click('#set-go');await p.waitForTimeout(200);
ok(await p.evaluate(()=>known()===2&&st.set.goal===20),'import valide : 2 acquises, réglages conservés');
await p.click('#set-reset');
await p.click('#set-no');ok(await p.evaluate(()=>known()===2),'Annuler ne change rien');
await p.click('#set-reset');await p.click('#set-yes');await p.waitForTimeout(200);
ok(await p.evaluate(()=>known()===0&&st.set.goal===20),'réinitialisation : progression effacée, réglages gardés');
await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(!(await p.evaluate(()=>$('set').open)),'Échap ferme le volet');
// zones tactiles du volet
await p.click('#ring');await p.waitForTimeout(300);
const small=await p.evaluate(()=>[...document.querySelectorAll('#set button')].map(b=>{const r=b.getBoundingClientRect(),a=getComputedStyle(b,'::after');return{t:b.id||b.textContent,w:r.width,h:r.height,ai:a.content!=='none'?a.inset:''}}));
console.log(JSON.stringify(small));
// clavier sur l'anneau
await p.keyboard.press('Escape');await p.focus('#ring');await p.keyboard.press('Enter');await p.waitForTimeout(200);ok(await p.evaluate(()=>$('set').open),'Entrée sur l\'anneau ouvre les réglages');
// migration : ancien état sans réglages
await p.evaluate(()=>localStorage.setItem('quizplantes.v1',JSON.stringify({sp:{'Acer campestre':{b:4,s:5,e:1,d:0}},hist:{},m:{}})));await p.reload();await p.waitForTimeout(500);
ok(await p.evaluate(()=>st.set.goal===40&&st.set.vib===true&&known()===1),'ancienne progression : objectif 40 et vibration ajoutés, progression intacte');
ok(errs.length===0,'aucune erreur JavaScript '+errs.join(' | '));
await b.close()})();
