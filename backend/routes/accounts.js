import {createFriendsRouter} from './friends.js';
import { Router } from 'express';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { hashPassword, verifyPassword } from '../utils/passwords.js';
import { openAccountStore } from '../utils/accountStore.js';

const cookieName='clubsim-session', duration=7*86400000;
const cookieOptions={httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/api/auth'};
const digest=token=>createHash('sha256').update(token).digest('hex');
const tokenOf=req=>req.headers.cookie?.split(';').map(p=>p.trim()).find(p=>p.startsWith(cookieName+'='))?.slice(cookieName.length+1);
const dayOf=()=>new Date().toISOString().slice(0,10);
const avatars=['⚽','🏆','🦁','🦅','🐺','⭐','🧤','🔥'];
export function createAccountRouter(db=openAccountStore(),options={}) {
  const router=Router(), attempts=new Map();
  const publicUser=user=>user?{id:user.id,name:user.name,username:user.username,email:user.email,avatar:user.avatar,xp:user.xp,level:1+Math.floor(user.xp/500)}:null;
  const getUser=req=>{
    const token=tokenOf(req);if(!token||!/^[-\w]{43}$/.test(token))return null;
    return db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>?').get(digest(token),Date.now())||null;
  };
  router.use((req,res,next)=>{
    res.set('Cache-Control','no-store');
    if(req.method==='POST'){
      if(!req.is('application/json'))return res.status(415).json({code:'invalid'});
      const origin=req.headers.origin;
      if(origin&&new URL(origin).host!==req.headers.host)return res.status(403).json({code:'invalidRequest'});
      if(['/login','/signup'].includes(req.path)){
        const now=Date.now();for(const [key,value]of attempts)if(value.until<now)attempts.delete(key);
        const entry=attempts.get(req.ip)||{count:0,until:now+15*60000};attempts.set(req.ip,entry);
        if(++entry.count>20)return res.status(429).set('Retry-After','900').json({code:'tooMany'});
      }
    }
    req.account=getUser(req);next();
  });
  function startSession(req,res,user){
    const old=tokenOf(req);if(old)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(old));
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    const token=randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),user.id,Date.now()+duration);
    res.cookie(cookieName,token,{...cookieOptions,maxAge:duration});res.json({user:publicUser(user)});
  }
  router.get('/me',(req,res)=>res.json({user:publicUser(req.account)}));
  router.post('/signup',async(req,res)=>{
    const {name,email,password}=req.body||{};
    if(typeof name!=='string'||name.trim().length<2||name.trim().length>40)return res.status(400).json({code:'invalidName'});
    if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({code:'invalidEmail'});
    if(typeof password!=='string'||password.length<8||password.length>128)return res.status(400).json({code:'invalidPassword'});
    const normalized=email.trim().toLowerCase();
    if(db.prepare('SELECT id FROM users WHERE email=?').get(normalized))return res.status(409).json({code:'emailUsed'});
    const hash=await hashPassword(password), id=randomUUID();
    const inserted=db.prepare('INSERT OR IGNORE INTO users(id,email,name,password_hash) VALUES(?,?,?,?)').run(id,normalized,name.trim(),hash).changes;
    if(!inserted)return res.status(409).json({code:'emailUsed'});
    const username=(name.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,14)||'manager')+'_'+id.replace(/-/g,'').slice(0,8);
    db.prepare('UPDATE users SET username=? WHERE id=?').run(username,id);
    startSession(req,res,db.prepare('SELECT * FROM users WHERE id=?').get(id));
  });
  router.post('/login',async(req,res)=>{
    const {email,password}=req.body||{};
    if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>128)return res.status(400).json({code:'invalid'});
    const user=db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase());
    const correct=await verifyPassword(password,user?.password_hash||`scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if(!user||!correct)return res.status(401).json({code:'credentials'});startSession(req,res,user);
  });
  router.post('/logout',(req,res)=>{const token=tokenOf(req);if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));res.clearCookie(cookieName,cookieOptions);res.json({user:null});});
  router.get('/leaderboard',(req,res)=>res.json({entries:db.prepare('SELECT u.id,u.name,u.avatar,u.xp,COALESCE(SUM(r.score),0) AS score FROM users u LEFT JOIN results r ON r.user_id=u.id GROUP BY u.id ORDER BY score DESC,u.xp DESC,u.name LIMIT 50').all().map(u=>({...u,level:1+Math.floor(u.xp/500)}))}));
  router.get('/quizzes',(req,res)=>res.json({quizzes:db.prepare('SELECT q.id,q.title,q.questions,q.created,u.name AS author FROM quizzes q JOIN users u ON q.user_id=u.id ORDER BY q.created DESC LIMIT 100').all().map(q=>({...q,questions:JSON.parse(q.questions)}))}));
  router.get('/clubs',(req,res)=>res.json({clubs:db.prepare('SELECT u.id,u.name AS owner,COALESCE(c.name,u.name || \' FC\') AS name,COALESCE(c.season,1) AS season,COALESCE(c.played,0) AS played,COALESCE(c.wins,0) AS wins,COALESCE(c.draws,0) AS draws,COALESCE(c.losses,0) AS losses,COALESCE(c.goals_for,0) AS goalsFor,COALESCE(c.goals_against,0) AS goalsAgainst FROM users u LEFT JOIN simulator_clubs c ON c.user_id=u.id').all()}));
  router.use((req,res,next)=>req.account?next():res.status(401).json({code:'credentials'}));
  const friends=createFriendsRouter(db,options);router.onlineMatches=friends.onlineMatches;router.use('/friends',friends);
  router.get('/club-save',(req,res)=>{const row=db.prepare('SELECT state,updated FROM club_saves WHERE user_id=?').get(req.account.id);res.json({club:row?JSON.parse(row.state):null,updated:row?.updated||null});});
  router.post('/club-save',(req,res)=>{
    const club=req.body?.club;
    if(!club||club.version!==1||!Array.isArray(club.owned)||club.owned.length>10000||club.owned.some(id=>typeof id!=='string')||!Array.isArray(club.lineup)||club.lineup.length!==11||!Number.isSafeInteger(club.coins)||club.coins<0||typeof club.name!=='string'||club.name.length>24||typeof club.formation!=='string')return res.status(400).json({code:'invalid'});
    const updated=new Date().toISOString();db.prepare('INSERT INTO club_saves VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,updated=excluded.updated').run(req.account.id,JSON.stringify(club),updated);res.json({saved:true,updated});
  });
  router.get('/club-grants',(req,res)=>res.json({grants:db.prepare('SELECT id,amount FROM club_grants WHERE user_id=?').all(req.account.id)}));
  router.post('/club',(req,res)=>{
    const {name,played,wins,draws,losses,goalsFor,goalsAgainst,season=1}=req.body||{};
    if(typeof name!=='string'||!name.trim()||name.trim().length>24||[played,wins,draws,losses,goalsFor,goalsAgainst].some(n=>!Number.isSafeInteger(n)||n<0||n>10000000)||wins+draws+losses!==played||goalsFor>played*10||goalsAgainst>played*10)return res.status(400).json({code:'invalid'});
    if(!Number.isSafeInteger(season)||season<1||season>1000000)return res.status(400).json({code:'invalid'});
    db.prepare('INSERT INTO simulator_clubs(user_id,name,played,wins,draws,losses,goals_for,goals_against,season) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,played=excluded.played,wins=excluded.wins,draws=excluded.draws,losses=excluded.losses,goals_for=excluded.goals_for,goals_against=excluded.goals_against,season=excluded.season WHERE excluded.season>simulator_clubs.season OR (excluded.season=simulator_clubs.season AND excluded.played>=simulator_clubs.played)').run(req.account.id,name.trim(),played,wins,draws,losses,goalsFor,goalsAgainst,season);
    res.json({saved:true});
  });
  router.post('/profile',(req,res)=>{
    const {name,avatar}=req.body||{};
    if(typeof name!=='string'||name.trim().length<2||name.trim().length>40||!avatars.includes(avatar))return res.status(400).json({code:'invalid'});
    db.prepare('UPDATE users SET name=?,avatar=? WHERE id=?').run(name.trim(),avatar,req.account.id);
    res.json({user:publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.account.id))});
  });
  router.post('/results',(req,res)=>{
    const {id,gameId,score,correct,total}=req.body||{};
    if(typeof id!=='string'||!/^[\w-]{8,80}$/.test(id)||typeof gameId!=='string'||gameId.length>60||!Number.isInteger(score)||score<0||score>50000||!Number.isInteger(total)||total<1||total>100||!Number.isInteger(correct)||correct<0||correct>total)return res.status(400).json({code:'invalid'});
    const user=req.account.id,day=dayOf();
    if(db.prepare('SELECT count(*) AS n FROM results WHERE user_id=? AND day=?').get(user,day).n>=100)return res.status(429).json({code:'tooMany'});
    db.exec('BEGIN IMMEDIATE');
    try{
      const inserted=db.prepare('INSERT OR IGNORE INTO results VALUES(?,?,?,?,?,?,?)').run(`${user}:${id}`,user,gameId,score,correct,total,day).changes;
      if(inserted)db.prepare('UPDATE users SET xp=xp+? WHERE id=?').run(Math.min(300,10+correct*10),user);
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
    res.json({user:publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(user))});
  });
  router.get('/progress',(req,res)=>{
    const results=db.prepare('SELECT game AS gameId,score,correct,total,day FROM results WHERE user_id=? ORDER BY rowid DESC LIMIT 500').all(req.account.id);
    const statistics=db.prepare('SELECT COUNT(*) AS played,COUNT(DISTINCT game) AS games,COALESCE(MAX(correct=total),0) AS perfect FROM results WHERE user_id=?').get(req.account.id);
    res.json({results,statistics,day:dayOf()});
  });
  router.post('/quizzes',(req,res)=>{
    const {title,questions}=req.body||{};
    if(typeof title!=='string'||title.trim().length<3||title.length>80||!Array.isArray(questions)||questions.length<1||questions.length>20||questions.some(q=>typeof q.prompt!=='string'||q.prompt.trim().length<3||q.prompt.length>200||!Array.isArray(q.options)||q.options.length!==4||q.options.some(o=>typeof o!=='string'||!o.trim()||o.length>100)||new Set(q.options.map(o=>o.trim().toLowerCase())).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3))return res.status(400).json({code:'invalid'});
    if(db.prepare('SELECT count(*) AS n FROM quizzes WHERE user_id=?').get(req.account.id).n>=50)return res.status(400).json({code:'tooMany'});
    const id=randomUUID();db.prepare('INSERT INTO quizzes VALUES(?,?,?,?,?)').run(id,req.account.id,title.trim(),JSON.stringify(questions),new Date().toISOString());res.json({id});
  });
  router.use((error,req,res,next)=>{if(res.headersSent)return next(error);console.error('Account request failed:',error.code||error.name);res.status(500).json({code:'generic'});});
  return router;
}
