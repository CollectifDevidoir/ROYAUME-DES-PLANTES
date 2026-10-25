// Affiche un exercice du type voulu et attend qu'il soit prêt
module.exports=async function lance(p,ty){
  for(let k=0;k<6;k++){
    await p.evaluate(t=>{exType=()=>t;pre=null;next()},ty);
    try{await p.waitForFunction(t=>{if($('pic').classList.contains('sk'))return false;if(t==='pv')return true;const i=document.querySelector('#pic img');return i&&i.complete},ty,{timeout:20000})}catch(e){}
    const ok=await p.evaluate(t=>t==='pv'?!!pvSet:(!pvSet&&typed===(t==='typed')&&!!document.querySelector('#pic img')),ty);
    if(ok){if(ty==='pv')await p.waitForFunction(()=>[...document.querySelectorAll('#opts img')].every(i=>i.complete),null,{timeout:15000}).catch(()=>{});await p.waitForTimeout(300);return true}
  }
  return false;
}
