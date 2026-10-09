// Construit donnees/photos.json : pour chaque espèce, les photos iNaturalist (licences libres) déjà choisies
// (photo principale, feuillage, fleurs, fruits, quelques photos du taxon), avec famille, genre et crédits.
// L'appli lit ce fichier au démarrage et n'interroge plus l'API iNaturalist pour ces espèces : un groupe de
// 50 personnes sur le même wifi ne dépasse plus la limite de l'API (60 à 100 requêtes par minute).
// Lancé chaque mois par .github/workflows/photos.yml (1 requête par seconde, environ 1 h).
// Usage local : node outils/construire_photos.js [nombre d'espèces, pour un essai]
const fs=require('fs'),vm=require('vm'),path=require('path');
const R=path.resolve(__dirname,'..'),SORTIE=path.join(R,'donnees','photos.json');
const h=fs.readFileSync(path.join(R,'index.html'),'utf8');
const a=h.indexOf('const S=['),b=h.indexOf('\n',h.indexOf('for(const t in X3)'));
const S=vm.runInNewContext(h.slice(a,b)+'\nS');
const ILIC='cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa';                         // mêmes licences que l'appli
const ORG=[['Feuillage',21],['Fleurs',13],['Fruits',14]];                      // mêmes annotations que l'appli
const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z]/g,'');
const dodo=ms=>new Promise(r=>setTimeout(r,ms));
let dernier=0,n=0;
async function api(p){
  for(let essai=0;essai<4;essai++){
    const att=dernier+1100-Date.now();if(att>0)await dodo(att);dernier=Date.now();n++;
    try{const r=await fetch('https://api.inaturalist.org/v1/'+p,{headers:{'User-Agent':'LeRoyaumeDesPlantes/1.0 (index des photos, 1 requête/s)'}});
      if(r.status===429||r.status>=500){await dodo(60000*(essai+1));continue}
      if(!r.ok)throw new Error(r.status);return await r.json()}
    catch(e){if(essai===3)throw e;await dodo(5000)}
  }
  throw new Error('trop d\'échecs');
}
// photo compacte : « identifiant.extension » pour le dépôt ouvert d'iNaturalist, sinon l'adresse complète
const pc=u=>{const m=String(u).match(/^https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/(\d+)\/\w+\.(\w+)/);return m?m[1]+'.'+m[2]:u};
async function espece(l){
  const j=await api('taxa?q='+encodeURIComponent(l.replace(/×/g,' '))+'&per_page=10&locale=fr');
  const r=(j.results||[]).find(x=>norm(x.name)===norm(l)||norm(x.matched_term)===norm(l));
  const dp=r&&r.default_photo;if(!r||!dp||!dp.license_code)return null;
  const P=[[pc(dp.medium_url||dp.url),'',0,dp.attribution||'']],vu=new Set([String(dp.id)]);
  const t=((await api('taxa/'+r.id+'?locale=fr')).results||[])[0]||{};
  const A=t.ancestors||[],fa=A.find(x=>x.rank==='family')||{},ge=A.find(x=>x.rank==='genus')||{};
  for(const[lb,v]of ORG){
    const o=((await api(`observations?taxon_id=${r.id}&term_id=12&term_value_id=${v}&quality_grade=research&photo_license=${ILIC}&photos=true&order_by=votes&order=desc&per_page=6&locale=fr`)).results||[])
      .find(o=>o.photos&&o.photos[0]&&o.photos[0].url&&!vu.has(String(o.photos[0].id)));
    if(o){const p=o.photos[0];vu.add(String(p.id));P.push([pc(p.url),lb,o.id,p.attribution||''])}
  }
  const ext=(t.taxon_photos||[]).map(x=>x.photo).filter(p=>p&&p.license_code&&!vu.has(String(p.id))).slice(0,4)
    .map(p=>[pc(p.medium_url||p.url),'Photo',0,p.attribution||'']);
  return[r.id,t.preferred_common_name||r.preferred_common_name||'',fa.name||'',fa.preferred_common_name||'',ge.name||'',P.concat(ext)];
}
(async()=>{
  const ancien=fs.existsSync(SORTIE)?JSON.parse(fs.readFileSync(SORTIE,'utf8')).especes||{}:{};
  const L=S.filter(s=>!s[3]).slice(0,+process.argv[2]||S.length),out={};let ok=0,garde=0,rien=0;
  for(const[i,s]of L.entries()){
    try{const e=await espece(s[0]);if(e){out[s[0]]=e;ok++}else rien++}
    catch(e){if(ancien[s[0]]){out[s[0]]=ancien[s[0]];garde++}else rien++;console.log('échec',s[0],e.message)}
    if(i%25===24)console.log(`${i+1}/${L.length} espèces, ${n} requêtes`);
  }
  if(ok<L.length*.8&&Object.keys(ancien).length){console.log(`seulement ${ok} espèces à jour : fichier précédent conservé`);process.exit(1)}
  fs.writeFileSync(SORTIE,JSON.stringify({date:new Date().toISOString().slice(0,10),especes:out}));
  console.log(`${ok} espèces à jour, ${garde} reprises du fichier précédent, ${rien} sans photo libre ; ${n} requêtes ; ${(fs.statSync(SORTIE).size/1024).toFixed(0)} Ko`);
})();
