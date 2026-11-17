import test from 'node:test';
import assert from 'node:assert/strict';
import {openAccountStore} from '../backend/utils/accountStore.js';
import {claimGift,listGifts,giftSchedule} from '../backend/utils/gifts.js';
import {createAccountRouter} from '../backend/routes/accounts.js';
import express from 'express';
test('gifts are server dated, once per account/day, and Thursday only in Tashkent',async()=>{
 const db=openAccountStore(':memory:');try{
 for(const id of ['a','b'])db.prepare('INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)').run(id,id+'@test.com',id,'unused');
 const wed=new Date('2026-11-18T18:59:59Z'),thu=new Date('2026-11-18T19:00:00Z'),fri=new Date('2026-11-19T19:00:00Z');
 assert.equal(giftSchedule(wed)[2].available,false);assert.equal(giftSchedule(thu)[2].available,true);assert.equal(giftSchedule(fri)[2].available,false);
 const attempts=await Promise.all([claimGift(db,'a','welcome',thu),claimGift(db,'a','welcome',thu)]);assert.equal(attempts.filter(r=>r.grant).length,1);assert.equal(attempts.find(r=>r.grant).grant.amount,50000);
 assert.equal((await claimGift(db,'a','daily',wed)).grant.amount,10000);assert.equal((await claimGift(db,'a','daily',wed)).status,409);assert.equal((await claimGift(db,'a','daily',thu)).grant.amount,10000);
 assert.equal((await claimGift(db,'a','thursday',wed)).status,400);assert.equal((await claimGift(db,'a','thursday',thu)).grant.amount,60000);assert.equal((await claimGift(db,'a','thursday',thu)).status,409);assert.equal((await claimGift(db,'a','thursday',fri)).status,400);
 assert.equal((await claimGift(db,'a','invalid',thu)).status,400);assert.equal((await claimGift(db,'b','welcome',thu)).grant.amount,50000);
 assert.ok((await listGifts(db,'a',thu)).every(g=>g.claimed));
 }finally{db.close();}
});
test('gift routes require an account and ignore forged amounts and dates',async()=>{
 const db=openAccountStore(':memory:'),router=createAccountRouter(db),app=express();app.use(express.json());app.use('/api/auth',router);const server=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});const base='http://127.0.0.1:'+server.address().port+'/api/auth';
 try{
 assert.equal((await fetch(base+'/gifts')).status,401);
 assert.equal((await fetch(base+'/gifts/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'welcome'})})).status,401);
 const signup=await fetch(base+'/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Gift User',email:'gifts@test.com',password:'secure123'})}),cookie=signup.headers.get('set-cookie').split(';')[0];assert.equal(signup.status,200);
 const claim=await fetch(base+'/gifts/claim',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({kind:'welcome',amount:9999999,userId:'another',date:'2030-01-01'})});assert.equal(claim.status,200);assert.equal((await claim.json()).grant.amount,50000);
 const list=await fetch(base+'/gifts',{headers:{Cookie:cookie}});assert.equal((await list.json()).gifts[0].claimed,true);
 }finally{router.onlineMatches.close();await new Promise(r=>server.close(r));db.close();}
});
