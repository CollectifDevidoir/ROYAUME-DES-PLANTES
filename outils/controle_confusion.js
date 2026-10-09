// Lot 2, point 5 : mode confusion. Les deux espèces s'affichent d'abord côte à côte (duel),
// puis les points à comparer, puis le bouton d'exercice. Mobile et ordinateur.
// Usage : node outils/controle_confusion.js [index.html]
const {chromium}=require('playwright');const path=require('path');
const {open}=require('./banc_essai.js');
const FICHIER=process.argv[2]||path.resolve(__dirname,'..','index.html');
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
for(const [w,h,t] of [[360,640,true],[390,844,true],[768,1024,true],[1440,900,false],[1920,1080,false]]){
  const tag=w+'×'+h;const {ctx,p}=await open({browser:b,w,h,touch:t,seed:true,file:FICHIER});
  await p.evaluate(()=>{st.cf={'Quercus petraea|Quercus robur':3};save()});
  await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('.cfr button').click());await p.waitForTimeout(80);
  const tot=await p.evaluate(()=>{const d=document.querySelector('#fcb .duel');return !!d&&/Quercus petraea/.test(d.textContent)&&/Quercus robur/.test(d.textContent)&&/confondues 3×/.test(d.textContent)});
  ok(tot,tag+' duel affiché tout de suite (deux noms, « confondues 3× »)');
  for(let k=0;k<30;k++){await p.waitForTimeout(400);if(!(await p.evaluate(()=>/Chargement/.test($('fcb').textContent))))break}
  const r=await p.evaluate(()=>{const d=document.querySelector('#fcb .duel');if(!d)return null;
    const im=[...d.querySelectorAll('.dlc img')].map(i=>i.getBoundingClientRect()),v=d.querySelector('.dlv .tgi').getBoundingClientRect();
    const cmp=document.querySelector('#fcb .cmp2'),go=$('fch-go');
    return {n:im.length,cote:im.length===2&&Math.abs(im[0].top-im[1].top)<1&&im[0].right<=im[1].left,
      larg:im.length===2&&Math.abs(im[0].width-im[1].width)<1,
      cx:im.length===2?Math.abs((v.left+v.right)/2-(im[0].right+im[1].left)/2):99,
      cy:im.length===2?Math.abs((v.top+v.bottom)/2-(im[0].top+im[0].bottom)/2):99,
      avant:!!cmp&&!!(d.compareDocumentPosition(cmp)&Node.DOCUMENT_POSITION_FOLLOWING),
      go:!!go&&!!(d.compareDocumentPosition(go)&Node.DOCUMENT_POSITION_FOLLOWING),
      deb:document.documentElement.scrollWidth<=innerWidth+1,
      dlg:(()=>{const f=$('fch').getBoundingClientRect();return f.left>=-1&&f.right<=innerWidth+1})()}});
  ok(r&&r.n===2&&r.cote&&r.larg,tag+' deux photos de même taille côte à côte');
  ok(r&&r.cx<2&&r.cy<2,tag+' médaillon centré entre les photos ('+(r&&r.cx.toFixed(1))+' / '+(r&&r.cy.toFixed(1))+' px)');
  ok(r&&r.avant&&r.go,tag+' ordre : duel, puis points à comparer, puis exercice');
  ok(r&&r.deb&&r.dlg,tag+' pas de débordement');
  // moyen mnémotechnique : seulement dans « Pour ne pas les confondre », quand on a confondu les deux espèces concernées
  {const mn=await p.evaluate(()=>{const t=(a,w,g)=>{cur=S.find(s=>s[0]===a);showSheet(g,w?S.find(s=>s[0]===w):null,'');return [!!document.querySelector('#shb .mnm'),!!document.querySelector('#shb .diff .mnm')]};
      const r=[t('Carpinus betulus','Fagus sylvatica',false),t('Fagus sylvatica','Carpinus betulus',false),t('Carpinus betulus',null,true),t('Picea abies','Picea omorika',false),t('Picea abies','Abies alba',false)];$('sh').hidden=true;return r});
    ok(mn[0].join()==='true,true'&&mn[1].join()==='true,true'&&mn[4].join()==='true,true',tag+' moyen mnémotechnique dans « Pour ne pas les confondre » (charme/hêtre, épicéa/sapin)');
    ok(mn[2].join()==='false,false'&&mn[3].join()==='false,false',tag+' pas de moyen mnémotechnique hors de la paire concernée (bonne réponse, deux épicéas)')}
  ok(p.errs.length===0,tag+' aucune erreur JavaScript '+(p.errs.length?JSON.stringify(p.errs.slice(0,2)):''));
  await ctx.close();
}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'CONFUSION : tout est OK');process.exit(ech?1:0);
})();
