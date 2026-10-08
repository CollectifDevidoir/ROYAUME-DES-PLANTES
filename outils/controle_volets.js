// Volets : mêmes gestes partout (Réglages, Profil, Aide, Famille du jour, fiche d'une plante, photo agrandie).
// Glisser vers le bas ferme (depuis le contenu aussi, quand il est en haut) ; un petit glissement ne ferme pas ;
// feuilleter les cartes, faire défiler un contenu descendu ou régler un curseur ne ferme pas ; croix et toucher à côté ferment.
// Usage : node outils/controle_volets.js [largeur hauteur]   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const W=+process.argv[2]||390,H=+process.argv[3]||844;
(async()=>{const {b,p}=await open({w:W,h:H,touch:true,file:process.env.F});const c=await p.context().newCDPSession(p);
  const drag=async(x0,y0,x1,y1,n=10)=>{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0}]});
    for(let k=1;k<=n;k++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*k/n,y:y0+(y1-y0)*k/n}]});await p.waitForTimeout(16)}
    await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(450)};
  const haut=sel=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left+r.width/2,r.top+70]},sel);
  const ouvert=sel=>p.evaluate(s=>{const d=document.querySelector(s);return d.tagName==='DIALOG'?d.open:!d.hidden},sel);
  const V=[['Réglages','#set','#set',()=>openSettings(),'#set-x'],['Profil','#prf','#prf',()=>openProfil(),'#prf-x'],['Aide','#dlg','#dlg',()=>$('help').click(),'#dlg-x'],
           ['Famille du jour','#fam','#fam .fcard',()=>openFamily(FE()[0]),'#famx']];
  for(const [n,sel,zone,f,x] of V){
    await p.evaluate(f);await p.waitForTimeout(500);const [cx,cy]=await haut(zone);
    ok(await p.evaluate(s=>!!document.querySelector(s+' .bsg')||s==='#fam',sel),n+' : poignée visible (ou cartes plein écran)');
    await drag(cx,cy,cx,cy+40,4);ok(await ouvert(sel),n+' : petit glissement : reste ouvert, revient en place');
    ok(await p.evaluate(s=>document.querySelector(s).style.transform==='',sel),n+' : aucun décalage résiduel');
    await drag(cx,cy,cx,cy+280);ok(!(await ouvert(sel)),n+' : glisser vers le bas depuis le contenu : fermé');
    await p.evaluate(f);await p.waitForTimeout(400);await p.click(x);await p.waitForTimeout(300);ok(!(await ouvert(sel)),n+' : la croix ferme');
  }
  // Famille du jour : feuilleter les cartes ne ferme pas
  await p.evaluate(()=>openFamily(FE()[0]));await p.waitForTimeout(500);{const [cx,cy]=await haut('#fam .fcard');await drag(cx+120,cy+100,cx-140,cy+120);}
  ok(await ouvert('#fam')&&await p.evaluate(()=>$('fz').scrollLeft>0),'Famille du jour : glisser à gauche tourne la carte, sans fermer');await p.evaluate(()=>$('fam').close());
  // Aide : contenu descendu → glisser vers le bas fait remonter le contenu, sans fermer
  await p.evaluate(()=>$('help').click());await p.waitForTimeout(500);await p.evaluate(()=>{$('dlg').scrollTop=300});await p.waitForTimeout(100);
  {const [cx,cy]=await haut('#dlg');await drag(cx,cy+150,cx,cy+400);}ok(await ouvert('#dlg'),'Aide descendue : glisser vers le bas fait défiler, ne ferme pas');
  // toucher à côté du volet
  await p.evaluate(()=>{$('dlg').scrollTop=0});await p.mouse.click(W/2,8);await p.waitForTimeout(300);ok(!(await ouvert('#dlg')),'Aide : toucher à côté ferme');
  // Réglages : régler le curseur ne ferme pas
  await p.evaluate(()=>openSettings());await p.waitForTimeout(400);
  {const r=await p.evaluate(()=>{const e=$('set-g').getBoundingClientRect();return [e.left+e.width/2,e.top+e.height/2]});await drag(r[0],r[1],r[0]+10,r[1]+150);}
  ok(await ouvert('#set'),'Réglages : glisser sur le curseur ne ferme pas');await p.evaluate(()=>$('set').close());
  // fiche d'une plante (depuis l'herbier)
  await p.evaluate(()=>openSheet(S[0]));await p.waitForTimeout(800);ok(await ouvert('#fch')&&await p.isVisible('#fch .bsg'),'fiche d\'une plante : ouverte, poignée visible');
  {const [cx,cy]=await haut('#fch');await drag(cx,cy,cx,cy+280);}ok(!(await ouvert('#fch')),'fiche d\'une plante : glisser vers le bas ferme');
  // photo agrandie : croix visible, toucher ferme
  await lance(p,'mcq');await p.click('#opts button');await p.waitForTimeout(900);
  await p.evaluate(()=>document.querySelector('#pic img').click());await p.waitForTimeout(300);
  ok(await ouvert('#zm')&&await p.isVisible('#zm .zmx'),'photo agrandie : croix visible');
  await p.click('#zm .zmx');await p.waitForTimeout(200);ok(!(await ouvert('#zm')),'photo agrandie : la croix ferme');
  await p.evaluate(()=>document.querySelector('#pic img').click());await p.waitForTimeout(300);
  {const [cx,cy]=[W/2,H/2];await drag(cx,cy-100,cx,cy+200);}ok(!(await ouvert('#zm')),'photo agrandie : glisser vers le bas ferme');
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'VOLETS : tout est OK');process.exit(ech?1:0)})();
