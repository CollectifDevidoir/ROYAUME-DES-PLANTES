// Deux gestes qui doivent rester fluides (téléphone, doigt simulé) :
// 1. Ouverture : tant que l'accueil couvre l'écran, glisser le doigt ne fait pas défiler la page dessous ; la première question
//    s'affiche sans animation d'entrée ; les suivantes gardent la leur.
// 2. Famille du jour : un glissement franc vers la gauche fait avancer la carte d'un seul mouvement, sans retour en arrière.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_fluidite.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const HABITUE=JSON.stringify({sp:{'Quercus robur':{b:2,s:2,e:0,d:0,c:0}},day:{},m:{},hist:{}});
// glissement du doigt (CDP) de (x0,y0) à (x1,y1) en n étapes de 16 ms
const glisse=async(cdp,x0,y0,x1,y1,n)=>{const pt=(x,y)=>[{x,y,id:1,radiusX:4,radiusY:4,force:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(x0,y0)});
  for(let k=1;k<=n;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(x0+(x1-x0)*k/n,y0+(y1-y0)*k/n)});await new Promise(r=>setTimeout(r,16))}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
(async()=>{
  // 1. ouverture : le banc d'essai a déjà fait entrer dans l'appli ; on remet un accueil au-dessus de la page, comme à l'ouverture
  {const {b,ctx,p}=await open({w:390,h:844,touch:true,state:HABITUE,file:process.env.F});
    await p.evaluate(()=>{window.scrollTo(0,0)});
    const cdp=await ctx.newCDPSession(p);
    const sp=await p.evaluate(()=>{const d=document.createElement('div');d.id='splash';d.style.cssText='';document.body.append(d);return getComputedStyle(document.documentElement).overflowY});
    await glisse(cdp,195,600,195,150,12);await p.waitForTimeout(400);
    const y=await p.evaluate(()=>scrollY);
    ok(sp==='hidden'&&y===0,`accueil affiché : la page dessous ne défile pas au doigt (overflow ${sp}, défilement ${y} px)`);
    await p.evaluate(()=>document.getElementById('splash').remove());
    ok(await p.evaluate(()=>getComputedStyle(document.documentElement).overflowY!=='hidden'),'accueil fermé : la page défile de nouveau normalement');
    const q1=await p.evaluate(()=>({anim:$('qc').classList.contains('in'),calme:$('opts').classList.contains('calme')}));
    ok(!q1.anim&&q1.calme,'première question de la séance : affichée sans animation d’entrée');
    await lance(p,'mcq');const q2=await p.evaluate(()=>({anim:$('qc').classList.contains('in'),calme:$('opts').classList.contains('calme')}));
    ok(q2.anim&&!q2.calme,'questions suivantes : animation d’entrée conservée');
    ok(p.errs.length===0,'ouverture : aucune erreur JavaScript '+JSON.stringify(p.errs));await b.close()}
  // 2. Famille du jour : position horizontale relevée à chaque image pendant et après un glissement franc
  for(const [dx,lbl,att,dep] of [[-150,'glissement franc (150 px)',1,0],[-260,'long glissement (260 px)',1,0],[-30,'petit glissement (30 px)',0,0],[150,'glissement vers la droite depuis la carte 2',0,1]]){
    const {b,ctx,p}=await open({w:390,h:844,touch:true,state:HABITUE,file:process.env.F});
    await p.evaluate(()=>$('fday').click());await p.waitForTimeout(900);
    if(dep){await p.evaluate(d=>{const z=$('fz');z.style.scrollSnapType='none';z.scrollLeft=d*(z.clientWidth+10);z.style.scrollSnapType=''},dep);await p.waitForTimeout(300)}
    const cdp=await ctx.newCDPSession(p);
    await p.evaluate(()=>{window.__x=[];const z=$('fz'),f=()=>{window.__x.push(Math.round(z.scrollLeft));if(window.__x.length<160)requestAnimationFrame(f)};requestAnimationFrame(f)});
    await glisse(cdp,300,420,300+dx,424,8);await p.waitForTimeout(1800);
    const r=await p.evaluate(()=>{const z=$('fz');return{x:window.__x,fin:z.scrollLeft,w:z.clientWidth+10}});
    // sens attendu du mouvement : vers la carte visée ; tout pas dans l'autre sens est un retour en arrière
    const sens=Math.sign(att*r.w-(dep*r.w))||Math.sign(-dx);let recul=0;for(let k=1;k<r.x.length;k++){const v=(r.x[k]-r.x[k-1])*sens;if(v<-1&&!(att===dep))recul-=v}
    ok(Math.abs(r.fin-att*r.w)<2,`Famille du jour, ${lbl} : arrive sur la carte ${att+1} (position ${Math.round(r.fin)}, attendu ${att*r.w})`);
    if(att!==dep)ok(recul<=2,`Famille du jour, ${lbl} : un seul mouvement, sans retour en arrière (recul cumulé ${recul} px)`);
    ok(p.errs.length===0,'Famille du jour : aucune erreur JavaScript '+JSON.stringify(p.errs));await b.close()}
  console.log(ech?ech+' ÉCHEC(S)':'FLUIDITÉ : tout est OK');process.exit(ech?1:0)})();
