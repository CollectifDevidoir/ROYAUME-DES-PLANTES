// Lot 2, points 1 et 2 : joker (initiales dans le champ) et validation d'une réponse vide.
// Usage : node outils/controle_saisie.js [largeur hauteur]   (variable F = autre fichier html)
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
const W=+process.argv[2]||360,H=+process.argv[3]||640;
(async()=>{const {b,p}=await open({w:W,h:H,touch:W<900,file:process.env.F});
// --- joker ---
ok(await lance(p,'typed'),'exercice de saisie affiché');
const nom=await p.evaluate(()=>cur[0]);
const att=nom.split(' ').map(x=>x==='×'?'×':x[0]+'.').join(' ');
await p.fill('#q-input','quer');
ok(await p.evaluate(()=>$('q-ini').hidden),'avant le joker : pas d’initiales');
await p.click('#jk');await p.waitForTimeout(200);
const r=await p.evaluate(()=>{const i=$('q-input'),t=$('q-ini'),a=i.getBoundingClientRect(),b=t.getBoundingClientRect(),cs=getComputedStyle(i);return{txt:t.textContent,vis:!t.hidden&&b.width>0,dedans:b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom,val:i.value,marge:parseFloat(cs.paddingRight)>=b.width+8,bandeau:!!document.getElementById('q-hint')}});
ok(r.txt===att,`initiales « ${r.txt} » (attendu « ${att} » pour ${nom})`);
ok(r.vis&&r.dedans,'initiales visibles, à l’intérieur de la zone de saisie');
ok(r.val==='quer','le texte déjà saisi est conservé');
ok(r.marge,'le texte saisi ne passe pas sous les initiales (marge réservée)');
ok(!r.bandeau,'aucun bandeau séparé');
await p.type('#q-input','cus robur extra long pour remplir le champ');ok(await p.evaluate(()=>!$('q-ini').hidden),'initiales toujours visibles pendant la saisie');
await p.fill('#q-input','');ok(await p.evaluate(()=>!$('q-ini').hidden),'initiales visibles avec un champ vidé');
// --- réponse vide ---
ok(await lance(p,'typed'),'nouvel exercice de saisie');
const n0=await p.evaluate(()=>(st.hist[today()]||{n:0}).n);
await p.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true});$('q-input').dispatchEvent(e);window.__rep=e.defaultPrevented});
ok(await p.evaluate(()=>window.__rep&&!done),'Entrée maintenue (répétition) : ignorée, pas de validation involontaire');
await p.click('#q-form button:not(#jk)');await p.waitForTimeout(400);   // « Valider » tout de suite, champ vide
const e=await p.evaluate(n0=>({done,n:(st.hist[today()]||{n:0}).n,ok:(st.hist[today()]||{ok:0}).ok,sh:!$('sh').hidden,err:st.tm.l.includes(cur[0])}),n0);
ok(e.done&&e.n===n0+1,'champ vide + « Valider » tout de suite : correction immédiate, réponse comptée');
ok(e.err,'traitée comme une erreur (dans « erreurs du jour »)');
ok(e.sh,'la fiche de correction s’ouvre');
ok(await p.evaluate(()=>/Pas de réponse/.test($('sh').textContent)&&!/« »/.test($('sh').textContent)),'message adapté : « Pas de réponse », pas « « » n’est pas dans la liste »');
// --- juste, presque, raté ---
const essai=async t=>{await lance(p,'typed');const nm=await p.evaluate(()=>cur[0]);await p.fill('#q-input',t(nm));await p.click('#q-form button:not(#jk)');await p.waitForTimeout(400);
  return p.evaluate(()=>{const v=document.querySelector('#shr .v');return{txt:v.textContent,cls:v.className,bg:getComputedStyle(v).backgroundColor,col:getComputedStyle(v).color,b:st.sp[cur[0]].b,tm:st.tm.l.includes(cur[0])}})};
const J=await essai(n=>n),P=await essai(n=>n.slice(0,-2)+n.slice(-1)),X=await essai(()=>'Rosa nimportequoi');
ok(J.txt==='Juste'&&!J.tm,'nom exact : « Juste »');
ok(P.txt==='Presque'&&!P.tm,'une lettre oubliée : « Presque », compté juste (pas dans les erreurs du jour)');
ok(P.bg!==J.bg||P.col!==J.col,'« Presque » se distingue visuellement de « Juste » ('+P.bg+' / '+J.bg+')');
ok(X.txt==='Raté'&&X.tm,'nom faux : « Raté », dans les erreurs du jour');
ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));
await b.close();console.log(ech?ech+' ÉCHEC(S)':'SAISIE : tout est OK');process.exit(ech?1:0)})();
