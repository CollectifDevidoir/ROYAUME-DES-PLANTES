// Anecdotes : phrases « À découvrir » corrigées reportées, curiosités sourcées affichées dans la fiche, à la suite de « À découvrir »
// avec leur source, jamais celles en réserve ; aucune curiosité ne nomme sa plante (elles doivent pouvoir servir de question).
// Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_anecdotes.js
const {open}=require('./banc_essai.js');const fs=require('fs'),path=require('path');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const A=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','..','donnees','anecdotes-especes.json'),'utf8')).especes;
  const {b,p}=await open({w:390,h:844,touch:true});
  const r=await p.evaluate(A=>{const out={};
    out.cor=Object.entries(A).filter(([l,e])=>e.phrase_statut==='corrigée'&&AS[l]!==e.phrase_corrigee).map(([l])=>l);
    out.res=Object.entries(A).filter(([l,e])=>e.reserve&&CU[l]).map(([l])=>l);
    out.manque=Object.entries(A).filter(([l,e])=>e.certitude==='source'&&e.sources.length&&!e.reserve&&!(CU[l]&&CU[l][0]===e.curiosite)).map(([l])=>l);
    out.nom=Object.entries(CU).filter(([l,[t]])=>{const s=S.find(x=>x[0]===l);const n=x=>x.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();return !s||n(t).includes(n(l.split(' ')[0]))||n(t).includes(n(s[1]))}).map(([l])=>l);
    out.url=Object.values(CU).every(([,u])=>/^https?:\/\/\S+$/.test(u));out.n=Object.keys(CU).length;return out},A);
  ok(!r.cor.length,'phrases « À découvrir » corrigées reportées dans l\'appli '+JSON.stringify(r.cor.slice(0,4)));
  ok(!r.res.length,'curiosités en réserve jamais affichées '+JSON.stringify(r.res));
  ok(!r.manque.length,'curiosités sourcées toutes reportées ('+r.n+') '+JSON.stringify(r.manque.slice(0,4)));
  ok(!r.nom.length&&r.url,'aucune curiosité ne nomme sa plante ni son nom commun ; sources en adresses web '+JSON.stringify(r.nom.slice(0,4)));
  // fiche d'une plante avec curiosité : « Le saviez-vous ? » et lien vers la source
  const l=await p.evaluate(()=>Object.keys(CU).find(l=>S.some(s=>s[0]===l)));
  await p.evaluate(l=>openSheet(S.find(s=>s[0]===l),null,{}),l);
  await p.waitForSelector('#fch-more',{timeout:15000});await p.click('#fch-more');await p.waitForTimeout(400);   // « Plus de détails »
  const vu=await p.waitForFunction(l=>{return ![...document.querySelectorAll('.det-h')].some(h=>/saviez/i.test(h.textContent))&&[...document.querySelectorAll('.disc')].some(d=>d.textContent.includes(AS[l])&&d.textContent.includes(CU[l][0]))},l,{timeout:15000}).then(()=>true,()=>false);
  const lien=await p.evaluate(l=>[...document.querySelectorAll('a.csrc')].some(a=>a.href===CU[l][1]&&a.target==='_blank'&&/Source/.test(a.textContent)),l);
  ok(vu&&lien,'fiche de '+l+' : une seule rubrique « À découvrir » (présentation puis curiosité), lien vers la source');
  ok(p.errs.length===0,'aucune erreur de page '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'ANECDOTES : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
