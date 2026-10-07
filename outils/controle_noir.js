// Lot 2, point 8 : aucune zone noire en haut de l'écran (décor de fond), sur 10 formats, en clair et en sombre.
// Usage : node outils/controle_noir.js [index.html] [dossier_captures]
// Un pixel est « noir » si ses trois composantes sont sous 10 (le fond sombre le plus foncé de l'appli est #0a140d).
// Le test porte sur le tiers haut de l'écran, accueil et onglet Progrès.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const {open}=require('./banc_essai.js');
const FICHIER=process.argv[2]||path.resolve(__dirname,'..','index.html'),DOS=process.argv[3]||null;
const F=[[320,568],[360,640],[390,844],[768,1024],[860,900],[1024,700],[1280,650],[1440,900],[1920,1080],[2560,1080]];
let ech=0;const ok=(c,m)=>{if(!c)ech++;console.log((c?'OK   ':'ÉCHEC ')+m)};
(async()=>{
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
const ana=await b.newPage();
const noirs=async png=>ana.evaluate(async u=>{const i=new Image();i.src=u;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=Math.round(i.height/3);const x=c.getContext('2d');x.drawImage(i,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let n=0;for(let k=0;k<d.length;k+=4)if(d[k]<10&&d[k+1]<10&&d[k+2]<10)n++;return n},'data:image/png;base64,'+png.toString('base64'));
if(DOS)fs.mkdirSync(DOS,{recursive:true});
for(const cs of ['light','dark'])for(const [w,h] of F){
  const {ctx,p}=await open({browser:b,w,h,touch:w<900,cs,seed:true,file:FICHIER});
  for(const ecran of ['accueil','progres']){
    if(ecran==='progres'){await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(400)}
    const png=await p.screenshot();if(DOS)fs.writeFileSync(path.join(DOS,`${cs}-${w}x${h}-${ecran}.png`),png);
    const n=await noirs(png);ok(n===0,`${cs} ${w}×${h} ${ecran} : ${n} pixel(s) noir(s) en haut`);
  }
  await ctx.close();
}
await b.close();console.log(ech?ech+' ÉCHEC(S)':'MOTIFS NOIRS : aucun');process.exit(ech?1:0);
})();
