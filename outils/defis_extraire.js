// Extrait de l'appli les tables qui servent à générer les questions du Défi du jour (plantes, familles, curiosités…).
// Usage : NODE_PATH=$(npm root -g) node outils/defis_extraire.js app.json   puis   python3 outils/defis_questions.py app.json --ecrire
const {open}=require('./banc_essai.js');const fs=require('fs');
(async()=>{const {b,p}=await open({w:390,h:844});
  const d=await p.evaluate(()=>({S,FAM,ES,CU,AS,GD,PAIRS,NP,MN,FC,FX,FI,DSC,SYN,EASY:[...EASY],lvl:Object.fromEntries(S.map(s=>[s[0],lvl(s)]))}));
  fs.writeFileSync(process.argv[2]||'app.json',JSON.stringify(d));await b.close();process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
