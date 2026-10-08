// Simulation bêta, utilisateur A (débutant complet, téléphone) : premier lancement, 10 plantes sans aide,
// erreurs et bonnes réponses mêlées, puis fermeture et retour. Utilisateur B (professionnel) : fiches des
// espèces des premiers exercices (clés 3 à 5, confusions expliquées).
// Usage : node outils/simulation_beta.js [largeur hauteur]
const {open}=require('./banc_essai.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const W=+process.argv[2]||360,H=+process.argv[3]||640;
(async()=>{const {b,p}=await open({w:W,h:H,touch:true,fresh:true,file:process.env.F});
  const prete=()=>p.waitForFunction(()=>(pvSet||!$('pic').classList.contains('sk'))&&(document.querySelectorAll('#opts button').length>=4||!!$('q-input'))&&!done,null,{timeout:20000}).then(()=>true).catch(()=>false);
  ok(await prete(),'ouverture : une plante et ses réponses');
  ok(await p.evaluate(()=>/^Bienvenue/.test($('q').textContent)),'le débutant sait quoi faire : « Bienvenue ! Quelle est cette plante ? »');
  let rates=0,justes=0,fiches=0,suivant=0,photos=0;
  for(let i=0;i<10;i++){
    if(!(await prete())){ok(false,`plante ${i+1} : pas d'exercice prêt`);break}
    await p.waitForFunction(()=>pvSet?[...document.querySelectorAll('#opts img')].every(i=>i.complete):(()=>{const i=document.querySelector('#pic .sl img');return i&&i.complete})(),null,{timeout:8000}).catch(()=>{});   // le temps que la photo arrive
    const vu=await p.evaluate(()=>{if(pvSet)return [...document.querySelectorAll('#opts img')].every(i=>i.complete&&i.naturalWidth>0);const i=document.querySelector('#pic .sl img');return !!i&&i.complete&&i.naturalWidth>0&&i.getBoundingClientRect().height>100});
    if(vu)photos++;
    // il se trompe une fois sur deux ; en saisie, il ne connaît pas le nom et valide le champ vide ; « quelle photo ? » : même principe
    const ty=await p.evaluate(()=>!!$('q-input'));
    if(ty)await p.click('#q-form button:not(#jk)');
    else{const faux=i%2===0;await p.evaluate(f=>{const bs=[...document.querySelectorAll('#opts button')];(bs.find(x=>f?x.dataset.l!==cur[0]:x.dataset.l===cur[0])||bs[0]).click()},faux)}
    await p.waitForTimeout(500);
    const r=await p.evaluate(()=>{const v=document.querySelector('#shr .v'),n=$('shn'),rc=n&&n.getBoundingClientRect();
      return{v:v&&v.textContent,cles:document.querySelectorAll('#shb .cp li').length,nom:!!document.querySelector('#shr b')&&!!document.querySelector('#shr em'),
        suiv:!!n&&!$('sh').hidden&&rc.bottom<=innerHeight+1&&rc.height>=40}});
    if(r.v==='Raté')rates++;else justes++;
    if(r.cles>=3&&r.nom)fiches++;if(r.suiv)suivant++;
    await p.click('#shn');await p.waitForTimeout(300);
  }
  ok(photos===10,`la photo de la plante est bien affichée à chaque question (${photos}/10)`);
  ok(rates>0&&justes>0,`10 plantes : ${justes} justes, ${rates} ratées`);
  ok(fiches===10,`chaque correction montre le nom et au moins 3 clés (${fiches}/10)`);
  ok(suivant===10,`« Plante suivante » visible et assez grand à chaque fois (${suivant}/10)`);
  ok(await p.evaluate(()=>getComputedStyle($('chips')).display!=='none'),'après la première plante : les modes sont proposés');
  const n=await p.evaluate(()=>(st.hist[today()]||{n:0}).n);ok(n===10,`10 exercices comptés (${n})`);
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'pas de défilement horizontal');
  // il ferme l'appli et revient
  await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{const s=$('splash');if(s)s.click()});await p.waitForTimeout(1700);
  ok(await p.evaluate(n=>(st.hist[today()]||{n:0}).n===n&&Object.keys(st.sp).length>0,n),'retour : sa progression est là');
  // utilisateur B : sérieux des fiches des espèces rencontrées en premier
  const B=await p.evaluate(()=>{const e=S.filter(s=>EASY.has(s[0]));const k=e.filter(s=>{const n=q3(s).length;return n<3||n>5});
    const vague=e.filter(s=>q3(s).some(x=>/^(feuilles vertes|plante persistante|floraison estivale|feuilles vert clair)$/i.test(x.trim())));
    const fam=e.filter(s=>!FAM[gen(s[0])]);return{n:e.length,k:k.map(s=>s[0]),vague:vague.map(s=>s[0]),fam:fam.map(s=>s[0]),
      pairs:Object.keys(C).filter(x=>x.split('|').some(y=>EASY.has(y))).length}});
  ok(!B.k.length,`${B.n} espèces des premiers exercices : 3 à 5 clés chacune ${B.k.join(', ')}`);
  ok(!B.vague.length,'aucune clé purement descriptive (« feuilles vertes »…) '+B.vague.join(', '));
  ok(!B.fam.length,'famille connue pour chacune '+B.fam.join(', '));
  ok(B.pairs>=40,`${B.pairs} confusions expliquées (« Pour ne pas les confondre »)`);
  ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
  await b.close();console.log(ech?ech+' ÉCHEC(S)':'SIMULATION BÊTA : tout est OK');process.exit(ech?1:0)})();
