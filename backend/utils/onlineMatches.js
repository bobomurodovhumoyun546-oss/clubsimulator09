import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {normalizePlayers} from '../../src/games/core/players.js';
import {simulatorCards} from '../../src/features/simulatorCards.js';
import {inventoryPlayers} from '../../src/features/cardInventory.js';
import {formations,fitsSlot} from '../../src/features/clubSimulator.js';
import {createEngine,stepEngine,kick,performSkill} from '../../src/match/engine.js';
import {attemptTackle,active} from '../../src/match/rules.js';
let catalogue;
function defaultCatalogue(){return catalogue??=simulatorCards(normalizePlayers(JSON.parse(readFileSync(new URL('../../public/game-data/players.json',import.meta.url),'utf8'))));}
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const finite=n=>Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
const kitKeys=['badgeTeamId','name','symbol','shape','primary','secondary','pattern','badgeInitials','badgeText','badgeIcon','badgeAccent','kitSleeves','kitTrim','kitShorts','kitSocks','kitTextColor','kitCollar','kitSponsor'];
const kit=club=>Object.fromEntries(kitKeys.filter(k=>typeof club[k]==='string').map(k=>[k,club[k].slice(0,80)]));
export function createOnlineMatches(db,{players,now=Date.now,autoTick=true}={}){
 const rooms=new Map(),pendingWrites=new Set();let timer;
 function track(result){if(!result?.then)return;const pending=result.catch(error=>console.error('Online match persistence:',error.message)).finally(()=>pendingWrites.delete(pending));pendingWrites.add(pending);}
 function validateClub(row){if(!row)throw fail('needClub');let club;try{club=JSON.parse(row.state);}catch{throw fail('needClub');}
  const cards=inventoryPlayers(players||defaultCatalogue(),club),lookup=new Map(cards.map(p=>[p.id,p])),roles=formations[club.formation];
  if(!roles||!Array.isArray(club.owned)||!Array.isArray(club.lineup)||club.lineup.length!==11||!club.training||new Set(club.lineup).size!==11||club.lineup.some((id,i)=>!club.owned.includes(id)||!lookup.has(id)||!fitsSlot(lookup.get(id),roles[i]))||new Set(club.lineup.map(id=>lookup.get(id).basePlayerId||id)).size!==11)throw fail('needXI');
  return {club,cards,roles};
 }
 function teamOf(room,user){const team=room.users.indexOf(user);if(team<0)throw fail('notFound',404);return team;}
 function savedClub(user){const row=db.prepare('SELECT state FROM club_saves WHERE user_id=?').get(user);return row?.then?row.then(validateClub):validateClub(row);}
 function busy(user){return [...rooms.values()].some(r=>r.users.includes(user)&&!r.state.finished);}
 function finish(room,reason){if(room.state.finished&&room.ended)return;room.state.finished=true;room.state.paused=false;room.ended=now();room.reason=reason;track(db.prepare('UPDATE friend_matches SET status=?,score=?,reason=? WHERE id=?').run('finished',JSON.stringify(room.state.score),reason,room.id));}
 function create(host,guest){if(rooms.size>=100||busy(host)||busy(guest))throw fail('busy',409);const a=savedClub(host),b=savedClub(guest);return a?.then||b?.then?Promise.all([a,b]).then(([home,away])=>createRoom(host,guest,home,away)):createRoom(host,guest,a,b);}
 function createRoom(host,guest,a,b){if(rooms.size>=100||busy(host)||busy(guest))throw fail('busy',409);const id=randomUUID();
  const state=createEngine(a.club,[...a.cards,...b.cards],a.roles,b.club.lineup.map((id,i)=>({id,role:b.roles[i],training:b.club.training[id]||0})));state.players.forEach(p=>{p.cardId=p.id;p.id='online:'+p.team+':'+p.id;});state.kits=[kit(a.club),kit(b.club)];state.networkInputs=[{},{}];state.selectedByTeam=[9,20];state.selected=9;state.mode='manual';state.paused=true;state.notice='WAITING FOR FRIEND';state.noticeTime=100;
  const room={id,users:[host,guest],names:[a.club.name,b.club.name],state,created:now(),seen:[0,0],ready:[false,false],sequences:[-1,-1],lastAction:[-100,-100],started:false,reason:null};rooms.set(id,room);
  let persisted;try{persisted=db.prepare('INSERT INTO friend_matches(id,host,guest,status,created) VALUES(?,?,?,?,?)').run(id,host,guest,'waiting',now());}catch(error){rooms.delete(id);throw error;}
  if(autoTick&&!timer){let last=now();timer=setInterval(()=>{const stamp=now(),dt=Math.min(.1,Math.max(0,(stamp-last)/1000));last=stamp;try{tick(dt);}catch(error){console.error('Online match tick:',error.message);}},1000/30);timer.unref();}return persisted?.then?persisted.then(()=>room,error=>{rooms.delete(id);throw error;}):room;
 }
 function get(id,user){const room=rooms.get(id);if(!room)throw fail('matchUnavailable',404);teamOf(room,user);return room;}
 function join(id,user){const room=get(id,user),team=teamOf(room,user);room.ready[team]=true;room.seen[team]=now();return snapshot(room,user);}
 function act(room,team,action,input){const s=room.state,index=s.selectedByTeam[team],p=s.players[index];if(!p||!active(p)||s.finished||s.paused)return;
  if(action==='switch'){const best=s.players.map((p,i)=>({p,i})).filter(({p})=>active(p)&&p.team===team&&p.role!=='GK').sort((a,b)=>Math.hypot(a.p.x-s.ball.x,a.p.y-s.ball.y)-Math.hypot(b.p.x-s.ball.x,b.p.y-s.ball.y))[0];if(best)s.selectedByTeam[team]=best.i;return;}
  const owns=s.owner===index&&p.team===team;
  if(['pass','through','long','shot'].includes(action)){if(owns)kick(s,action,input.power??.6,input);else attemptTackle(s,index,action==='through');return;}
  if(owns){const previous=s.selected;s.selected=index;performSkill(s,action,input);s.selected=previous;}
 }
 function control(id,user,packet){const room=get(id,user),team=teamOf(room,user);if(!Number.isSafeInteger(packet?.seq)||packet.seq<=room.sequences[team])return snapshot(room,user);
  const input={x:finite(packet.x),y:finite(packet.y),sprint:packet.sprint===true,gk:packet.gk===true,aim:packet.aim===-1||packet.aim===1?packet.aim:0,power:Number.isFinite(packet.power)?Math.max(.15,Math.min(1,packet.power)):.6};
  room.seen[team]=now();room.sequences[team]=packet.seq;if(room.state.finished)return snapshot(room,user);room.state.networkInputs[team]=input;
  if(room.ready.every(Boolean)&&!room.started)start(room);
  const actions=Array.isArray(packet.actions)?packet.actions.slice(0,3):[];
  for(const action of actions){if(action!=='switch'&&now()-room.lastAction[team]<100)continue;act(room,team,action,input);if(action!=='switch')room.lastAction[team]=now();}
  return snapshot(room,user);
 }
 function start(room){room.started=true;room.state.paused=false;room.state.notice='KICK OFF';room.state.noticeTime=2;track(db.prepare('UPDATE friend_matches SET status=? WHERE id=?').run('playing',room.id));}
 function tick(dt=1/30){for(const room of rooms.values()){
   if(room.state.finished){if(now()-(room.ended||room.created)>15*60000)rooms.delete(room.id);continue;}
   if(!room.started){if(room.ready.every(Boolean))start(room);else if(now()-room.created>120000)finish(room,'joinTimeout');continue;}
   const age=room.seen.map(t=>now()-t),missing=age.findIndex(t=>t>8000);
   if(missing>=0){room.state.networkInputs=[{},{}];room.state.paused=true;room.state.notice='WAITING FOR CONNECTION';room.state.noticeTime=100;if(age[missing]>60000){if(age[1-missing]<8000)room.state.score[1-missing]=Math.max(3,room.state.score[missing]+1,room.state.score[1-missing]);finish(room,'disconnected');}continue;}
   if(room.state.atHalfTime){room.resumeAt??=now()+3000;if(now()<room.resumeAt)continue;room.state.atHalfTime=false;room.resumeAt=null;}
   room.state.paused=false;if(room.state.notice==='WAITING FOR CONNECTION'){room.state.notice='PLAY ON';room.state.noticeTime=1.2;}
   for(let left=dt;left>0;left-=1/60){stepEngine(room.state,Math.min(left,1/60),room.state.networkInputs[0]);if(room.state.paused||room.state.finished)break;}
   if(room.state.finished)finish(room,'fullTime');
  }}
 function snapshot(room,user){const team=teamOf(room,user),s=room.state;return {id:room.id,team,names:room.names,ready:room.ready,reason:room.reason,state:{players:s.players.map(p=>({...p})),ball:{...s.ball},kits:s.kits,selected:s.selectedByTeam[team],time:s.time,minute:s.minute,score:s.score,mode:'manual',paused:s.paused,finished:s.finished,notice:s.notice,noticeTime:s.noticeTime,stats:s.stats,endsSwitched:s.endsSwitched,offsideLine:s.offsideLine,refereeSignal:s.refereeSignal,half:s.half,addedMinute:s.addedMinute,addedTime:s.addedTime,weather:'clear'}};}
 function leave(id,user){const room=get(id,user),team=teamOf(room,user);if(!room.state.finished){room.state.score[1-team]=Math.max(3,room.state.score[team]+1,room.state.score[1-team]);finish(room,'left');}return snapshot(room,user);}
 function close(){clearInterval(timer);for(const room of rooms.values())if(!room.state.finished)finish(room,'serverStopped');rooms.clear();return pendingWrites.size?Promise.all([...pendingWrites]):undefined;}
 return {create,savedClub,busy,get,join,control,tick,snapshot,leave,close,flush:()=>Promise.all([...pendingWrites]),rooms};
}
