// Lot 2, point 3 : tuiles de catégories — une seule ligne, aucun nom tronqué, tuile active en vert, de 320 à 2560 px.
// Usage : node outils/controle_categories.js [dossier_captures]   (variable F = autre fichier html)
const {chromium}=require('playwright');const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};const DOS=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h] of [[320,568],[360,640],[390,844],[768,1024],[1024,700],[1440,780],[2560,1080]]){
  const {ctx,p}=await open({browser:b,w,h,touch:w<900,seed:true,file:process.env.F});
  await p.evaluate(()=>document.querySelectorAll('#cats button')[3].click());await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#cats button')],R=bs.map(x=>x.getBoundingClientRect());
    return{n:bs.length,ligne:R.every(x=>Math.abs(x.top-R[0].top)<1),trop:bs.filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent),h:Math.round(R[0].height),
      act:getComputedStyle(bs[3]).backgroundImage.includes('gradient')&&getComputedStyle(bs[3]).color==='rgb(255, 255, 255)',
      ico:getComputedStyle(bs[0].querySelector('.cti')).display!=='none',bord:R[R.length-1].right<=innerWidth}});
  ok(r.n===5&&r.ligne&&r.bord,`${w}×${h} : 5 tuiles sur une seule ligne, dans l'écran`);
  ok(r.trop.length===0,`${w}×${h} : aucun nom tronqué ${r.trop.length?JSON.stringify(r.trop):''}`);
  ok(r.act,`${w}×${h} : tuile active en vert (comme « Classique »)`);
  ok(r.ico===(w>=700),`${w}×${h} : illustration ${w>=700?'affichée':'masquée'} (hauteur ${r.h} px)`);
  if(DOS)await p.screenshot({path:`${DOS}/cats-${w}.png`,clip:{x:0,y:0,width:w,height:Math.min(h,w<700?280:240)}});
  ok(p.errs.length===0,`${w}×${h} : aucune erreur JavaScript`);await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'CATÉGORIES : tout est OK');process.exit(ech?1:0)})();
