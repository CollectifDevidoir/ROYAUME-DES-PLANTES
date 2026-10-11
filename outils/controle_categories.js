// Modes de jeu : « Classique » garde sa taille et s'ouvre en menu déroulant (Classique + 5 catégories) ;
// Famille du jour et « Rejouer mes erreurs » restent visibles à côté. De 320 à 2560 px.
// Usage : node outils/controle_categories.js [dossier_captures]   (variable F = autre fichier html)
const {chromium}=require('playwright');const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};const DOS=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h] of [[320,568],[360,640],[390,844],[768,1024],[1024,700],[1440,780],[2560,1080]]){
  const {ctx,p}=await open({browser:b,w,h,touch:w<900,seed:true,file:process.env.F});
  const ferme=await p.evaluate(()=>getComputedStyle($('cats')).display==='none'&&!!$('fday')&&getComputedStyle($('fday')).display!=='none');
  ok(ferme,`${w}×${h} : menu fermé au départ, Famille du jour visible`);
  await p.click('#cAll');await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#cats button')],R=bs.map(x=>x.getBoundingClientRect());
    return{n:bs.length,vis:getComputedStyle($('cats')).display!=='none',trop:bs.filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent),bord:R.every(x=>x.right<=innerWidth&&x.left>=0),ico:bs.every(x=>x.querySelector('.cti svg'))}});
  ok(r.vis&&r.n===6&&r.bord,`${w}×${h} : menu ouvert, Classique + 5 catégories dans l'écran`);
  ok(r.trop.length===0&&r.ico,`${w}×${h} : aucun nom tronqué, une illustration par mode`);
  if(DOS)await p.screenshot({path:`${DOS}/modes-${w}.png`});
  await p.evaluate(()=>document.querySelectorAll('#cats button')[2].click());await p.waitForTimeout(500);
  const s=await p.evaluate(()=>({mode,txt:$('cAll').textContent,ferme:getComputedStyle($('cats')).display==='none'}));
  ok(s.mode==='arbuste'&&/Arbustes/.test(s.txt)&&s.ferme,`${w}×${h} : choisir « Arbustes » ferme le menu et l'affiche dans le bouton`);
  await p.click('#cAll');await p.waitForTimeout(200);await p.mouse.click(5,h-5);await p.waitForTimeout(200);
  ok(await p.evaluate(()=>getComputedStyle($('cats')).display==='none'),`${w}×${h} : un clic ailleurs ferme le menu`);
  ok(p.errs.length===0,`${w}×${h} : aucune erreur JavaScript`);await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'MODES : tout est OK');process.exit(ech?1:0)})();
