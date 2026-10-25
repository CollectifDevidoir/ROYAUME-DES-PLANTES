// Famille du jour : chaque famille proposée a ses repères de reconnaissance et une curiosité sourcée,
// ses cartes (4, ou 3 sans page des genres pour une famille d'un seul genre) tiennent sur un petit téléphone (360×640)
// sans texte coupé, et les chiffres affichés sont ceux de la liste du jeu.
// Usage : node outils/controles/controle_familles.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {b,p}=await open({w:360,h:640,touch:true,file:process.env.F});
  const d=await p.evaluate(()=>{const fe=FE();return{n:fe.length,
    sans:fe.filter(f=>!FC[f]||!FC[f][0]||!FC[f][1]||!/^https:\/\//.test(FC[f][2])),
    long:fe.filter(f=>FC[f]&&FC[f][0].length>240),
    reperes:fe.filter(f=>!FI[f]||!FI[f][1]||!FI[f][2]||!FI[f][3]||!FI[f][4]||!FI[f][5])}});
  ok(d.n>=30,`${d.n} familles proposées en « Famille du jour »`);
  ok(!d.sans.length,'chaque famille a une curiosité, sa source et son adresse '+d.sans.join(', '));
  ok(!d.long.length,'curiosités synthétiques (240 caractères au plus) '+d.long.join(', '));
  ok(!d.reperes.length,'réflexe, feuilles, fleurs, fruits et piège pour chaque famille '+d.reperes.join(', '));
  const deb=[];
  for(const f of await p.evaluate(()=>FE())){
    const r=await p.evaluate(f=>{openFamily(f);return [...document.querySelectorAll('#fz .fcard')].map((c,i)=>{c.scrollTop=0;
      // carte 2 et 3 : défilables par sécurité, mais le contenu doit tenir sans défiler
      return c.scrollHeight>c.clientHeight+2?i+1:0}).filter(Boolean)},f);
    if(r.length)deb.push(f+' (carte '+r.join(',')+')');
  }
  await p.evaluate(()=>$('fam').close());
  ok(!deb.length,'360×640 : toutes les cartes tiennent sans défiler '+deb.join(' ; '));
  const chif=await p.evaluate(()=>FE().filter(f=>{openFamily(f);const sp=S.filter(s=>FAM[gen(s[0])]===f),ng=new Set(sp.map(s=>gen(s[0]))).size,
      b=[...document.querySelectorAll('#fz .fst b')].map(e=>e.textContent),n=document.querySelectorAll('#fz .fcard').length,
      ty=[...document.querySelectorAll('#fz .fty li b')].reduce((a,e)=>a+ +e.textContent,0);
    return b[0]!==String(sp.length)||b[1]!==String(ng)||(FW[f]&&b[2].replace(/\s/g,'')!=='≈'+FW[f].replace(/\s/g,''))||ty!==sp.length||n!==(ng>1?4:3)}));
  ok(!chif.length,'chiffres de la carte 1 (espèces, genres, monde, types) et nombre de cartes conformes aux données '+chif.join(', '));
  ok(await p.evaluate(()=>{openFamily(FE()[0]);return document.querySelectorAll('#fdots i').length===document.querySelectorAll('#fz .fcard').length}),'autant de points que de cartes');
  ok(await p.evaluate(()=>{const a=document.querySelector('#fz .fsrc a');return !!a&&a.target==='_blank'&&a.rel.includes('noopener')}),'la source s\'ouvre dans un nouvel onglet');
  // glissement au doigt : un geste moyen (90 px, sans élan) tourne la carte en un seul mouvement, sans revenir en arrière
  {await p.evaluate(()=>openFamily(famDay()));await p.waitForTimeout(700);
    const c=await p.context().newCDPSession(p),r=await p.evaluate(()=>{const q=$('fz').getBoundingClientRect();return[q.x+q.width*.7,q.y+q.height*.5]});
    const T=(type,x)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y:r[1]}]});
    for(const [dist,sens] of [[90,1],[-90,-1]]){
      const i0=await p.evaluate(()=>Math.round($('fz').scrollLeft/($('fz').clientWidth+10)));
      await T('touchStart',r[0]);for(let k=1;k<=8;k++){await T('touchMove',r[0]-dist*k/8);await p.waitForTimeout(10)}await T('touchEnd');
      const L=[];for(let k=0;k<50;k++){L.push(await p.evaluate(()=>$('fz').scrollLeft));await p.waitForTimeout(16)}
      const W=await p.evaluate(()=>$('fz').clientWidth+10),fin=Math.round(L[L.length-1]/W),recul=L.slice(1).some((x,k)=>(x-L[k])*sens<-3);
      ok(fin===i0+sens&&!recul,`glissement au doigt ${sens>0?'vers la gauche':'vers la droite'} : carte ${i0+1} → ${fin+1}, en un seul mouvement`)}
    await p.evaluate(()=>$('fam').close())}
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'FAMILLES : tout est OK');process.exit(ech?1:0)})();
