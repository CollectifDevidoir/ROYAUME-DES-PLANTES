// Famille du jour : chaque famille proposée a ses repères de reconnaissance et une curiosité sourcée,
// et ses 4 cartes tiennent sur un petit téléphone (360×640) sans texte coupé.
// Usage : node outils/controle_familles.js   (variable F = autre fichier html)
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
  ok(await p.evaluate(()=>{openFamily(FE()[0]);return document.querySelectorAll('#fdots i').length===document.querySelectorAll('#fz .fcard').length}),'autant de points que de cartes');
  ok(await p.evaluate(()=>{const a=document.querySelector('#fz .fsrc a');return !!a&&a.target==='_blank'&&a.rel.includes('noopener')}),'la source s\'ouvre dans un nouvel onglet');
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'FAMILLES : tout est OK');process.exit(ech?1:0)})();
