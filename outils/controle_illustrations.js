// Lot 2, étape C : illustrations « carnet naturaliste ».
// Usage : node outils/controle_illustrations.js [index.html]
// Vérifie : chaque illustration s'affiche (contour non vide), aucun dégradé ni ombre portée,
// encre lisible sur son fond réel (contraste ≥ 3:1) en clair et en sombre, rangs variés.
const {chromium}=require('playwright');const path=require('path');
const {open}=require('./banc_essai.js');
const FICHIER=process.argv[2]||path.resolve(__dirname,'..','index.html');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
// contraste minimal entre l'encre (.k) de chaque icône visible et le fond opaque le plus proche
const contraste=()=>{const rgb=s=>{const m=s.match(/[\d.]+/g);if(!m)return null;const v=m.map(Number);if(/^color\(srgb/.test(s))return [v[0]*255,v[1]*255,v[2]*255].concat(v.length>3?[v[3]]:[]);return v};
  const L=c=>{const v=c.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
  const fond=e=>{for(;e;e=e.parentElement){const cs=getComputedStyle(e);const c=rgb(cs.backgroundColor);if(cs.backgroundImage!=='none'&&/gradient/.test(cs.backgroundImage)){const g=rgb(cs.backgroundImage.match(/rgba?\([^)]*\)/)[0]);return g}if(c&&(c.length<4||c[3]>.9))return c}return [255,255,255]};
  const res=[];document.querySelectorAll('svg.ri').forEach(s=>{const r=s.getBoundingClientRect();if(!r.width||r.bottom<0||r.top>innerHeight||getComputedStyle(s).visibility==='hidden')return;
    const k=s.querySelector('.k:not(.kl):not(.kok):not(.kko)');if(!k)return;const a=L(rgb(getComputedStyle(k).stroke)),b=L(fond(s.parentElement));
    res.push([(Math.max(a,b)+.05)/(Math.min(a,b)+.05),(s.closest('[id],[class]')||s).id||s.parentElement.className])});return res};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
{const {ctx,p}=await open({browser:b,w:390,h:844,touch:true,seed:true,file:FICHIER});
 const r=await p.evaluate(()=>{const L=[];for(const k in ICO)L.push(['ICO '+k,ICO[k]]);for(const k in CI)L.push(['catégorie '+k,catIcon(k)]);R.forEach((x,i)=>L.push(['rang '+x[1],rIcon(i)]));
   L.push(['TROPHY',TROPHY],['BULB',BULB],['TARGET',TARGET],['HINT',HINT]);
   const d=document.createElement('div');d.style.cssText='position:fixed;left:0;top:0;width:64px;height:64px';document.body.appendChild(d);
   const out=L.map(([n,h])=>{d.innerHTML=h;const s=d.querySelector('svg');const bb=s.getBBox?s.getBBox():{width:0};const f=getComputedStyle(s).filter;
     return [n,bb.width>8&&bb.height>8,f==='none',/url\(#/.test(h)||/Gradient/.test(h)]});d.remove();
   const pig=R.map((x,i)=>{const m=(rIcon(i).match(/class="c(\w+)"/g)||[]).filter(z=>z!=='class="cba"');const c={};m.forEach(z=>c[z]=(c[z]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]});
   return {out,pig,css:[...document.styleSheets].some(ss=>[...ss.cssRules].some(r=>/url\(#g/.test(r.cssText)))}});
 r.out.forEach(([n,vis,sansOmbre,deg])=>ok(vis&&sansOmbre&&!deg,n+' : affichée, sans ombre ni dégradé'));
 ok(!r.css,'aucune règle CSS ne renvoie aux anciens dégradés');
 const dist=new Set(r.pig).size;ok(dist>=6,`rangs : ${dist} pigments dominants différents sur 12 (${r.pig.join(' ')})`);
 await ctx.close()}
for(const cs of ['light','dark'])for(const [w,h] of [[390,844],[1440,900]]){
  const {ctx,p}=await open({browser:b,w,h,touch:w<900,cs,seed:true,file:FICHIER});const tag=`${cs} ${w}×${h}`;
  const voir=async n=>{const r=await p.evaluate(contraste);const m=r.length?Math.min(...r.map(x=>x[0])):0;const pire=r.find(x=>x[0]===m);
    ok(r.length&&m>=3,`${tag} ${n} : ${r.length} icônes, contraste minimal ${m.toFixed(1)}:1${pire?' ('+pire[1]+')':''}`)};
  await voir('accueil');
  await p.evaluate(()=>{const b=document.querySelector('#chips .cats button');b&&b.click()});await p.waitForTimeout(300);await voir('catégorie active');
  await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(400);await voir('progrès');
  await p.click('.tabs button[data-t=quiz]');await p.click('#fday');await p.waitForTimeout(500);await voir('famille du jour');
  ok(p.errs.length===0,tag+' aucune erreur JavaScript');await ctx.close()}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'ILLUSTRATIONS : tout est OK');process.exit(ech?1:0);
})();
