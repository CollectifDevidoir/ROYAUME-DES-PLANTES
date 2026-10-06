// Écriture du nom latin : barre sous la photo, clavier simulé, fiche sous la photo (4 tailles d'écran). Usage : node outils/controle_clavier.js
const {open}=require('./banc_essai.js');const lance=require('./lance_exercice.js');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
(async()=>{
for(const [W,H,kb] of [[360,640,290],[375,667,300],[390,844,340],[412,915,350]]){
const {b,p}=await open({w:W,h:H,touch:true});
await lance(p,'typed');
const a=await p.evaluate(()=>[Math.round($('pic').getBoundingClientRect().top),Math.round($('q-input').getBoundingClientRect().bottom),Math.round($('q-ty').getBoundingClientRect().top),scrollY]);
// clavier simulé : la zone visible perd kb pixels
await p.evaluate(kb=>{const vv={height:innerHeight-kb,offsetTop:0,addEventListener(){}};Object.defineProperty(window,'visualViewport',{value:vv,configurable:true})},kb);
await p.tap('#q-input');await p.waitForTimeout(500);
const f=await p.evaluate(()=>[Math.round($('pic').getBoundingClientRect().top),Math.round($('q-input').getBoundingClientRect().bottom),scrollY,Math.round($('pic').offsetHeight)]);
ok(a[1]<a[2],W+'x'+H+' : consigne sous la barre');
ok(f[0]===a[0]&&f[2]===a[3],W+'x'+H+' : clavier ouvert, écran figé (photo '+a[0]+'→'+f[0]+', défilement '+a[3]+'→'+f[2]+')');
ok(f[1]<=H-kb,W+'x'+H+' : barre visible au-dessus du clavier (bas '+f[1]+' ≤ '+(H-kb)+', photo '+f[3]+' px)');
await p.fill('#q-input','Abcd');await p.press('#q-input','Enter');await p.evaluate(()=>{delete window.visualViewport});await p.waitForTimeout(900);
const r=await p.evaluate(()=>[Math.round($('pic').getBoundingClientRect().top),Math.round($('pic').getBoundingClientRect().bottom),Math.round($('sh').getBoundingClientRect().top)]);
ok(r[0]===a[0]&&r[2]>=r[1],W+'x'+H+' : après réponse, photo au même endroit et non recouverte '+JSON.stringify(r));
// bandeau réduit : fond libre, onglets toujours retirés ; redéplier remet la photo en place
await p.tap('#shm');await p.waitForTimeout(400);
ok(await p.evaluate(()=>!document.body.classList.contains('hs')&&$('veil').style.clipPath===''&&getComputedStyle(document.querySelector('.tabs')).visibility==='hidden'),W+'x'+H+' : bandeau réduit : fond libre, onglets retirés');
await p.mouse.wheel(0,200);await p.waitForTimeout(300);await p.tap('#shm');await p.waitForTimeout(500);
const r2=await p.evaluate(()=>[Math.round($('pic').getBoundingClientRect().top),Math.round($('sh').getBoundingClientRect().top),Math.round($('pic').getBoundingClientRect().bottom)]);
ok(r2[0]===a[0]&&r2[1]>=r2[2],W+'x'+H+' : fiche redépliée : photo replacée '+JSON.stringify(r2));

console.log(p.errs.length?p.errs:'');await b.close()}
})();
