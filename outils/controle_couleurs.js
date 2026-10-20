// Conception cible, lot 5.4 : couleurs des verdicts (Juste, Presque, Même genre, Bon genre, Raté) et du tampon « Acquise ».
// Chacun a sa variable (--v-juste, --v-presque, --v-genre, --v-rate, --tampon) ; contraste d'au moins 4,5:1 avec son texte,
// mesuré sur les couleurs réellement calculées par le navigateur, en clair et en sombre.
// Usage : NODE_PATH=$(npm root -g) node outils/controle_couleurs.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{for(const cs of ['light','dark']){const {b,p}=await open({w:390,h:844,cs,file:process.env.F});
  const r=await p.evaluate(()=>{
    const rgb=c=>{const m=c.match(/[\d.]+/g).map(Number);return m.slice(0,3)},L=([r,g,b])=>{const f=c=>(c/=255)<=.03928?c/12.92:((c+.055)/1.055)**2.4;return .2126*f(r)+.7152*f(g)+.0722*f(b)},
      C=(a,b)=>{const x=L(rgb(a)),y=L(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
    const box=document.createElement('div');box.id='shr';box.style.cssText='position:fixed;left:0;top:0;background:var(--card)';document.body.append(box);
    const out={};for(const [n,cl] of [['Juste','v y'],['Presque','v y ty'],['Même genre / Bon genre','v n g'],['Raté','v n']]){const e=document.createElement('span');e.className=cl;e.textContent=n;box.append(e);const st=getComputedStyle(e);out[n]={c:C(st.color,st.backgroundColor),bg:st.backgroundColor}}
    const t=document.createElement('span');t.className='acq';t.textContent='Acquise';box.append(t);const ts=getComputedStyle(t);out['tampon « Acquise »']={c:C(ts.color,getComputedStyle(box).backgroundColor),bg:ts.color};
    const v=getComputedStyle(document.documentElement);out.vars=['--v-juste','--v-presque','--v-genre','--v-rate','--tampon'].every(k=>v.getPropertyValue(k).trim());
    return out});
  ok(r.vars,`${cs==='dark'?'sombre':'clair'} : les 5 variables de couleur sont définies`);delete r.vars;
  for(const [n,x] of Object.entries(r))ok(x.c>=4.5,`${cs==='dark'?'sombre':'clair'} : ${n}, contraste ${x.c.toFixed(2)}:1 (${x.bg})`);
  const bgs=Object.entries(r).filter(([n])=>n!=='tampon « Acquise »').map(([,x])=>x.bg);
  ok(new Set(bgs).size===bgs.length,`${cs==='dark'?'sombre':'clair'} : les 4 verdicts ont 4 couleurs différentes`);
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));await b.close()}
  console.log(ech?ech+' ÉCHEC(S)':'COULEURS : tout est OK');process.exit(ech?1:0)})();
