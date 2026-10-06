// Fiche de réponse : fond figé, flou, photo jamais recouverte. Usage : node outils/controle_fige.js [largeur hauteur] (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
const W=+process.argv[2]||360,H=+process.argv[3]||640;
(async()=>{const {b,p}=await open({w:W,h:H,touch:true,file:process.env.F});
const st=()=>p.evaluate(()=>({y:scrollY,pic:Math.round($('pic').getBoundingClientRect().top),clip:$('veil').style.clipPath.slice(0,30),qc:$('qc').style.transform}));
const swipe=async(x,y0,y1,dx=0)=>{const c=await p.context().newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0}]});for(let k=1;k<=8;k++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/8,y:y0+(y1-y0)*k/8}]});await p.waitForTimeout(16)}await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(500)};
for(const ty of ['mcq','typed']){
  await lance(p,ty);
  if(ty==='typed'){await p.tap('#q-input');await p.fill('#q-input','Abcd efgh');await p.press('#q-input','Enter')}else await p.tap('#opts button');
  await p.waitForTimeout(1000);const s0=await st();
  ok(s0.clip.startsWith('path'),ty+' : flou percé autour de la photo');
  await p.mouse.move(W/2,40);await p.mouse.wheel(0,400);await p.waitForTimeout(300);let s=await st();ok(s.y===s0.y&&s.pic===s0.pic,ty+' : molette sur le fond sans effet ('+s0.y+'→'+s.y+')');
  await p.keyboard.press('PageDown');await p.keyboard.press('Space');await p.waitForTimeout(300);s=await st();ok(s.y===s0.y,ty+' : touches de défilement sans effet');
  await swipe(W/2,40,300);s=await st();ok(s.y===s0.y&&s.pic===s0.pic,ty+' : glisser sur le haut de l\'écran sans effet');
  await swipe(W-20,200,30);s=await st();ok(s.y===s0.y&&s.pic===s0.pic,ty+' : glisser vers le haut sur la photo sans effet');
  await swipe(W/2,s0.pic+80,s0.pic+80,-150);s=await st();ok(s.y===s0.y&&s.qc==='',ty+' : glissement latéral de la carte sans effet');
  const sb=await p.evaluate(()=>{const b=$('shb');return [b.scrollHeight>b.clientHeight,b.scrollTop]});
  const shTop=await p.evaluate(()=>Math.round($('sh').getBoundingClientRect().top));
  await swipe(W/2,shTop+200,shTop+60);const sb2=await p.evaluate(()=>$('shb').scrollTop);s=await st();
  ok(s.y===s0.y&&(!sb[0]||sb2>sb[1]),ty+' : la fiche défile ('+sb[1]+'→'+sb2+'), pas le fond');
  ok(s.clip===s0.clip,ty+' : le trou du flou reste aligné');
  await p.tap('#sh-more');await p.waitForTimeout(500);s=await st();ok(s.clip==='',ty+' : « Plus de détails » : fond entièrement flouté');
  await p.tap('#sh-more');await p.waitForTimeout(500);s=await st();ok(s.clip.startsWith('path'),ty+' : retour à mi-hauteur : photo de nouveau nette');
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.tabs')).visibility==='hidden'),ty+' : onglets retirés pendant la fiche');
  const r=await p.evaluate(()=>[Math.round($('pic').getBoundingClientRect().bottom),Math.round($('sh').getBoundingClientRect().top),Math.round($('sh').getBoundingClientRect().bottom),innerHeight]);
  ok(r[1]>=r[0]&&r[2]===r[3],ty+' : fiche sous la photo et jusqu\'en bas '+JSON.stringify(r));
  await p.tap('#shn');await p.waitForTimeout(600);
  ok(await p.evaluate(()=>getComputedStyle(document.querySelector('.tabs')).visibility==='visible'&&!document.body.classList.contains('hs')),ty+' : « Question suivante » : onglets de retour, fond libre');
}
await lance(p,'pv');await p.tap('#opts button');await p.waitForTimeout(1000);
let s=await st();ok(s.clip===''&&await p.evaluate(()=>getComputedStyle($('veil')).opacity==='1'),'4 photos : fond entièrement flouté');
await p.tap('#sh-more');await p.waitForTimeout(400);ok((await st()).clip==='','4 photos + détails : fond entièrement flouté');
// photos défilables : le carrousel reste utilisable fiche ouverte
await p.tap('#shn');await p.waitForTimeout(400);await lance(p,'mcq');await p.evaluate(()=>{const c=document.querySelector('#pic .car');for(let i=0;i<2;i++){const d=document.createElement('div');d.className='sl ld';const im=new Image();im.src=document.querySelector('#pic img').src;d.append(im);c.append(d)}});
await p.tap('#opts button');await p.waitForTimeout(800);const y0=(await st()).y;
const pr=await p.evaluate(()=>{const r=$('pic').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]});
await swipe(pr[0]+100,pr[1],pr[1],-200);const sl=await p.evaluate(()=>document.querySelector('#pic .car').scrollLeft);ok(sl>0&&(await st()).y===y0,'photos : défilement horizontal possible, fond immobile (scrollLeft '+sl+')');
console.log(p.errs);await b.close()})();
