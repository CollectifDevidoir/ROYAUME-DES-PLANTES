// Jokers : 5 par jour, vraiment. On vérifie qu'ils ne reviennent pas à 5 en quittant puis en revenant :
// rechargement de la page, deuxième onglet (ou appli de l'écran d'accueil) resté ouvert avec un état ancien,
// fusion avec la sauvegarde du compte (autre appareil), et retour à 5 seulement le lendemain.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_jokers.js
const {chromium}=require('playwright');const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const o=await open({browser:b,w:390,h:844,touch:true,seed:true}),p=o.p;
  const pret=async pg=>{await pg.waitForFunction(()=>typeof jkS==='function');await pg.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});await pg.waitForTimeout(1700)};
  const reste=pg=>pg.evaluate(()=>5-jkS().n);
  const joker=async pg=>{await lance(pg,'typed');await pg.click('#jk');await pg.waitForTimeout(150);await pg.fill('#q-input','x');await pg.click('#q-form button:not(#jk)');await pg.waitForTimeout(300)};
  await joker(p);await joker(p);ok(await reste(p)===3,'2 jokers utilisés : il en reste 3');
  await p.reload();await pret(p);ok(await reste(p)===3,'page rechargée : toujours 3');
  // deuxième onglet ouvert avant, resté en arrière-plan avec 5 jokers en mémoire
  const p2=await o.ctx.newPage();await p2.goto(p.url());await pret(p2);
  await joker(p);ok(await reste(p)===2,'3e joker dans le premier onglet');
  await p2.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
  ok(await reste(p2)===2,'l\'autre onglet, au retour, voit 2 jokers (pas 5)');
  await p2.evaluate(()=>{save()});await p.reload();await pret(p);ok(await reste(p)===2,'l\'autre onglet qui enregistre n\'efface pas les jokers utilisés');
  // compte : un autre appareil a utilisé 4 jokers aujourd'hui
  ok(await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(st));d.jk={d:today(),n:4};return 5-fusion(st,d).jk.n})===1,'fusion avec le compte : on garde le plus grand nombre de jokers utilisés du jour');
  ok(await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(st));d.jk={d:'2001-01-01',n:5};return fusion(st,d).jk.n})===3,'un ancien jour du compte ne compte pas');
  // le lendemain : 5 jokers
  await p.evaluate(()=>{st.jk.d='2001-01-01';save()});ok(await reste(p)===5,'nouveau jour : 5 jokers');
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'JOKERS : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
