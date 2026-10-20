// Conception cible, lot 2 : sosies (table SO, outils/sosies.js) et mauvaises réponses proposées en QCM.
// Mesure, sur des milliers de tirages, la part des mauvaises réponses qui sont des sosies de la bonne plante,
// pour une plante nouvelle (débutant) et pour une plante en vérification (niveau 3). AVANT=autre fichier html : même mesure,
// avec les sosies de ce fichier-ci, pour comparer. Usage : NODE_PATH=$(npm root -g) node outils/controle_distracteurs.js
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const MESURE=(SOref)=>{   // exécutée dans la page : SOref = table SO de référence (celle du fichier contrôlé)
  let x=7;Math.random=()=>{x=(x*16807)%2147483647;return(x-1)/2147483646};
  const ref=s=>new Set(String(SOref[S.indexOf(s)]||'').split(',').filter(Boolean).map(v=>S[parseInt(v)]).filter(t=>t&&t[2]===s[2]));
  const run=(b,vus)=>{st={sp:{},day:{},m:{},cf:{}};fix();curTrain=false;famFocus=null;
    S.slice(0,vus).forEach(s=>{st.sp[s[0]]={b:2,s:3,e:0,c:0,d:0}});
    let n=0,so=0,plus1=0,dispo=0;
    S.forEach((s,i)=>{if(i%2)return;const R=ref(s);if(!R.size)return;dispo++;
      for(let k=0;k<6;k++){if(b)st.sp[s[0]]={b,s:5,e:0,c:0,d:0};else delete st.sp[s[0]];
        const c=choices(s).filter(t=>t!==s),m=c.filter(t=>R.has(t)).length;n+=c.length;so+=m;if(m>1)plus1++}});
    return{part:so/n,plus1,dispo}};
  return{deb:run(0,5),n3:run(3,40)}};
(async()=>{
  const {b,p}=await open({w:390,h:844,file:process.env.F});
  const t=await p.evaluate(()=>{const v=[],cat=S.map((s,i)=>String(SO[i]).split(',').filter(Boolean).map(x=>({j:parseInt(x),o:x.slice(-1)})));
    cat.forEach((l,i)=>{if(l.length>6)v.push(S[i][0]+' : plus de 6');l.forEach(x=>{if(!S[x.j])v.push(S[i][0]+' : indice '+x.j);else if(x.j===i)v.push(S[i][0]+' : lui-même');if(!'orcp'.includes(x.o))v.push(S[i][0]+' : origine '+x.o)})});
    const meme=cat.filter((l,i)=>l.some(x=>S[x.j]&&S[x.j][2]===S[i][2])).length;
    const pp=PAIRS.filter(([a,c])=>{const i=S.findIndex(s=>s[0]===a),j=S.findIndex(s=>s[0]===c);return i>=0&&j>=0&&S[i][2]===S[j][2]}),
      man=pp.filter(([a,c])=>!sos(S.find(s=>s[0]===a)).some(x=>x[0][0]===c));
    return{n:S.length,len:SO.length,v,meme,pp:pp.length,man,SO}});
  ok(t.len===t.n&&!t.v.length,`table SO alignée sur les ${t.n} espèces, sans indice faux ni espèce sosie d'elle-même`+(t.v.length?' : '+t.v.slice(0,3).join(' ; '):''));
  ok(t.meme>=600,`${t.meme} espèces sur ${t.n} ont au moins un sosie de leur catégorie (objectif : 600)`);
  ok(!t.man.length,`les ${t.pp} paires rédigées (PAIRS) de même catégorie sont toutes des sosies`+(t.man.length?' ; manquent : '+t.man.slice(0,3).join(' ; '):''));
  const apres=await p.evaluate(`(${MESURE})(${JSON.stringify(t.SO)})`);
  console.log(`     après : niveau 3, ${(100*apres.n3.part).toFixed(0)} % des mauvaises réponses sont des sosies ; plante nouvelle, ${(100*apres.deb.part).toFixed(0)} %`);
  ok(apres.n3.part>=.6,'plante de niveau 3 : au moins 60 % des mauvaises réponses sont des sosies');
  ok(apres.deb.plus1===0,'plante nouvelle chez un débutant : jamais plus d’un sosie parmi les mauvaises réponses (difficulté progressive)');
  if(process.env.AVANT){const {b:b2,p:p2}=await open({w:390,h:844,file:process.env.AVANT});
    const av=await p2.evaluate(`(${MESURE})(${JSON.stringify(t.SO)})`);await b2.close();
    console.log(`     avant : niveau 3, ${(100*av.n3.part).toFixed(0)} % ; plante nouvelle, ${(100*av.deb.part).toFixed(0)} %`)}
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'MAUVAISES RÉPONSES : tout est OK');process.exit(ech?1:0)})();
