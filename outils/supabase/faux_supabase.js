// Faux Supabase pour les tests (aucun réseau) : une vraie base PostgreSQL en WebAssembly (PGlite)
// qui exécute supabase/schema.sql, plus un faux service d'authentification (GoTrue) et l'appel
// des fonctions (PostgREST /rest/v1/rpc). Le schéma « auth » de Supabase est imité au minimum.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {PGlite}=require('@electric-sql/pglite');
const AUTH=`
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text unique, mdp text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
-- comme Supabase : droits par défaut larges sur le schéma public (le schéma doit les retirer lui-même)
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;`;
async function base(){
  const db=new PGlite();await db.exec(AUTH);
  await db.exec(fs.readFileSync(path.resolve(__dirname,'..','..','supabase','schema.sql'),'utf8'));
  return db;
}
// Exécute une requête « en tant que » un utilisateur (rôle authenticated et identifiant dans le jeton)
async function comme(db,uid,sql,params=[]){
  return db.transaction(async tx=>{
    await tx.exec(`set local role ${uid?'authenticated':'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`,[uid||'']);
    return tx.query(sql,params);
  });
}
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jeton=u=>{const exp=Math.floor(Date.now()/1000)+3600;return b64({alg:'HS256',typ:'JWT'})+'.'+b64({sub:u.id,email:u.email,role:'authenticated',aud:'authenticated',exp,iat:exp-3600,session_id:crypto.randomUUID()})+'.sig'};
const session=u=>({access_token:jeton(u),token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'r-'+u.id,user:{id:u.id,aud:'authenticated',role:'authenticated',email:u.email,app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}});
const sub=h=>{try{return JSON.parse(Buffer.from((h||'').replace(/^Bearer /,'').split('.')[1],'base64url').toString()).sub}catch(e){return null}};
// Branche le faux Supabase sur une page Playwright : URL de projet, bibliothèque supabase-js locale.
async function brancher(page,db,url,journal=[]){
  const lib=fs.readFileSync(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'),'utf8');
  await page.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^/]+\/dist\/umd\/supabase\.js/,r=>r.fulfill({status:200,contentType:'application/javascript',body:lib,headers:{'access-control-allow-origin':'*'}}));
  await page.route(url+'/**',async r=>{
    const q=r.request(),u=new URL(q.url()),cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
    if(q.method()==='OPTIONS')return r.fulfill({status:204,headers:cors});
    const js=(s,o)=>r.fulfill({status:s,headers:{...cors,'content-type':'application/json'},body:o===undefined?'':JSON.stringify(o)});
    let corps={};try{corps=JSON.parse(q.postData()||'{}')}catch(e){}
    // la mesure d'audience anonyme est comptée à part : le journal ne garde que le trafic lié au compte
    if(u.pathname==='/rest/v1/rpc/compter_visite')journal.visites=(journal.visites||0)+1;else journal.push(u.pathname+u.search);
    if(u.pathname==='/auth/v1/signup'){
      const ex=(await db.query('select * from auth.users where email=$1',[corps.email])).rows[0];
      if(ex)return js(422,{code:422,error_code:'user_already_exists',msg:'User already registered'});
      const id=crypto.randomUUID();await db.query('insert into auth.users(id,email,mdp) values($1,$2,$3)',[id,corps.email,corps.password]);
      return js(200,session({id,email:corps.email}));
    }
    if(u.pathname==='/auth/v1/token'&&u.searchParams.get('grant_type')==='password'){
      const ex=(await db.query('select * from auth.users where email=$1 and mdp=$2',[corps.email,corps.password])).rows[0];
      if(!ex)return js(400,{code:400,error_code:'invalid_credentials',msg:'Invalid login credentials'});
      return js(200,session(ex));
    }
    if(u.pathname==='/auth/v1/token'&&u.searchParams.get('grant_type')==='refresh_token'){
      const id=(corps.refresh_token||'').slice(2),ex=(await db.query('select * from auth.users where id::text=$1',[id])).rows[0];
      return ex?js(200,session(ex)):js(400,{code:400,error_code:'refresh_token_not_found',msg:'Invalid Refresh Token'});
    }
    // lien de connexion par e-mail : le compte est créé au besoin ; le lien « reçu » est noté dans journal.lien
    if(u.pathname==='/auth/v1/otp'){
      let ex=(await db.query('select * from auth.users where email=$1',[corps.email])).rows[0];
      if(!ex){ex={id:crypto.randomUUID(),email:corps.email};await db.query('insert into auth.users(id,email) values($1,$2)',[ex.id,ex.email])}
      const s=session(ex);journal.push('lien:'+corps.email);
      journal.lien=(u.searchParams.get('redirect_to')||'')+'#access_token='+s.access_token+'&refresh_token='+s.refresh_token+'&expires_in=3600&expires_at='+s.expires_at+'&token_type=bearer&type=magiclink';
      return js(200,{});
    }
    if(u.pathname==='/auth/v1/logout')return r.fulfill({status:204,headers:cors});
    if(u.pathname==='/auth/v1/user'){const id=sub(q.headers()['authorization']),ex=id&&(await db.query('select * from auth.users where id=$1',[id])).rows[0];return ex?js(200,session(ex).user):js(401,{code:401,msg:'invalid JWT'})}
    const m=u.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    if(m){
      const id=sub(q.headers()['authorization']);const noms=Object.keys(corps);
      try{
        const res=await comme(db,id,`select public.${m[1]}(${noms.map((n,i)=>`${n} => $${i+1}`).join(',')}) as r`,noms.map(n=>corps[n]!==null&&typeof corps[n]==='object'?JSON.stringify(corps[n]):corps[n]));
        const v=res.rows[0].r;return v===null||v===undefined?r.fulfill({status:204,headers:cors}):js(200,v);
      }catch(e){return js(400,{code:e.code||'P0001',message:e.message,details:null,hint:null})}
    }
    return js(404,{message:'introuvable : '+u.pathname});
  });
}
module.exports={base,comme,brancher};
