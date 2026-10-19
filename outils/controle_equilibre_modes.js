// Équilibre des catégories au retour en mode Classique après un long travail sur une seule catégorie.
// Moyenne sur plusieurs graines (le hasard de l'appli est remplacé par un générateur reproductible).
// Usage : node outils/controle_equilibre_modes.js   (variable F = autre fichier html pour comparer deux versions)
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {b,p}=await open({w:390,h:844,touch:true,file:process.env.F});
const R=[];for(const g of [11,222,3333,44444,555555,6666666]){
R.push(await p.evaluate(g=>{
  let sd=g;Math.random=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646};
  const D=864e5;let T=Date.parse('2026-03-02T08:00:00');Date.now=()=>T;
  st.sp={};st.m={};fix();replay=null;recent=[];soon=[];qN=0;bad.clear();last=null;cur=null;mode='tout';
  const un=()=>{T+=12e3;const s=pick();cur=s;const p=st.sp[s[0]]||(st.sp[s[0]]={b:1,s:0,e:0,d:0}),bon=Math.random()<.8;acqNow=false;srs(p,bon,'mcq');
    qN++;if(acqNow&&Math.random()<.7&&!soon.some(x=>x.n===s[0]))soon.push({n:s[0],q:qN+10+Math.floor(Math.random()*13)});   // même file de rappel que l'appli (ligne « ancrage »)
    if((p.s===1||!bon)&&!soon.some(x=>x.n===s[0]))soon.push({n:s[0],q:qN+(bon?3:4)+Math.floor(Math.random()*3)});
    recent.push(s[0]);if(recent.length>8)recent.shift();last=s[0];return s};
  for(let i=0;i<60;i++)un();                                    // Classique d'abord
  mode='arbuste';for(let j=0;j<3;j++){T+=D;for(let i=0;i<60;i++)un()}   // 3 jours sur une seule catégorie
  document.querySelectorAll('#cats button')[0].click();         // retour par la vraie tuile « Classique »
  const part={},cat={};S.forEach(s=>cat[s[2]]=(cat[s[2]]||0)+1);
  for(let i=0;i<150;i++){const c=un()[2];part[c]=(part[c]||0)+1}
  return{mode,part,cat,total:S.length}},g))}
if(process.env.V)R.forEach(r=>console.log(JSON.stringify(r.part)));
const cat=R[0].cat,tot=R[0].total,moy=c=>R.reduce((x,r)=>x+(r.part[c]||0),0)/R.length/150;
console.log(Object.keys(cat).map(c=>`${c} ${(moy(c)*100).toFixed(0)} % (catalogue ${(cat[c]/tot*100).toFixed(0)} %)`).join(' · '));
ok(R.every(r=>r.mode==='tout'),'retour en mode Classique à chaque essai');
ok(moy('arbuste')<=cat.arbuste/tot+.06,`« arbuste » pèse ${(moy('arbuste')*100).toFixed(0)} % après retour (catalogue ${(cat.arbuste/tot*100).toFixed(0)} %)`);
// la catégorie délaissée est en avance sur ses échéances (mémorisation espacée) : elle peut peser moins que sa part, mais aucune ne monopolise
ok(Object.keys(cat).every(c=>moy(c)<=cat[c]/tot+.2),'aucune catégorie ne dépasse sa part du catalogue de plus de 20 points');
ok(Object.keys(cat).every(c=>R.every(r=>(r.part[c]||0)>0)),'chaque catégorie revient à chaque essai');
await b.close();console.log(ech?ech+' ÉCHEC(S)':'ÉQUILIBRE : tout est OK');process.exit(ech?1:0)})();
