// Profil et amis : à la première ouverture sur un appareil, le médaillon de rang pulse (pastille et halo) jusqu'à ce que le profil ait
// été ouvert une fois ; ensuite plus jamais, même après un rechargement. Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_medaillon.js
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const anim=p=>p.evaluate(()=>{const m=document.getElementById('medal'),a=getComputedStyle(m.querySelector('.mdb')),h=getComputedStyle(m,'::after');return{nv:m.classList.contains('nv'),badge:a.animationName+' '+a.animationIterationCount,halo:h.animationName+' '+h.animationIterationCount}});
(async()=>{
  for(const [w,h,touch,lbl] of [[375,667,true,'téléphone'],[1280,800,false,'ordinateur']]){
    let {b,p}=await open({w,h,touch,http:true,file:process.env.F});
    let a=await anim(p);
    ok(a.nv&&/mdb infinite/.test(a.badge)&&/mdh infinite/.test(a.halo),`${lbl} : premier lancement, la pastille profil et son halo pulsent sans s'arrêter (${a.badge} ; ${a.halo})`);
    await p.click('#medal');await p.waitForTimeout(500);
    a=await anim(p);ok(!a.nv&&a.badge.startsWith('none')&&a.halo.startsWith('none'),`${lbl} : après ouverture du profil, plus d'animation`);
    ok(!!(await p.evaluate(()=>localStorage.getItem('qp.prf'))),`${lbl} : l'ouverture est retenue sur l'appareil`);
    await p.keyboard.press('Escape');await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});await p.waitForTimeout(1500);
    a=await anim(p);ok(!a.nv,`${lbl} : après rechargement, ne pulse plus`);
    ok(p.errs.length===0,`${lbl} : aucune erreur JavaScript `+JSON.stringify(p.errs));await b.close()}
  // autre route d'accès (Progrès > Profil & Amis) : arrête aussi l'animation
  {const {b,p}=await open({w:375,h:667,touch:true,http:true,file:process.env.F});
    await p.click('[data-t=pro]');await p.waitForTimeout(300);await p.click('#pro-prf');await p.waitForTimeout(400);
    ok(!(await anim(p)).nv,'ouvert par Progrès > Profil & Amis : ne pulse plus non plus');await b.close()}
  console.log(ech?ech+' ÉCHEC(S)':'MÉDAILLON : tout est OK');process.exit(ech?1:0)})();
