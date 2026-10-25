// Noms acceptés en plus du nom affiché (SYN) : le nouveau nom accepté (ou l'ancien nom courant) compte comme juste à l'écrit,
// avec la mention « aussi accepté » ; une faute de frappe sur ce nom donne « Presque » ; la recherche de l'herbier le trouve.
// Usage : node outils/controles/controle_synonymes.js
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const {ctx,p}=await open({browser:b,w:390,h:844,touch:true,seed:true,file:process.env.F});
const cas=await p.evaluate(()=>Object.keys(SYN).filter(l=>S.some(s=>s[0]===l)).slice(0,1)[0]);
ok(!!cas,'au moins une espèce de l\'appli a un autre nom accepté ('+cas+')');
const essai=async(tape)=>{await lance(p,'typed');return p.evaluate(([l,t])=>{cur=S.find(s=>s[0]===l);done=false;answer(t);return $('shr').textContent},[cas,tape])};
const syn=await p.evaluate(l=>SYN[l][0],cas);
let r=await essai(syn);ok(/Juste/.test(r)&&/aussi accepté/.test(r),`« ${syn} » écrit pour ${cas} : juste, avec la mention « aussi accepté »`);
await p.evaluate(()=>$('shn').click());await p.waitForTimeout(400);
r=await essai(syn.slice(0,-1)+(syn.slice(-1)==='a'?'e':'a'));ok(/Presque/.test(r),'une lettre fausse dans le nouveau nom : « Presque »');
await p.evaluate(()=>$('shn').click());await p.waitForTimeout(400);
r=await essai(cas);ok(/Juste/.test(r)&&!/aussi accepté/.test(r),'le nom affiché reste juste, sans mention');
await p.evaluate(()=>$('shn').click());await p.waitForTimeout(400);
r=await essai('Quercus robur');ok(/Raté|Même genre/.test(r),'le nom d\'une autre plante reste faux');
await p.evaluate(()=>$('shn').click());await p.waitForTimeout(400);
await p.click('.tabs button[data-t=herb]');await p.waitForTimeout(400);await p.fill('#herb-search',syn);await p.waitForTimeout(300);
ok(await p.evaluate(l=>[...document.querySelectorAll('#herb-results [data-sp]')].some(e=>e.dataset.sp===l),cas),'la recherche de l\'herbier trouve la plante par son autre nom');
ok(p.errs.length===0,'aucune erreur JavaScript '+JSON.stringify(p.errs));await ctx.close();await b.close();
console.log(ech?ech+' ÉCHEC(S)':'SYNONYMES : tout est OK');process.exit(ech?1:0)})();
