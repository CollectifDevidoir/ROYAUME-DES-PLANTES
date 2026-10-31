// Conception cible, lot 1.5 : sources des clés « À retenir » (donnees/cles-revues.csv → QS) affichées pour chaque espèce.
// Usage : node outils/controles/controle_sources_cles.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');const fs=require('fs'),path=require('path');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
// sources attendues, lues directement dans le tableur (colonne « Sources des clés », séparées par « | »)
const csv=fs.readFileSync(path.resolve(__dirname,'..','..','donnees','cles-revues.csv'),'utf8').split(/\r?\n/).slice(1).filter(Boolean),att={};
for(const l of csv){const m=l.match(/^([^;]+);.*;(https?:\/\/.*)$/);if(m)att[m[1]]=m[2].split('|').map(x=>x.trim().replace(/ /g,'%20')).filter(Boolean)}
(async()=>{const {b,p}=await open({w:390,h:844,touch:true,seed:true,file:process.env.F});
const r=await p.evaluate(att=>{const out={n:S.length,sans:[],diff:[],liens:0};
  for(const s of S){const h=keySrc(s),d=document.createElement('div');d.innerHTML=h;const u=[...d.querySelectorAll('a')].map(a=>a.getAttribute('href'));out.liens+=u.length;
    if(!u.length)out.sans.push(s[0]);else if(JSON.stringify(u)!==JSON.stringify(att[s[0]]||[]))out.diff.push(s[0])}
  return out},att);
ok(r.sans.length===0,`${r.n-r.sans.length} espèces sur ${r.n} ont au moins une source de clés affichée`+(r.sans.length?' ; sans : '+r.sans.slice(0,5).join(', '):''));
ok(r.diff.length===0,`les ${r.liens} liens affichés sont exactement ceux du tableur`+(r.diff.length?' ; différences : '+r.diff.slice(0,5).join(', '):''));
ok(await lance(p,'mcq'),'QCM affiché');
await p.click('#opts button');await p.waitForFunction(()=>!/Chargement/.test(($('sh-dt')||{}).textContent||'Chargement'),null,{timeout:20000}).catch(()=>{});
const f=await p.evaluate(()=>{const d=document.querySelector('#sh-dt details.src');if(!d)return null;const t=d.textContent,a=[...d.querySelectorAll('a')].filter(a=>/^Clés d'identification/.test((a.parentNode.textContent||'').trim())||a.parentNode.textContent.includes("Clés d'identification"));
  return{t:/Clés d'identification : /.test(t),a:a.length,ext:a.every(x=>x.target==='_blank'&&x.rel==='noopener')}});
ok(f&&f.t&&f.a>0,'correction > Plus de détails > Sources et crédits : ligne « Clés d’identification » avec ses liens');
ok(f&&f.ext,'les liens de source s’ouvrent dans un nouvel onglet (noopener)');
ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
await b.close();console.log(ech?ech+' ÉCHEC(S)':'SOURCES DES CLÉS : tout est OK');process.exit(ech?1:0)})();
