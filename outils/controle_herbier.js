// Étape 5 : ordre de l'Herbier (acquises puis non acquises, chacune par ordre alphabétique du nom latin). Usage : node outils/controle_herbier.js
const {open}=require('./banc_essai.js');
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
const acq=['Tilia cordata','Betula pendula','Quercus robur','Acer platanoides'],vus=['Fagus sylvatica','Abies alba','Carpinus betulus','Acer campestre'];
const st=JSON.stringify({sp:Object.fromEntries([...acq.map(n=>[n,{b:4,s:6,e:0,d:0}]),...vus.map(n=>[n,{b:2,s:2,e:1,d:0}])]),hist:{},m:{},ho:{arbre:true}});
(async()=>{const {b,p}=await open({state:st});
await p.click('.tabs button[data-t=herb]');await p.waitForTimeout(500);
const l=await p.$$eval('.hc[data-k=arbre] .pk',e=>e.map(x=>[x.dataset.l,x.classList.contains('ok'),x.querySelector('b').textContent]));
const a=l.filter(x=>x[1]).map(x=>x[0]),n=l.filter(x=>!x[1]).map(x=>x[0]);
ok(JSON.stringify(a)===JSON.stringify([...acq].sort()),'acquises par ordre alphabétique latin : '+a.join(', '));
ok(JSON.stringify(n)===JSON.stringify([...vus].sort()),'non acquises ensuite, par ordre alphabétique latin : '+n.join(', '));
ok(l.findIndex(x=>!x[1])===a.length,'aucune non acquise avant une acquise (ex. Abies alba après Tilia cordata)');
ok(l.every(x=>x[2]&&x[2]!==x[0]),'nom vernaculaire toujours sur l\'image');
ok((await p.textContent('.hc[data-k=arbre]')).includes('à découvrir'),'pastille « + N à découvrir » conservée');
await p.click('.tabs button[data-t=pro]');await p.waitForTimeout(300);
ok(!(await p.textContent('#pro')).includes('Collection'),'Progrès : carte Collection retirée');
ok(p.errs.length===0,'aucune erreur JavaScript '+p.errs.join(' | '));
await b.close()})();
