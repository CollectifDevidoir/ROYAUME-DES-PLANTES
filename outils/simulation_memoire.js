// Étape 6 : simulation de la progression (vrai code de l'appli + joueur simulé qui apprend et oublie).
// Compare la version actuelle et des variantes qui ne touchent qu'aux niveaux 1 à 3.
// Usage : node outils/simulation_memoire.js [jours=30] [graines=8]
const {chromium}=require('playwright');const path=require('path');
const JOURS=+process.argv[2]||30,GRAINES=+process.argv[3]||8,PAR_JOUR=40;
// Variantes : remplacements dans la fonction srs() de l'appli
const VARIANTES={
  actuelle:[],
  A_palier2:[["if(p.c>=2){p.b=3;p.c=0}","if(p.c>=3){p.b=3;p.c=0}"]],
  A2_palier2_QCM:[["if(b0===2){p.c+=fmt==='mcq'?1:2;if(p.c>=2){p.b=3;p.c=0}}","if(b0===2){p.c+=fmt==='mcq'?1:3;if(p.c>=3){p.b=3;p.c=0}}"]],
  C2_ecriture_si_erreur:[["if(fmt==='typed'){p.b=4;p.c=0;acqNow=true}else{p.c+=fmt==='pv'?1:.5;","if(fmt==='typed'&&(p.c>0||p.e===0)){p.b=4;p.c=0;acqNow=true}else{p.c+=fmt==='typed'?1:fmt==='pv'?1:.5;"]],
  C_ecriture:[["if(fmt==='typed'){p.b=4;p.c=0;acqNow=true}else{p.c+=fmt==='pv'?1:.5;","if(fmt==='typed'&&p.c>0){p.b=4;p.c=0;acqNow=true}else{p.c+=fmt==='typed'?1:fmt==='pv'?1:.5;"]],
};
const SIM=function(o){
  // hasard reproductible
  let sd=o.graine*9973+17;Math.random=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646};
  let T=Date.UTF?0:Date.parse('2026-01-05T08:00:00');const realNow=Date.now;Date.now=()=>T;
  // variante
  let src=srs.toString();for(const[a,b]of o.rep){if(!src.includes(a))throw new Error('motif absent : '+a);src=src.split(a).join(b)}
  srs=(0,eval)('('+src+')');
  st={sp:{},day:{},m:{}};fix();replay=null;mode='tout';organ='';bad.clear();last=null;cur=null;recent=[];sess=new Set();soon=[];qN=0;tyRun={t:'',n:0};streak=0;
  // joueur simulé : force K (0-1), stabilité S (heures), facilité selon la plante
  // Courbe d'oubli de type FSRS : R = K / (1 + t/(9·S)), S = stabilité en jours (R = 0,9·K au bout de S jours)
  const L={},D=864e5;
  const R=(l)=>l.K/(1+(T-l.t)/D/(9*l.S));
  const pOK=(l,ty)=>{const r=R(l);return ty==='typed'?Math.pow(r,1.3)*.97:ty==='pv'?r+(1-r)*.3:r+(1-r)*.35};
  const learn=(l,ty,good)=>{const r=R(l);
    if(good){l.K=Math.min(1,l.K+(1-l.K)*(ty==='typed'?.45:ty==='pv'?.35:.3)*l.f);l.S*=1+(ty==='typed'?2.5:ty==='pv'?1.8:1.2)*Math.max(.1,1.1-r)}
    else{l.K=Math.min(1,l.K+(1-l.K)*.35*l.f);l.S=Math.max(.2,l.S*.5)}
    l.t=T};
  const acqQ={},stats={q:0,ok:0,acq:0,chute:0};
  for(let d=0;d<o.jours;d++){
    T=Date.parse('2026-01-05T08:00:00')+d*864e5;
    for(let k=0;k<o.parJour;k++){
      T+=12e3;
      const s=pick();cur=s;const ty=exType(s);
      const l=L[s[0]]||(L[s[0]]={K:0,S:.3,t:T,f:1/(1+.2*lvl(s)),n:0});
      const good=Math.random()<pOK(l,ty);l.n++;
      acqNow=false;const p=st.sp[s[0]]||(st.sp[s[0]]={b:1,s:0,e:0,d:0});const b0=p.b;
      srs(p,good,ty);
      if(b0>=4&&p.b<4)stats.chute++;
      qN++;if(acqNow&&Math.random()<.7&&!soon.some(x=>x.n===s[0]))soon.push({n:s[0],q:qN+10+Math.floor(Math.random()*13)});
      recent.push(s[0]);if(recent.length>8)recent.shift();sess.add(s[0]);
      if((p.s===1||!good)&&!soon.some(x=>x.n===s[0]))soon.push({n:s[0],q:qN+(good?3:4)+Math.floor(Math.random()*3)});
      if(acqNow&&!acqQ[s[0]]){acqQ[s[0]]=l.n;stats.acq++}
      stats.q++;if(good)stats.ok++;
      learn(l,ty,good);last=s[0];
    }
  }
  // rétention : une semaine sans jouer, puis écriture du nom latin pour chaque plante acquise
  const fin=T;T=fin+7*864e5;
  const acq=Object.keys(st.sp).filter(n=>st.sp[n].b>=4);
  const ret=acq.length?acq.reduce((a,n)=>a+pOK(L[n],'typed'),0)/acq.length:0;
  const q=Object.values(acqQ);Date.now=realNow;
  return {q:q.reduce((a,b)=>a+b,0)/q.length,acq:acq.length,ret,reussite:stats.ok/stats.q,chute:stats.chute,vues:Object.keys(st.sp).length};
};
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
  const ctx=await b.newContext();await ctx.route(/^https?:/,r=>r.abort());
  const p=await ctx.newPage();
  await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(800);
  const res={};
  for(const[nom,rep]of Object.entries(VARIANTES)){
    const r=[];for(let g=1;g<=GRAINES;g++){await p.reload();await p.waitForTimeout(300);r.push(await p.evaluate(`(${SIM.toString()})(${JSON.stringify({graine:g,rep,jours:JOURS,parJour:PAR_JOUR})})`))}
    const m=k=>r.reduce((a,x)=>a+x[k],0)/r.length;res[nom]={q:m('q'),acq:m('acq'),ret:m('ret'),reussite:m('reussite'),chute:m('chute'),vues:m('vues')};
  }
  const b0=res.actuelle,pc=(x,y)=>(x>=y?'+':'')+Math.round(100*(x-y)/y)+' %';
  console.log(`Simulation : ${JOURS} jours × ${PAR_JOUR} exercices, ${GRAINES} joueurs simulés par variante\n`);
  console.log('variante      | questions pour acquérir | acquises au bout | rétention à +7 j | réussite en jeu | rechutes');
  for(const[n,x]of Object.entries(res))console.log(`${n.padEnd(13)} | ${x.q.toFixed(2).padStart(5)} (${n==='actuelle'?'réf.':pc(x.q,b0.q)})`.padEnd(42)+`| ${x.acq.toFixed(1).padStart(5)} (${n==='actuelle'?'réf.':pc(x.acq,b0.acq)})`.padEnd(19)+`| ${(100*x.ret).toFixed(1)} %`.padEnd(19)+`| ${(100*x.reussite).toFixed(1)} %`.padEnd(18)+`| ${x.chute.toFixed(1)}`);
  await b.close();
})();
