// Banc d'essai : fausses réponses iNaturalist + photos générées (le réseau est bloqué ici)
const {chromium}=require('playwright');
const path=require('path');
const svg=(n)=>{const h=(n*47)%360;return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${n%3?600:900}"><rect width="100%" height="100%" fill="hsl(${h},45%,45%)"/><circle cx="400" cy="300" r="160" fill="hsl(${(h+60)%360},70%,70%)"/><text x="40" y="80" font-size="60" fill="#fff">photo ${n}</text></svg>`};
async function open(o={}){
  const b=o.browser||await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:o.w||360,height:o.h||640},deviceScaleFactor:2,hasTouch:!!o.touch,isMobile:!!o.touch,colorScheme:o.cs||'light'});
  let k=0;
  await ctx.route(/^https?:/,r=>{const u=r.request().url();
    if(u.startsWith('https://api.inaturalist.org/v1/taxa?q=')){const q=decodeURIComponent(u.split('q=')[1].split('&')[0]);k++;
      return r.fulfill({contentType:'application/json',body:JSON.stringify({results:[{id:k,name:q,preferred_common_name:'',default_photo:{medium_url:`https://img.test/photos/${k}/medium.svg`,license_code:'cc-by',attribution:'test'}}]})})}
    const td=u.match(/api\.inaturalist\.org\/v1\/taxa\/(\d+)/);
    if(td){const id=+td[1];return r.fulfill({contentType:'application/json',body:JSON.stringify({results:[{id,ancestors:[],taxon_photos:[1,2,3,4].map(j=>({photo:{medium_url:`https://img.test/photos/${id*100+j}/medium.svg`,license_code:'cc-by',attribution:'test'}}))}]})})}
    if(u.startsWith('https://api.inaturalist.org/'))return r.fulfill({contentType:'application/json',body:'{"results":[]}'});
    if(u.startsWith('https://img.test/')){const n=+(u.match(/photos\/(\d+)/)||[0,1])[1];return r.fulfill({contentType:'image/svg+xml',body:svg(n)})}
    return r.fulfill({status:404,body:''})});
  const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  // graine fixe facultative : même tirage à chaque passage (comparaison de captures)
  if(o.seed)await p.addInitScript(()=>{let x=12345;Math.random=()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648}});
  if(o.state)await p.addInitScript(s=>{if(!sessionStorage.getItem('init')){localStorage.setItem('quizplantes.v1',s);localStorage.setItem('qp.coach','1');sessionStorage.setItem('init','1')}},o.state);
  else await p.addInitScript(()=>{localStorage.setItem('qp.coach','1')});
  await p.goto('file://'+path.resolve(o.file||path.resolve(__dirname,'..','index.html')));await p.waitForTimeout(400);
  await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});await p.waitForTimeout(1700);
  return {b,ctx,p};
}
module.exports={open};
