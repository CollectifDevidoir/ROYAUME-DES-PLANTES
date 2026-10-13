// Les 15 rangs : seuils croissants jusqu'à 700, une icône par rang, animation de passage de rang ;
// profil : toucher une icône affiche son nom et le nombre d'espèces à acquérir, le rang actuel ramène au prochain rang.
// Usage : node outils/controle_rangs.js
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h,t] of [[390,844,true],[1440,900,false]]){const {ctx,p}=await open({browser:b,w,h,touch:t,seed:true,file:process.env.F});const tag=w+'×'+h;
  const r=await p.evaluate(()=>({n:R.length,ri:RI.length,top:R[R.length-1][0],monte:R.every((x,i)=>!i||x[0]>R[i-1][0]),noms:R.map(x=>x[1])}));
  ok(r.n===15&&r.ri===15&&r.top===700&&r.monte,`${tag} : 15 rangs, 15 icônes, seuils croissants jusqu'à ${r.top}`);
  ok(r.noms[5]==='Baliveau'&&r.noms[9]==='Arbre remarquable'&&r.noms[12]==='Gardien de la forêt'&&r.noms[13]==='Esprit sylvestre','${tag} : Baliveau 6e, Arbre remarquable 10e, Gardien 13e, Esprit sylvestre 14e'.replace('${tag}',tag));
  // un joueur à 100 espèces acquises : rang Jeune arbre (85), prochain Arbre (125)
  await p.evaluate(()=>{S.slice(0,100).forEach(x=>st.sp[x[0]]={b:4,s:6,e:0,d:0});save();stats()});
  ok(await p.evaluate(()=>R[rk()][1]==='Jeune arbre'),tag+' : 100 espèces acquises, rang Jeune arbre');
  await p.evaluate(()=>openProfil());await p.waitForTimeout(1200);
  const txt=()=>p.evaluate(()=>document.querySelector('#ami .rgn').textContent);const d0=await txt();
  ok(/Prochain rang : Arbre à 125/.test(d0),tag+' : sous la frise, le prochain rang ('+d0.trim()+')');
  ok(await p.evaluate(()=>document.querySelectorAll('#ami .rgs li[data-i]').length===15),tag+' : 15 icônes dans la frise du profil');
  await p.click('#ami .rgs li[data-i="13"]');let x=await txt();
  ok(/Esprit sylvestre/.test(x)&&/580 espèces/.test(x)&&/encore 480/.test(x),tag+' : icône d\'un rang à venir : '+x.trim());
  ok(await p.evaluate(()=>document.querySelector('#ami .rgs li[data-i="13"]').classList.contains('vu')),tag+' : l\'icône touchée est entourée');
  await p.click('#ami .rgs li[data-i="2"]');x=await txt();ok(/Pousse/.test(x)&&/atteint/.test(x),tag+' : icône d\'un rang passé : '+x.trim());
  await p.click('#ami .rgs li[data-i="6"]');x=await txt();ok(x===d0&&!(await p.evaluate(()=>!!document.querySelector('#ami .rgs li.vu'))),tag+' : le rang actuel ramène au prochain rang');
  await p.focus('#ami .rgs li[data-i="14"]');await p.keyboard.press('Enter');x=await txt();ok(/Maître du royaume/.test(x)&&/700/.test(x),tag+' : au clavier aussi');
  ok(await p.evaluate(()=>{const a=rankHue(0),z=rankHue(R.length-1);return a===125&&z===46}),tag+' : teinte des animations du premier au dernier rang (125 → 46)');
  ok(p.errs.length===0,tag+' : aucune erreur JavaScript '+JSON.stringify(p.errs));await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'RANGS : tout est OK');process.exit(ech?1:0)})();
