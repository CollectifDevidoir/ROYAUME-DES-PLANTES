// Milieux : chaque espèce du jeu a son propre milieu (exposition, sol, humidité, pH) dans le vocabulaire de l'appli ;
// le fichier sourcé donnees/milieux-especes.json est bien reporté dans l'appli.
// Usage : NODE_PATH=$(npm root -g) node outils/controles/controle_milieux.js
const {open}=require('./banc_essai.js');const fs=require('fs'),path=require('path');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
  const M=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','..','donnees','milieux-especes.json'),'utf8')).especes;
  const {b,p}=await open({});
  const r=await p.evaluate(M=>{const sans=S.filter(s=>!(ES[s[0]]&&ES[s[0]].length===4)).map(s=>s[0]);
    const hors=Object.entries(ES).filter(([l,v])=>!(v[0] in EXM)||!(v[1] in SOLS)||!(v[2] in HUM)||!(v[3] in PHM)).map(([l])=>l);
    const ecarts=Object.entries(M).filter(([l,e])=>JSON.stringify(ES[l])!==JSON.stringify([e.expo,e.sol,e.humidite,e.ph])).map(([l])=>l);
    const inconnues=Object.keys(M).filter(l=>!S.some(s=>s[0]===l));return{sans,hors,ecarts,inconnues}},M);
  ok(!r.sans.length,'chaque espèce a son milieu '+(r.sans.length?JSON.stringify(r.sans.slice(0,5)):''));
  ok(!r.hors.length,'vocabulaire des milieux respecté '+(r.hors.length?JSON.stringify(r.hors.slice(0,5)):''));
  ok(!r.ecarts.length&&!r.inconnues.length,'fichier sourcé reporté dans l\'appli, sans espèce inconnue '+JSON.stringify(r.ecarts.concat(r.inconnues).slice(0,5)));
  const src=Object.values(M).filter(e=>e.certitude==='source');
  ok(src.every(e=>e.sources.length&&e.sources.every(u=>/^https?:\/\/\S+$/.test(u))),'fiches « source » : au moins une adresse web valide ('+src.length+'/'+Object.keys(M).length+')');
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'MILIEUX : tout est OK');process.exit(ech?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
