import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {createOnlineMatches} from '../utils/onlineMatches.js';
const pair=(a,b)=>[a,b].sort();
export function createFriendsRouter(db,options={}){
 const router=Router(),online=options.onlineMatches||createOnlineMatches(db,options.onlineOptions),seen=new Map(),limits=new Map();router.onlineMatches=online;
 const user=id=>db.prepare('SELECT id,name,username,avatar FROM users WHERE id=?').get(id);
 const friend=(a,b)=>db.prepare('SELECT * FROM friendships WHERE a=? AND b=?').get(...pair(a,b));
 const accepted=async(a,b)=>(await friend(a,b))?.status==='accepted';
 const safe=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(error=>{if(error.code&&error.status)return res.status(error.status).json({code:error.code});next(error);});
 router.use((req,res,next)=>{seen.set(req.account.id,Date.now());for(const [id,time]of seen)if(Date.now()-time>90000)seen.delete(id);if(req.method==='POST'&&!req.path.includes('/input')){const key=req.account.id,entry=limits.get(key)||{count:0,until:Date.now()+60000};if(entry.until<Date.now()){entry.count=0;entry.until=Date.now()+60000;}limits.set(key,entry);if(++entry.count>90)return res.status(429).json({code:'tooMany'});}next();});
 const expire=()=>db.prepare("UPDATE friend_invites SET status='expired' WHERE status='pending' AND expires<?").run(Date.now());
 router.get('/',safe(async(req,res)=>{
  await expire();const id=req.account.id;
  const [relations,rawInvites,rawMatches,me]=await Promise.all([db.prepare('SELECT * FROM friendships WHERE a=? OR b=?').all(id,id),db.prepare("SELECT * FROM friend_invites WHERE (host=? OR guest=?) AND status IN ('pending','accepted') ORDER BY created DESC LIMIT 30").all(id,id),db.prepare("SELECT * FROM friend_matches WHERE (host=? OR guest=?) AND status IN ('waiting','playing') ORDER BY created DESC").all(id,id),user(id)]);
  const entries=await Promise.all(relations.map(async r=>({...await user(r.a===id?r.b:r.a),status:r.status,incoming:r.sender!==id,online:Date.now()-(seen.get(r.a===id?r.b:r.a)||0)<15000})));
  const invites=await Promise.all(rawInvites.map(async i=>({...i,other:await user(i.host===id?i.guest:i.host)})));
  res.json({me,friends:entries.filter(r=>r.status==='accepted'),incoming:entries.filter(r=>r.status==='pending'&&r.incoming),outgoing:entries.filter(r=>r.status==='pending'&&!r.incoming),invites:invites.filter(i=>i.status==='pending'||online.rooms.has(i.match_id)&&!online.rooms.get(i.match_id).state.finished),matches:rawMatches.filter(m=>online.rooms.has(m.id))});
 }));
 router.get('/search',safe(async(req,res)=>{
  const q=String(req.query.q||'').trim().toLowerCase().replace(/^@/,''),field=['club','name'].includes(req.query.field)?req.query.field:'all',sort=req.query.sort==='club'?'club':'name';
  if(q.length>254)return res.status(400).json({code:'invalid'});
  const offset=Math.max(0,Math.min(1000000,Number.parseInt(req.query.offset,10)||0)),limit=40,pattern='%'+q.replace(/[!%_]/g,c=>'!'+c)+'%';
  const clubName="COALESCE(c.name,json_extract(s.state,'$.name'),u.name || ' FC')";
  const filter=q.includes('@')?'lower(u.email)=?':field==='club'?clubName+" LIKE ? ESCAPE '!'":field==='name'?"u.name LIKE ? ESCAPE '!'":"(u.name LIKE ? ESCAPE '!' OR u.username LIKE ? ESCAPE '!' OR "+clubName+" LIKE ? ESCAPE '!')";
  const args=q.includes('@')?[q]:field==='all'?[pattern,pattern,pattern]:[pattern];
  const joins=' FROM users u LEFT JOIN simulator_clubs c ON c.user_id=u.id LEFT JOIN club_saves s ON s.user_id=u.id WHERE u.id<>? AND '+filter;
  const [count,rows,relations]=await Promise.all([db.prepare('SELECT COUNT(*) total'+joins).get(req.account.id,...args),db.prepare('SELECT u.id,u.name,u.username,u.avatar,'+clubName+' AS clubName'+joins+' ORDER BY '+(sort==='club'?'clubName COLLATE NOCASE,u.name COLLATE NOCASE':'u.name COLLATE NOCASE,clubName COLLATE NOCASE')+',u.id LIMIT ? OFFSET ?').all(req.account.id,...args,limit,offset),db.prepare('SELECT * FROM friendships WHERE a=? OR b=?').all(req.account.id,req.account.id)]);
  const byUser=new Map(relations.map(r=>[r.a===req.account.id?r.b:r.a,r]));
  res.json({total:count.total,offset,users:rows.map(p=>{const r=byUser.get(p.id);return {...p,relation:r?.status||null,incoming:r?.sender===p.id};})});
 }));
 router.post('/username',safe(async(req,res)=>{const username=typeof req.body?.username==='string'?req.body.username.trim().toLowerCase():'';if(!/^[a-z0-9_]{3,24}$/.test(username))return res.status(400).json({code:'invalidUsername'});if(await db.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE AND id<>?').get(username,req.account.id))return res.status(409).json({code:'usernameUsed'});await db.prepare('UPDATE users SET username=? WHERE id=?').run(username,req.account.id);res.json({me:await user(req.account.id)});}));
 router.post('/request',safe(async(req,res)=>{const target=req.body?.userId,id=req.account.id;if(typeof target!=='string'||target===id||!await user(target))return res.status(400).json({code:'invalidFriend'});if(!await friend(id,target))await db.prepare("INSERT OR IGNORE INTO friendships VALUES(?,?,?,'pending',?)").run(...pair(id,target),id,Date.now());res.json({sent:true});}));
 router.post('/respond',safe(async(req,res)=>{const target=req.body?.userId,id=req.account.id,relation=typeof target==='string'?await friend(id,target):null;if(!relation||relation.status!=='pending'||relation.sender===id)return res.status(404).json({code:'notFound'});if(req.body.accept===true)await db.prepare("UPDATE friendships SET status='accepted' WHERE a=? AND b=?").run(...pair(id,target));else await db.prepare('DELETE FROM friendships WHERE a=? AND b=?').run(...pair(id,target));res.json({accepted:req.body.accept===true});}));
 router.post('/remove',safe(async(req,res)=>{const target=req.body?.userId;if(typeof target!=='string')return res.status(400).json({code:'invalidFriend'});await db.prepare('DELETE FROM friendships WHERE a=? AND b=?').run(...pair(req.account.id,target));await db.prepare("UPDATE friend_invites SET status='cancelled' WHERE status='pending' AND ((host=? AND guest=?) OR (host=? AND guest=?))").run(req.account.id,target,target,req.account.id);res.json({removed:true});}));
 router.post('/invite',safe(async(req,res)=>{await expire();const host=req.account.id,guest=req.body?.userId;if(typeof guest!=='string'||!await accepted(host,guest))return res.status(403).json({code:'needFriend'});await online.savedClub(host);if(online.busy(host)||online.busy(guest))return res.status(409).json({code:'busy'});const previous=await db.prepare("SELECT id FROM friend_invites WHERE host=? AND guest=? AND status='pending'").get(host,guest);if(previous)return res.json({id:previous.id});const id=randomUUID();await db.prepare("INSERT INTO friend_invites VALUES(?,?,?,'pending',?,?,NULL)").run(id,host,guest,Date.now(),Date.now()+300000);res.json({id});}));
 router.post('/invite/respond',safe(async(req,res)=>{await expire();const invite=await db.prepare('SELECT * FROM friend_invites WHERE id=? AND guest=?').get(req.body?.inviteId||'',req.account.id);if(!invite)return res.status(404).json({code:'notFound'});if(invite.status==='accepted'&&online.rooms.has(invite.match_id))return res.json({matchId:invite.match_id});if(invite.status!=='pending')return res.status(409).json({code:'inviteExpired'});if(req.body.accept!==true){await db.prepare("UPDATE friend_invites SET status='declined' WHERE id=?").run(invite.id);return res.json({declined:true});}if(!await accepted(invite.host,invite.guest))return res.status(403).json({code:'needFriend'});const room=await online.create(invite.host,invite.guest);await db.prepare("UPDATE friend_invites SET status='accepted',match_id=? WHERE id=?").run(room.id,invite.id);await db.prepare("UPDATE friend_invites SET status='cancelled' WHERE id<>? AND status='pending' AND (host IN (?,?) OR guest IN (?,?))").run(invite.id,invite.host,invite.guest,invite.host,invite.guest);res.json({matchId:room.id});}));
 router.post('/invite/cancel',safe(async(req,res)=>{await db.prepare("UPDATE friend_invites SET status='cancelled' WHERE id=? AND host=? AND status='pending'").run(req.body?.inviteId||'',req.account.id);res.json({cancelled:true});}));
 router.post('/match/:id/join',safe((req,res)=>res.json(online.join(req.params.id,req.account.id))));
 router.get('/match/:id',safe((req,res)=>{const room=online.get(req.params.id,req.account.id);res.json(online.snapshot(room,req.account.id));}));
 router.post('/match/:id/input',safe((req,res)=>res.json(online.control(req.params.id,req.account.id,req.body))));
 router.post('/match/:id/leave',safe((req,res)=>res.json(online.leave(req.params.id,req.account.id))));
 return router;
}
