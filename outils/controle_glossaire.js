// Glossaire botanique : mots cliquables dans les fiches, la correction, la famille du jour et le défi ; fenêtre de définition ; glossaire complet.
// Vérifie surtout qu'ouvrir et fermer une définition ne change RIEN au jeu : même plante, même volet, même sauvegarde, même défilement.
// Usage : node outils/controle_glossaire.js   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');const {spawnSync}=require('child_process'),path=require('path');
const py=a=>spawnSync('python3',[path.resolve(__dirname,'glossaire_vers_appli.py'),...a],{encoding:'utf8'});
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {b,p}=await open({w:390,h:844,http:true,file:process.env.F});
  // 0. Fichier source : conforme (sources de référence, définitions courtes, renvois existants) et table GLO de l'appli à jour
  const v=py([]);ok(v.status===0,'donnees/glossaire.csv conforme : '+(v.stdout.trim().split('\n').pop()||'')+(v.status?'\n'+v.stdout:''));
  const T=py(['--table']).stdout;ok(await p.evaluate(t=>{try{return JSON.stringify(GLO)===JSON.stringify(JSON.parse(t))}catch(e){return false}},T),'table GLO de index.html à jour (sinon : python3 outils/glossaire_vers_appli.py --ecrire)');
  // 1. Données : toutes les entrées ont une définition courte et au moins une source https
  const d=await p.evaluate(()=>({n:GLO.t.length,court:GLO.t.every(t=>t[4].length<=160),src:GLO.t.every(t=>t[5].length&&t[5].every(s=>/^https:\/\//.test(s[1]))),
    sch:GLO.t.filter(t=>t[7]).every(t=>GLS[t[7]]&&GLS[t[7]].includes('data-p="'+t[0])||GLS[t[7]].includes(' '+t[0]+'"')||GLS[t[7]].includes(t[0]+' '))}));
  ok(d.n>=60,`glossaire : ${d.n} entrées`);ok(d.court,'définitions de 160 caractères au plus');ok(d.src,'chaque définition a au moins une source https');
  ok(d.sch,'chaque schéma met en valeur la partie de son mot');
  // 2. Marquage sur un texte d'essai : première occurrence seulement, jamais dans un bouton, un nom latin ou un titre, mots composés respectés
  const m=await p.evaluate(()=>{const z=document.createElement('div');z.innerHTML='<p>Feuilles opposées, pétiole court ; pétiole rouge. Épine-vinette et sous-bois. <em>Quercus robur à feuilles opposées</em> <button>pétiole</button> l\'akène et une gousse d\'ail. Sol drainé, pH acide à neutre, RHS H4.</p><h3>Pétiole</h3>';
    document.body.append(z);glo(z);const r=[...z.querySelectorAll('.glo')].map(x=>x.dataset.g+':'+x.textContent);glo(z);const r2=z.querySelectorAll('.glo').length;z.remove();return {r,r2}});
  ok(m.r.join(',')==='opposee:opposées,petiole:pétiole,sousbois:sous-bois,akene:akène,draine:drainé,ph:pH,ph:acide à neutre,rhs:H4'||m.r.join(',')==='opposee:opposées,petiole:pétiole,sousbois:sous-bois,akene:akène,draine:drainé,ph:pH,rhs:H4','marquage : '+m.r.join(', '));
  ok(m.r2===m.r.length,'marquage idempotent (relancé, rien ne double)');
  // 6. Défi du jour : rien de cliquable avant la réponse (une définition donnerait la solution), l'explication l'est ensuite
  await p.click('#defi');await p.waitForSelector('#dfr:not([hidden]) #df-o button',{timeout:10000});
  let avant=true,apres=0;
  for(let k=0;k<10;k++){await p.waitForFunction(k=>dfEtat()&&dfEtat().r.length===k&&document.querySelectorAll('#df-o button').length===4,k,{timeout:10000});
    if(await p.evaluate(()=>!!document.querySelector('#dfr .glo')))avant=false;
    await p.click('#df-o button:nth-child(1)');await p.waitForTimeout(120);apres+=await p.evaluate(()=>document.querySelectorAll('#df-fb .glo,#df-q .glo').length);
    if(await p.evaluate(()=>!!document.querySelector('#df-o .glo')))avant=false;
    if(k<9)await p.click('#df-nx')}
  ok(avant,'défi : aucun mot cliquable avant la réponse, ni dans les choix');ok(apres>0,`défi : ${apres} mots cliquables dans les questions et explications, après réponse`);
  await p.evaluate(()=>dfQuitter());await p.waitForTimeout(400);
  // 3. Correction du quiz : des mots cliquables, et la définition s'ouvre puis se ferme sans rien changer
  await lance(p,'qcm');await p.evaluate(()=>{const b=[...$('opts').children].find(x=>x.dataset.l!==cur[0]);(b||$('opts').children[0]).click()});
  await p.waitForSelector('#sh:not([hidden]) #shb .cp',{timeout:10000});await p.waitForTimeout(700);
  let g=await p.$('#shb .glo');
  if(!g){await p.evaluate(()=>{$('sh-more').click()});await p.waitForTimeout(1500);g=await p.$('#shb .glo')}
  ok(!!g,'correction : au moins un mot cliquable');
  ok(await p.evaluate(()=>![...document.querySelectorAll('.glo')].some(x=>x.parentElement.closest('button,a,em,b,h1,h2,h3,small,[role=button]'))),'aucun mot cliquable dans un bouton, un lien, un nom latin ou un titre');
  ok(await p.evaluate(()=>!document.querySelector('#qc .glo,#opts .glo,#q .glo')),'jamais dans la question ni dans les réponses du quiz');
  if(g){const av=await p.evaluate(()=>({cur:cur[0],sh:$('sh').className,y:$('shb').scrollTop,st:localStorage.getItem('quizplantes.v1'),done,hist:JSON.stringify(st.hist)}));
    const mot=await g.textContent();await g.click();await p.waitForTimeout(300);
    ok(await p.evaluate(()=>$('glo').open),`toucher « ${mot} » ouvre la définition`);
    const f=await p.evaluate(()=>({t:$('glo-t').textContent,d:$('glo-b').querySelector('.gld').textContent,s:$('glo-b').querySelectorAll('.glsrc a').length}));
    ok(f.t.length&&f.d.length>10&&f.s>=1,`définition : « ${f.t} » — ${f.d} (${f.s} source${f.s>1?'s':''})`);
    await p.keyboard.press('Enter');await p.waitForTimeout(300);
    ok(await p.evaluate(c=>cur[0]===c&&$('glo').open,av.cur),'Entrée dans la fenêtre : on ne passe pas à la plante suivante');
    await p.keyboard.press('Escape');await p.waitForTimeout(300);
    const ap=await p.evaluate(()=>({open:$('glo').open,cur:cur[0],sh:$('sh').className,y:$('shb').scrollTop,st:localStorage.getItem('quizplantes.v1'),done,hist:JSON.stringify(st.hist),f:document.activeElement&&document.activeElement.classList.contains('glo')}));
    ok(!ap.open,'Échap ferme la définition');
    ok(ap.cur===av.cur&&ap.done===av.done,'même plante, même étape du jeu');
    ok(ap.sh===av.sh&&Math.abs(ap.y-av.y)<2,'volet de correction inchangé (taille et défilement)');
    ok(ap.st===av.st&&ap.hist===av.hist,'sauvegarde inchangée (aucune écriture)');
    ok(ap.f,'le focus revient sur le mot touché');
    await g.click();await p.waitForTimeout(250);await p.click('#glo-x');await p.waitForTimeout(250);ok(!(await p.evaluate(()=>$('glo').open)),'la croix ferme');
    await g.click();await p.waitForTimeout(250);await p.mouse.click(5,5);await p.waitForTimeout(250);ok(!(await p.evaluate(()=>$('glo').open)),'un toucher à côté ferme');}
  // 4. Fiche d'une plante (fenêtre modale) : la définition s'ouvre par-dessus, la fiche reste ouverte derrière
  await p.evaluate(()=>{$('sh').hidden=true;openSheet(S.find(s=>s[0]==='Acer campestre'))});await p.waitForFunction(()=>!document.querySelector('#fcb .ld'),null,{timeout:15000});
  await p.evaluate(()=>$('fch-more').click());await p.waitForTimeout(300);
  const nf=await p.evaluate(()=>document.querySelectorAll('#fcb .glo').length);ok(nf>=3,`fiche Érable champêtre : ${nf} mots cliquables`);
  const y0=await p.evaluate(()=>{$('fcb').scrollTop=120;return $('fcb').scrollTop});
  await p.evaluate(()=>{const g=[...document.querySelectorAll('#fcb .glo')].find(x=>{const r=x.getBoundingClientRect();return r.height&&r.top>60});g.click()});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>$('glo').open&&$('fch').open),'définition par-dessus la fiche');
  await p.keyboard.press('Escape');await p.waitForTimeout(300);
  ok(await p.evaluate(y=>!$('glo').open&&$('fch').open&&Math.abs($('fcb').scrollTop-y)<2,y0),'Échap ne ferme que la définition : fiche ouverte, à la même place');
  await p.evaluate(()=>closeSheet());
  // 5. Famille du jour
  await p.evaluate(()=>openFamily('Rosaceae'));await p.waitForTimeout(400);
  const nfam=await p.evaluate(()=>document.querySelectorAll('#fz .glo').length);ok(nfam>=3,`famille du jour (Rosacées) : ${nfam} mots cliquables`);
  await p.evaluate(()=>document.querySelector('#fz .glo').click());await p.waitForTimeout(250);
  ok(await p.evaluate(()=>$('glo').open&&$('fam').open),'définition par-dessus la famille du jour');await p.keyboard.press('Escape');await p.waitForTimeout(250);
  ok(await p.evaluate(()=>$('fam').open&&!$('glo').open),'la famille reste ouverte');await p.evaluate(()=>$('fam').close());
  // 7. Glossaire complet depuis Progrès : recherche, catégories, définition puis retour
  await p.evaluate(()=>tabTo('pro'));await p.waitForTimeout(400);
  await p.evaluate(()=>$('pro-glo').scrollIntoView());await p.click('#pro-glo');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>$('glo').open&&$('glo-t').textContent==='Glossaire'&&document.querySelectorAll('#glo-l .gli').length===GLO.t.length),'Progrès → Glossaire : liste complète');
  ok(await p.evaluate(()=>document.querySelectorAll('#glo .glk button').length===9),'8 catégories + Tout');
  await p.fill('#glo-q','akene');await p.waitForTimeout(150);
  ok(await p.evaluate(()=>[...document.querySelectorAll('#glo-l .gli b')].map(x=>x.textContent).join()==='Akène,Samare'||[...document.querySelectorAll('#glo-l .gli b')].some(x=>x.textContent==='Akène')),'recherche sans accent : « akene » trouve Akène');
  await p.fill('#glo-q','');await p.click('#glo .glk button[data-k=fruits]');await p.waitForTimeout(150);
  ok(await p.evaluate(()=>{const L=[...document.querySelectorAll('#glo-l .gli')];return L.length===GLO.t.filter(t=>t[3]==='fruits').length}),'catégorie Fruits et graines filtrée');
  await p.click('#glo-l .gli');await p.waitForTimeout(200);ok(await p.evaluate(()=>!!$('glo-b').querySelector('.gld')&&$('glo-all').textContent.includes('Retour')),'une entrée de la liste s\'ouvre, avec retour au glossaire');
  await p.click('#glo-all');await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector('#glo .glk button[data-k=fruits]').getAttribute('aria-pressed')==='true'),'retour : la catégorie choisie est gardée');
  await p.evaluate(()=>{const e=GLO.t.find(t=>t[0]==='petiole');gloOpen('petiole')});await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!!document.querySelector('#glo .gls svg [data-p~=petiole].on')),'schéma : le pétiole est mis en valeur');
  await p.click('#glo .glr');await p.waitForTimeout(200);ok(await p.evaluate(()=>$('glo').open&&$('glo-t').textContent!=='Pétiole'),'« Voir aussi » ouvre un autre mot');
  await p.keyboard.press('Escape');
  ok(!p.errs.length,'aucune erreur JavaScript'+(p.errs.length?' : '+p.errs.join(' | '):''));
  console.log(ech?`ÉCHEC : ${ech} contrôle(s) en erreur`:'Glossaire : tout est OK');await b.close();process.exit(ech?1:0)})();
