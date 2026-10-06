// Étape 8 : mesure des requêtes photos en usage rapide (iNaturalist simulé, avec sa limite de 60 requêtes/minute).
// Usage : node outils/mesure_photos.js [secondes=180] [wiki=non|oui] [bloque=0]   (variable F = autre fichier html)
//   wiki=oui : Wikipédia répond avec une photo ; bloque=N : le service est déjà en pause pendant les N premières secondes
const {chromium}=require('playwright');const path=require('path');
const DUREE=(+process.argv[2]||180)*1000,WIKI=process.argv[3]==='oui',BLOQUE=(+process.argv[4]||0)*1000;
const svg=n=>`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="hsl(${(n*47)%360},45%,45%)"/></svg>`;
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const T0=Date.now(),reqs=[];let n429=0,k=0;
  await ctx.route(/^https?:/,async r=>{const u=r.request().url(),now=Date.now();
    if(u.startsWith('https://api.inaturalist.org/')){
      reqs.push(now);
      if(now-T0<BLOQUE||reqs.filter(t=>now-t<6e4).length>60){n429++;return r.fulfill({status:429,body:'{}'})}
      await new Promise(x=>setTimeout(x,150+Math.random()*250));
      const q=u.match(/taxa\?q=([^&]+)/),td=u.match(/taxa\/(\d+)/);k++;
      if(q)return r.fulfill({contentType:'application/json',body:JSON.stringify({results:[{id:k,name:decodeURIComponent(q[1]),default_photo:{medium_url:`https://img.test/photos/${k}/medium.svg`,license_code:'cc-by'}}]})});
      if(td)return r.fulfill({contentType:'application/json',body:JSON.stringify({results:[{id:+td[1],ancestors:[],taxon_photos:[1,2,3].map(j=>({photo:{medium_url:`https://img.test/photos/${td[1]*100+j}/medium.svg`,license_code:'cc-by'}}))}]})});
      return r.fulfill({contentType:'application/json',body:JSON.stringify({results:[{id:k,uri:'x',photos:[{url:`https://img.test/photos/${9000+k}/medium.svg`}]}]})});
    }
    if(u.startsWith('https://img.test/')){const n=+(u.match(/photos\/(\d+)/)||[0,1])[1];return r.fulfill({contentType:'image/svg+xml',body:svg(n)})}
    if(WIKI&&/wikipedia\.org\/api\/rest_v1\/page\/summary/.test(u)){k++;return r.fulfill({contentType:'application/json',body:JSON.stringify({content_urls:{desktop:{page:'x'}},extract:'',thumbnail:{source:`https://img.test/photos/${50000+k}/800px-a.svg`}})})}
    return r.fulfill({status:404,body:''})});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('qp.coach','1')});
  await p.goto('file://'+path.resolve(process.env.F||path.join(__dirname,'..','index.html')));
  await p.waitForTimeout(300);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.click()});
  const attentes=[];let aucune=0,questions=0;const fin=Date.now()+DUREE;
  while(Date.now()<fin){
    const t=Date.now();
    const etat=await p.waitForFunction(()=>{if(/Aucune image/.test($('pic').textContent))return 'aucune';if(done)return null;if(pvSet&&[...document.querySelectorAll('#opts img')].every(i=>i.complete))return 'ok';const i=document.querySelector('#pic img');return i&&i.complete&&i.naturalWidth?'ok':null},null,{timeout:120000,polling:100}).then(h=>h.jsonValue()).catch(()=>'délai');
    attentes.push(Date.now()-t);
    if(etat==='aucune'){aucune++;await p.click('#q-retry').catch(()=>{});continue}
    if(etat!=='ok'){console.log('question jamais affichée ('+etat+')');break}
    questions++;await p.waitForTimeout(700);
    if(await p.evaluate(()=>typed)){await p.fill('#q-input','abc def');await p.press('#q-input','Enter')}else await p.click('#opts button');
    await p.waitForTimeout(600);await p.click('#shn').catch(()=>{});
  }
  const ws=[];for(const t of reqs){ws.push(reqs.filter(x=>x>=t&&x<t+6e4).length)}
  const st=await p.evaluate(()=>{let n=0,o=0;try{const s=localStorage.getItem('quizplantes.inat.v1')||'';o=s.length;n=Object.keys(JSON.parse(s||'{}')).length}catch(e){}return {n,o}});
  const m=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0,med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]||0};
  console.log(JSON.stringify({duree_s:DUREE/1000,questions,requetes:reqs.length,par_minute_max:Math.max(0,...ws),refus_429:n429,attente_moy_ms:m(attentes),attente_med_ms:med(attentes),attente_max_ms:Math.max(0,...attentes),ecrans_aucune_image:aucune,cache_entrees:st.n,cache_octets:st.o,erreurs_js:errs.length}));
  await b.close();
})();
