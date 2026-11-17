import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createAccountRouter} from '../backend/routes/accounts.js';
import {openAccountStore} from '../backend/utils/accountStore.js';
import {applyClubGrants} from '../src/features/matchMoments.js';
test('NEWCLUBSIM requires login and awards exactly 500000 once per account, including concurrent retries',async()=>{
 const db=openAccountStore(':memory:'),app=express(),router=createAccountRouter(db);app.use(express.json());app.use('/api/auth',router);
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port+'/api/auth';
 const request=async(path,body,cookie)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
  assert.equal((await request('/promo/redeem',{code:'NEWCLUBSIM'})).status,401);
  const a=await request('/signup',{name:'Promo A',email:'promo-a@example.com',password:'strongpass'}),b=await request('/signup',{name:'Promo B',email:'promo-b@example.com',password:'strongpass'});
  assert.equal((await request('/promo/redeem',{code:'WRONG'},a.cookie)).status,400);assert.equal(db.prepare('SELECT COUNT(*) n FROM club_grants').get().n,0);
  const attempts=await Promise.all([request('/promo/redeem',{code:' newclubsim ',amount:9000000,userId:b.body.user.id},a.cookie),request('/promo/redeem',{code:'NEWCLUBSIM'},a.cookie)]);
  assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);const winner=attempts.find(r=>r.status===200);assert.equal(winner.body.grant.amount,500000);
  const grants=(await request('/club-grants',null,a.cookie)).body.grants;assert.equal(grants.length,1);assert.equal(grants[0].amount,500000);
  const club={coins:25000},applied=applyClubGrants(club,grants);assert.equal(applied.coins,525000);assert.equal(applyClubGrants(applied,grants),applied);
  assert.equal((await request('/club-grants',null,b.cookie)).body.grants.length,0);assert.equal((await request('/promo/redeem',{code:'NEWCLUBSIM'},b.cookie)).status,200);
  await request('/logout',{},a.cookie);const login=await request('/login',{email:'promo-a@example.com',password:'strongpass'});assert.equal((await request('/promo/redeem',{code:'NEWCLUBSIM'},login.cookie)).status,409);
 }finally{router.onlineMatches.close();await new Promise(resolve=>server.close(resolve));db.close();}
});
