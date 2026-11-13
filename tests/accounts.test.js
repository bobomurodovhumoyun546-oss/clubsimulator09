import {test} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createAccountRouter} from '../backend/routes/accounts.js';
import {openAccountStore} from '../backend/utils/accountStore.js';

test('signup, eight-character passwords, login, private club saves and logout work independently',async()=>{
 const db=openAccountStore(':memory:'),app=express();app.use(express.json());app.use('/api/auth',createAccountRouter(db));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base=`http://127.0.0.1:${server.address().port}/api/auth`;
 const request=(path,body,cookie)=>fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 try{
  const response=await request('/signup',{name:'Manager Example',email:'manager@example.com',password:'lewagoat'});assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie').split(';')[0],user=(await response.json()).user;assert.equal(user.email,'manager@example.com');
  assert.equal((await request('/me',null,cookie)).status,200);
  assert.equal((await request('/club-save')).status,401);
  const club={version:1,name:'Legacy FC',coins:123456,owned:['p1'],lineup:Array(11).fill(null),formation:'4-3-3',bench:['p1',null,null,null,null,null,null]};
  assert.equal((await request('/club-save',{club},cookie)).status,200);
  assert.deepEqual((await (await request('/club-save',null,cookie)).json()).club,club);
  const other=await request('/signup',{name:'Other Manager',email:'other@example.com',password:'lewagoat'}),otherCookie=other.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await request('/club-save',null,otherCookie)).json()).club,null);
  assert.equal((await request('/logout',{},cookie)).status,200);
  assert.equal((await request('/club-save',null,cookie)).status,401);
  const login=await request('/login',{email:'manager@example.com',password:'lewagoat'});assert.equal(login.status,200);
  const restoredCookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await (await request('/club-save',null,restoredCookie)).json()).club.coins,123456);
  assert.equal((await request('/login',{email:'manager@example.com',password:'wrong'})).status,401);
 }finally{await new Promise(resolve=>server.close(resolve));db.close();}
});
