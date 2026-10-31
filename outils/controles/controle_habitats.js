// Milieux et habitats (nomenclature v1.0) : donnees/milieux-habitats.csv est conforme à la nomenclature, chaque espèce du jeu a au moins
// une association vérifiée et sourcée (renseignement obligatoire), la table MH de l'appli est à jour, et la fiche affiche la ligne
// « Habitats » (cultivée signalée) et ses sources dans « Sources et crédits ». Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_habitats.js
const {open}=require('./banc_essai.js');const {spawnSync}=require('child_process'),path=require('path');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const py=a=>spawnSync('python3',[path.resolve(__dirname,'..','habitats_vers_appli.py'),...a],{encoding:'utf8'});
(async()=>{
  const v=py([]);ok(v.status===0,'fichier conforme à la nomenclature, chaque espèce renseignée : '+(v.stdout.split('\n')[0]||'')+(v.status?'\n'+v.stdout.split('\n').slice(2,8).join('\n'):''));
  const T=JSON.parse(py(['--table']).stdout);
  const {b,p}=await open({w:390,h:844,file:process.env.F});
  const r=await p.evaluate(T=>{const ex=S.filter(s=>(MH.E[s[0]]||[[]])[0].some(a=>a[2]==='c'));
    return{maj:JSON.stringify(MH)===JSON.stringify(T),sans:S.filter(s=>!(MH.E[s[0]]&&MH.E[s[0]][0].length&&mhTxt(s))).map(s=>s[0]),
      liens:S.filter(s=>!/Milieux et habitats : <a href="https?:/.test(mhSrc(s))).map(s=>s[0]),
      cult:ex.length&&ex.every(s=>/\(cultivée\)/.test(mhTxt(s))),
      fiche:(()=>{const s=S.find(s=>MH.E[s[0]]);const d=document.createElement('div');d.innerHTML=detHtml([s],[[]],[{r:[],rows:{}}],false);
        return !!d.querySelector('.mvp .mvb li')&&/Milieux et habitats/.test(d.querySelector('details.src').textContent)})()}},T);
  ok(r.maj,'table MH de l\'appli identique au fichier (relancer outils/habitats_vers_appli.py --ecrire sinon)');
  ok(!r.sans.length,'chaque espèce affiche au moins un habitat '+(r.sans.length?JSON.stringify(r.sans.slice(0,5)):''));
  ok(!r.liens.length,'chaque espèce a ses sources d\'habitat dans « Sources et crédits » '+(r.liens.length?JSON.stringify(r.liens.slice(0,5)):''));
  ok(r.cult,'les associations en culture sont signalées « (cultivée) »');
  ok(r.fiche,'fiche : ligne « Habitats » dans le portrait et sources dans « Sources et crédits »');
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'HABITATS : tout est OK');process.exit(ech?1:0)})();
