// Conception cible, lot 2 : les sosies de chaque espèce, pour choisir les mauvaises réponses proposées (QCM et 4 photos).
// Sources, par ordre de force :
//   o = observé : confusions réelles des joueurs (donnees/confusions-observees.csv, export de la vue « confusions » de Supabase,
//       colonnes plante_montree,reponse_donnee,fois,joueurs ; gardées à partir de 3 joueurs différents et 5 fois) ;
//   r = rédigé  : paires et groupes déjà rédigés dans l'appli (PAIRS, C, NP, MN, confusions des fiches sourcées SD) ;
//   c = cousin  : même genre et même catégorie ;
//   p = proche  : même famille et même catégorie, classées par caractères communs dans leurs clés « À retenir » (Q).
// Les sosies ne servent qu'au tirage des mauvaises réponses : aucun texte n'est affiché à partir d'eux.
// Écrit donnees/sosies.json (lisible) et la table SO de index.html (alignée sur S : « 12r,345c » = S[12] rédigé, S[345] cousin).
// Usage : NODE_PATH=$(npm root -g) node outils/sosies.js [--ecrire]   (sans option : bilan seulement)
const {open}=require('./banc_essai.js');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..'),MAX=6,SEUIL_JOUEURS=3,SEUIL_FOIS=5;
const TITRE="// Sosies de chaque espèce (alignés sur S ; o observé, r rédigé, c cousin, p proche). Données : donnees/sosies.json ; ligne régénérée par outils/sosies.js";
(async()=>{
  const {b,p}=await open({w:390,h:844});
  const d=await p.evaluate(()=>({S,FAM,Q,PAIRS,C:Object.keys(C),NP:NP.map(x=>[x[0],x[1]]),MN:MN.map(m=>[m[0],m[1]]),SDC:Object.fromEntries(Object.entries(SD).map(([k,v])=>[k,v.confusions||''])),SYN}));
  await b.close();
  const S=d.S,idx=new Map(S.map((s,i)=>[s[0],i])),gen=n=>n.split(' ')[0],fam=n=>d.FAM[gen(n)]||'';
  const nom=n=>{if(idx.has(n))return n;for(const[k,v]of Object.entries(d.SYN))if(v.includes(n))return k;return null};
  const T=S.map(()=>new Map());   // i -> (j -> {o, score})
  const FORCE={o:4,r:3,c:2,p:1};
  const put=(a,b,o,sc)=>{const i=idx.get(a),j=idx.get(b);if(i===undefined||j===undefined||i===j)return;
    for(const[x,y]of[[i,j],[j,i]]){const q=T[x].get(y);if(!q||FORCE[o]>FORCE[q.o])T[x].set(y,{o,sc:sc||0})}};
  // observé
  let obs=0,obsLu=0;const fo=path.join(R,'donnees','confusions-observees.csv');
  if(fs.existsSync(fo)){const L=fs.readFileSync(fo,'utf8').split(/\r?\n/).filter(Boolean),h=L.shift().split(/[;,]/).map(x=>x.trim().replace(/"/g,''));
    const c=k=>h.indexOf(k);for(const l of L){const v=l.split(/[;,]/).map(x=>x.trim().replace(/"/g,''));obsLu++;
      const a=nom(v[c('plante_montree')]),r=nom(v[c('reponse_donnee')]),f=+v[c('fois')],j=+v[c('joueurs')];
      if(a&&r&&a!==r&&j>=SEUIL_JOUEURS&&f>=SEUIL_FOIS){put(a,r,'o',f);obs++}}}
  // rédigé
  d.PAIRS.forEach(([a,c])=>put(a,c,'r'));d.NP.forEach(([a,c])=>put(a,c,'r'));
  d.C.forEach(k=>{const l=k.split('|');l.forEach(a=>l.forEach(c=>put(a,c,'r')))});
  d.MN.forEach(([A,B])=>A.forEach(a=>B.forEach(c=>put(a,c,'r'))));
  for(const[k,t]of Object.entries(d.SDC))if(t)for(const s of S)if(s[0]!==k&&t.includes(s[0]))put(k,s[0],'r');
  // ressemblance des clés : mots communs pondérés par leur rareté (un mot présent partout ne compte presque pas)
  const STOP=new Set('avec dans sous plus tres comme entre leur leurs vers chez sans dont elle ils elles mais aussi tout tous toute toutes souvent parfois puis long longue longs longues petit petite petits petites grand grande grands grandes'.split(' '));
  const mots=n=>new Set(String(d.Q[n]||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/[^a-z]+/).filter(w=>w.length>=4&&!STOP.has(w)));
  const M=S.map(s=>mots(s[0])),df={};M.forEach(m=>m.forEach(w=>{df[w]=(df[w]||0)+1}));
  const sim=(i,j)=>{let x=0;for(const w of M[i])if(M[j].has(w))x+=Math.log(S.length/df[w]);return x};
  // cousins et proches : même catégorie
  S.forEach((s,i)=>S.forEach((t,j)=>{if(i>=j||s[2]!==t[2])return;
    if(gen(s[0])===gen(t[0]))put(s[0],t[0],'c',sim(i,j));else if(fam(s[0])&&fam(s[0])===fam(t[0])){const v=sim(i,j);if(v>0)put(s[0],t[0],'p',v)}}));
  // au plus MAX par espèce : les plus forts d'abord, puis les plus ressemblants ; « proche » seulement s'il manque des sosies plus sûrs
  const out=S.map((s,i)=>{const l=[...T[i]].map(([j,q])=>({j,...q})).sort((x,y)=>FORCE[y.o]-FORCE[x.o]||y.sc-x.sc||x.j-y.j);
    const sur=l.filter(x=>x.o!=='p'),pr=l.filter(x=>x.o==='p');return [...sur,...pr.slice(0,Math.max(0,3-sur.length))].slice(0,MAX)});
  // bilan
  const n=o=>out.filter(l=>l.some(x=>x.o===o)).length,memeCat=out.filter((l,i)=>l.some(x=>S[x.j][2]===S[i][2])).length;
  console.log(`${S.length} espèces : ${memeCat} ont au moins un sosie de leur catégorie, ${S.length-memeCat} n'en ont aucun.`);
  console.log(`Avec au moins un sosie observé : ${n('o')} (${obs} confusions retenues sur ${obsLu} lues${fs.existsSync(fo)?'':', pas de fichier donnees/confusions-observees.csv'}) ; rédigé : ${n('r')} ; cousin : ${n('c')} ; proche : ${n('p')}.`);
  console.log(`Sosies par espèce : ${(out.reduce((a,l)=>a+l.length,0)/S.length).toFixed(1)} en moyenne.`);
  if(!process.argv.includes('--ecrire'))return;
  const js={};S.forEach((s,i)=>{js[s[0]]=out[i].map(x=>({espece:S[x.j][0],origine:{o:'observé',r:'rédigé',c:'cousin',p:'proche'}[x.o]}))});
  fs.writeFileSync(path.join(R,'donnees','sosies.json'),JSON.stringify({regle:'o observé (≥ '+SEUIL_JOUEURS+' joueurs, ≥ '+SEUIL_FOIS+' fois), r rédigé, c cousin (même genre et catégorie), p proche (même famille et catégorie, clés ressemblantes)',especes:js},null,1)+'\n');
  const ligne='const SO='+JSON.stringify(out.map(l=>l.map(x=>x.j+x.o).join(',')))+';';
  const f=path.join(R,'index.html');let h=fs.readFileSync(f,'utf8');const a=h.indexOf(TITRE);
  if(a>=0){const e=h.indexOf('\n',h.indexOf('\n',a)+1);h=h.slice(0,a)+TITRE+'\n'+ligne+h.slice(e)}
  else{const k=h.indexOf('const allPairs=');if(k<0)throw new Error('const allPairs introuvable');h=h.slice(0,k)+TITRE+'\n'+ligne+'\n'+h.slice(k)}
  fs.writeFileSync(f,h);console.log('index.html et donnees/sosies.json mis à jour ('+ligne.length+' caractères).');
})().catch(e=>{console.error(e);process.exit(1)});
