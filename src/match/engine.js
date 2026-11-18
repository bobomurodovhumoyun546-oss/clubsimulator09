import {defaultTactics,tacticModifiers,weatherModifiers,goalRating} from '../features/career/rules.js';
import {playerPortrait} from '../features/playerPortrait.js';
import {playerAttributes,playerOVR} from '../features/playerRatings.js';
import {formationRows} from '../features/simulatorCards.js';
import {canSubstitute} from '../features/liveMatch.js';
import {matchQuality,supportPosition,keeperPosition,keeperSaveChances,isNearPostShot} from './tactics.js';
import {performSkill,skillMotion,protectedKeeper,keepAreaClear} from './skills.js';
export {performSkill} from './skills.js';
import {shotTarget} from './shooting.js';
import {advanceCelebration,celebrationActive,celebrationDuration,celebrationStyle} from './presentation.js';
import {active,attackDirection,ownGoalX,inPenaltyArea,offsidePlayers,snapshotOffside,legalTouch,awardRestart,attemptTackle,handleBoundary,advanceClock,accountStoppage,ruleEvent,notify} from './rules.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createEngine(club,players,roles,opponentLineup){
 const lookup=new Map(players.map(p=>[p.id,p]));
 const make=(ids,team,teamRoles)=>{
  const spots=new Map();formationRows(teamRoles).reverse().forEach((row,r,rows)=>row.forEach(({i},j)=>spots.set(i,{x:r===0?5:17+r*65/(rows.length-1),y:(j+1)*68/(row.length+1)})));
  return ids.map((item,i)=>{const id=typeof item==='string'?item:item.id,p=lookup.get(id);if(!p)throw new Error('Starting XI player missing');const training=team===0?club.training[id]||0:item.training||0,spot=spots.get(i);return {id,baseId:p.basePlayerId||id,team,role:teamRoles[i],name:p.fullName,ovr:playerOVR(p,training),stats:playerAttributes(p,training).values,portrait:playerPortrait(p.image),portraitStyle:p.portraitStyle||'photo',x:team?105-(5+(spot.x-5)*.49):5+(spot.x-5)*.49,y:spot.y,homeX:team?105-spot.x:spot.x,homeY:spot.y,vx:0,vy:0,stamina:100,cooldown:0,tackleCooldown:0,sentOff:false};});
 };
 if(club.lineup.length!==11||opponentLineup.length!==11)throw new Error('Both teams need 11 players');
 const setup={...defaultTactics,...club.advancedTactics};
 const own=make(club.lineup,0,roles),away=make(opponentLineup,1,opponentLineup.map(p=>p.role));
 for(const p of own){const pos=setup.positions?.[p.id];if(pos&&p.role!=='GK'){p.homeX=clamp(pos.x,8,94);p.homeY=clamp(pos.y,3,65);}}
 return {pitchQuality:clamp(club.stadium?.pitch||0,0,5),advancedTactics:setup,weather:club.matchWeather||'clear',kits:[{...club},{primary:'#d93d51',secondary:'#19233d',pattern:'solid'}],players:[...own,...away],ball:{x:52.5,y:34,vx:0,vy:0,z:0,vz:0},owner:null,last:null,lastTouch:null,lastShot:null,selected:9,time:0,minute:0,score:[0,0],log:[],stats:[0,1].map(()=>({shots:0,onTarget:0,passes:0,completed:0,possession:0,fouls:0,yellow:0,red:0,offsides:0,corners:0,penalties:0})),mode:'manual',paused:false,finished:false,half:false,atHalfTime:false,endsSwitched:false,notice:'KICK OFF',noticeTime:3,restart:1,tactics:club.tactics||'balanced',difficulty:club.difficulty,substitutions:[],lineup:[...club.lineup],off:[],roles:[...roles],bench:[...(club.bench||[])],subQueue:[],discipline:{},rulesLog:[],setPiece:null,offside:null,addedTime:[null,null],lostTime:[0,0],periodStart:0,addedMinute:0};
}
export function switchPlayer(s){const best=s.players.map((p,i)=>({p,i})).filter(({p})=>active(p)&&p.team===0&&p.role!=='GK').sort((a,b)=>distance(a.p,s.ball)-distance(b.p,s.ball))[0];if(best)s.selected=best.i;}
function passTarget(s,p,input,kind){
 const dir=attackDirection(s,p.team),hasDirection=Math.hypot(input.x||0,input.y||0)>.1,dx=hasDirection?(input.x||0):dir,dy=hasDirection?(input.y||0):0,offside=new Set(offsidePlayers(s,p).ids),piece=s.setPiece?.kind;
 return s.players.filter(q=>active(q)&&q.team===p.team&&q!==p&&q.role!=='GK').sort((a,b)=>{
  const rank=q=>{if(piece==='kickoff')return -distance(p,q);if(piece==='corner')return -Math.hypot(q.x-(dir>0?97:8),q.y-34);const d=distance(p,q);return ((q.x-p.x)*dx+(q.y-p.y)*dy)/(d||1)*25-d*.25-(offside.has(q.id)?90:0)+(kind==='long'&&q.x*dir>p.x*dir?4:0);};return rank(b)-rank(a);
 })[0];
}
export function kick(s,kind='pass',power=.6,input={},random=Math.random){
 const p=s.players[s.owner];if(!p||!active(p)||s.paused||s.finished||celebrationActive(s))return false;
 if(p.skill?.until>s.time)return false;
 const punt=p.role==='GK'&&p.handling&&kind==='shot';if(punt)kind='long';
 const piece=s.setPiece;if(piece&&(!piece.ready||piece.taker!==s.owner))return false;
 const dir=attackDirection(s,p.team);let target;
 if(kind==='shot'){
  if(piece?.kind==='throwIn')kind='pass';else{target=shotTarget(s,p,power,input,random);s.stats[p.team].shots++;if(target.y>27.23&&target.y<40.77)s.stats[p.team].onTarget++;}
 }
 if(kind!=='shot'){target=passTarget(s,p,input,kind);if(!target)return false;s.stats[p.team].passes++;}
 let tx=target.x,ty=target.y;
 if(kind==='through'){
  const lead=clamp(6+distance(p,target)*.22,8,15)*(p.team===0?tacticModifiers(s.advancedTactics).risk:1);tx=clamp(tx+dir*lead,2,103);ty=clamp(ty+target.vy*.6,2,66);
  target.runTarget={x:tx,y:ty,until:s.time+3.5};
 }
 s.passReceiver=kind==='through'?target.id:null;
 if(kind!=='shot'&&piece?.kind!=='kickoff')ty+=(random()-.5)*Math.max(0,110-matchQuality(p,'pas'))*.085/(weatherModifiers(s.weather).pass*(p.team===0?tacticModifiers(s.advancedTactics).passing*(s.advancedTactics?.roles?.[p.id]==='creator'?1.025:1)*(.98+(s.pitchQuality||0)*.008):1));
 const speed=punt?34+clamp(power,0,1)*8:kind==='shot'?25+clamp(power,0,1)*(18+matchQuality(p,'sho')*.075):kind==='long'?30:kind==='through'?28:20;
 const origin=piece?{x:piece.x,y:piece.y}:{x:p.x+dir*.9,y:p.y};
 const length=Math.hypot(tx-origin.x,ty-origin.y)||1;
 snapshotOffside(s,p,['throwIn','corner','goalKick'].includes(piece?.kind));
 s.ball={x:origin.x,y:origin.y,vx:(tx-origin.x)/length*speed,vy:(ty-origin.y)/length*speed,z:punt?1.25:piece?.kind==='throwIn'?1.8:kind==='long'?1:0,vz:punt?9+clamp(power,0,1)*3:piece?.kind==='throwIn'?2.2:kind==='long'?7:kind==='shot'?.8+power*2.1:0};
 s.last={id:p.id,name:p.name,team:p.team,kind};s.lastTouch=s.last;if(kind==='shot')s.lastShot={...s.last,assist:s.lastAssist,originX:origin.x,originY:origin.y,targetY:ty,distance:Math.hypot(tx-origin.x,ty-origin.y),shotType:piece?.kind==='freeKick'?'freeKick':Math.abs(tx-origin.x)>25?'longShot':'shot',difficulty:clamp(Math.hypot(tx-origin.x,ty-origin.y)/45,0,1)};
 if(piece){s.restartTouch={id:p.id,team:p.team,kind:piece.kind};if(piece.kind==='penalty'){s.penaltyInFlight=true;s.penaltyFlightTime=0;}ruleEvent(s,'restartTaken',{kind:piece.kind,team:p.team,playerId:p.id});s.setPiece=null;}
 p.handling=false;p.holdTime=0;p.skill=null;s.owner=null;p.cooldown=.5;p.visual={kind:punt?'punt':piece?.kind==='throwIn'?'throw':kind==='shot'?'shoot':'pass',until:s.time+.48,vx:s.ball.vx,vy:s.ball.vy};return true;
}
export function tackle(s,slide=false,random=Math.random){if(!s.paused&&!s.finished)attemptTackle(s,s.selected,slide,random);}
function kickoff(s,team){awardRestart(s,'kickoff',team,52.5,34);}
function goal(s,team,last){
 if(s.score[team]>=10||s.log.length>=20){kickoff(s,1-team);return;}
 const scorer=s.lastShot?.team===team?s.lastShot:last,ownGoal=scorer.team!==team,assist=!ownGoal&&scorer.assist?.id!==scorer.id?scorer.assist:null;
 s.score[team]++;s.log.push({minute:Math.max(1,s.minute),added:s.addedMinute||0,home:team===0,goal:true,playerId:scorer.id,name:scorer.name,attackerName:scorer.name,ownGoal,assistId:assist?.id||null,assistName:assist?.name||null,originX:scorer.originX,originY:scorer.originY,targetY:scorer.targetY,distance:scorer.distance,shotType:scorer.shotType,difficulty:scorer.difficulty,rating:goalRating({...scorer,assistId:assist?.id,ownGoal})});
 const positions=s.players.map(p=>({x:p.x,y:p.y}));
 ruleEvent(s,'goal',{team,playerId:scorer.id,ownGoal});kickoff(s,1-team);notify(s,ownGoal?'OWN GOAL':'GOAL!');
 // Keep the celebration at the goal location; restore kickoff placement afterwards.
 s.celebration={playerId:scorer.id,name:scorer.name,team,ownGoal,minute:s.minute,remaining:celebrationDuration,positions};
 s.players.filter(p=>active(p)&&p.team===team).forEach(p=>{p.visual={kind:'celebrate',style:celebrationStyle(p.id),until:s.time+.1};});
}
export function queueMatchSubstitution(s,outId,inPlayer,training=0){
 const index=s.lineup.indexOf(outId),match={...s,owned:s.bench,injured:[]};
 if(index<0||!inPlayer||s.finished||s.players[index].sentOff||s.substitutions.length+s.subQueue.length>=5||!canSubstitute(match,outId,inPlayer)||s.subQueue.some(q=>q.outId===outId||q.inId===inPlayer.id)||s.players.some(p=>p.team===0&&p.baseId===(inPlayer.basePlayerId||inPlayer.id)))return false;
 s.subQueue.push({outId,inId:inPlayer.id,name:inPlayer.fullName,portrait:playerPortrait(inPlayer.image),portraitStyle:inPlayer.portraitStyle||'photo',baseId:inPlayer.basePlayerId||inPlayer.id,ovr:playerOVR(inPlayer,training),stats:playerAttributes(inPlayer,training).values});
 if(s.setPiece||s.paused&&s.atHalfTime)applySubstitutions(s);return true;
}
function applySubstitutions(s){
 for(const sub of s.subQueue){const i=s.lineup.indexOf(sub.outId);if(i<0||s.players[i].sentOff||s.substitutions.length>=5)continue;const old=s.players[i];s.players[i]={...old,id:sub.inId,baseId:sub.baseId,name:sub.name,portrait:sub.portrait,portraitStyle:sub.portraitStyle,stats:sub.stats,ovr:sub.ovr,stamina:100,cooldown:0,tackleCooldown:0,visual:null};s.lineup[i]=sub.inId;s.off.push(sub.outId);s.substitutions.push({minute:s.minute,outId:sub.outId,inId:sub.inId});ruleEvent(s,'substitution',{outId:sub.outId,inId:sub.inId});s.lostTime[s.half?1:0]+=.75;}
 s.subQueue=[];
}
function setPieceTick(s,dt,input,random){
 const piece=s.setPiece;if(!piece)return false;input=s.networkInputs?.[piece.team]||input;applySubstitutions(s);accountStoppage(s,dt);piece.wait-=dt;
 if(piece.kind==='kickoff'&&(piece.team===0||s.networkInputs)&&s.mode!=='auto'&&Math.hypot(input.x||0,input.y||0)>.1)piece.wait=0;
 if(piece.wait>0)return true;
 if(!piece.ready){piece.ready=true;s.owner=piece.taker;const p=s.players[piece.taker];p.x=piece.x-attackDirection(s,p.team)*.9;p.y=piece.y;}
 piece.age+=dt;
 if(piece.kind==='penalty'&&piece.team===1&&s.mode!=='auto'){const keeper=s.players.find(p=>active(p)&&p.team===0&&p.role==='GK');if(keeper)keeper.y=clamp(keeper.y+(input.y||0)*5*dt,27.4,40.6);}
 const manual=(piece.team===0||s.networkInputs)&&s.mode!=='auto';
 if(manual&&piece.kind==='kickoff'&&Math.hypot(input.x||0,input.y||0)>.1){return !kick(s,'pass',.6,{},random);}
 if(piece.age>=(manual?5:.5)){const shot=piece.kind==='penalty'||piece.kind==='freeKick'&&Math.abs(piece.x-(attackDirection(s,piece.team)>0?105:0))<30;kick(s,shot?'shot':piece.kind==='corner'||piece.kind==='goalKick'?'long':'pass',.7,{},random);}
 return true;
}
function receiveBall(s,index){
 const p=s.players[index];if(!legalTouch(s,p))return false;
 if(s.last?.team===p.team&&s.last.kind!=='shot'&&s.last.id!==p.id){s.stats[p.team].completed++;s.lastAssist={id:s.last.id,name:s.last.name};}
 else if(s.last?.team!==p.team)s.lastAssist=null;
 p.handling=p.role==='GK'&&inPenaltyArea(s,p.team,p.x,p.y)&&s.last?.team!==p.team;
 s.owner=index;s.lastTouch={id:p.id,name:p.name,team:p.team,kind:'control'};s.last=s.lastTouch;s.offside=null;s.lastShot=null;s.penaltyInFlight=false;p.cooldown=.25;p.holdTime=0;p.protectedUntil=s.time+.8;p.runTarget=null;p.skill=null;s.passReceiver=null;
 if(s.networkInputs)s.selectedByTeam[p.team]=index;if(p.team===0&&s.mode!=='auto')s.selected=index;keepAreaClear(s);return true;
}
export function stepEngine(s,dt,input={},random=Math.random){
 if(s.paused||s.finished)return;s.atHalfTime=false;dt=Math.min(dt,.05);s.noticeTime=Math.max(0,s.noticeTime-dt);
 if(advanceCelebration(s,dt))return;
 if(s.restart>0){
  if(s.mode!=='auto'&&Math.hypot(input.x||0,input.y||0)>.1){kickoff(s,0);s.setPiece.wait=0;}
  else{s.restart-=dt;if(s.restart<=0)kickoff(s,0);return;}
 }
 if(advanceClock(s,dt)){
  if(!s.half){s.half=true;s.periodStart+=180+(s.addedTime[0]||0)*4;s.minute=45;s.addedMinute=0;s.endsSwitched=!s.endsSwitched;s.players.forEach(p=>{p.homeX=105-p.homeX;p.homeY=68-p.homeY;});kickoff(s,1);s.paused=true;s.atHalfTime=true;notify(s,'HALF TIME');}
  else{s.minute=90;s.finished=true;s.setPiece=null;notify(s,'FULL TIME');}return;
 }
 if(setPieceTick(s,dt,input,random))return;
 if(s.penaltyInFlight){s.penaltyFlightTime=(s.penaltyFlightTime||0)+dt;if(s.penaltyFlightTime>8||Math.hypot(s.ball.vx,s.ball.vy)<1)s.penaltyInFlight=false;}
 let owner=s.players[s.owner];if(owner&&!active(owner)){s.owner=null;owner=null;}if(owner)s.stats[owner.team].possession+=dt;
 const chasers=[0,1].map(team=>s.players.map((p,i)=>({p,i})).filter(({p})=>active(p)&&p.team===team&&p.role!=='GK').sort((a,b)=>(distance(a.p,s.ball)-matchQuality(a.p,'def')*.025)-(distance(b.p,s.ball)-matchQuality(b.p,'def')*.025)).slice(0,team===0&&(s.advancedTactics?.pressing||50)>65?2:1).map(v=>v.i));
 if(input.skill)performSkill(s,input.skill,input);
 const heldKeeper=protectedKeeper(s);
 const offsideInfo=owner?offsidePlayers(s,owner):null;
 for(let i=0;i<s.players.length;i++){
  const p=s.players[i];owner=s.players[s.owner];if(!active(p))continue;p.cooldown=Math.max(0,p.cooldown-dt);p.tackleCooldown=Math.max(0,(p.tackleCooldown||0)-dt);const playerInput=s.networkInputs?.[p.team]||input,selected=s.networkInputs?s.selectedByTeam[p.team]:s.selected;const manual=s.mode!=='auto'&&i===selected&&(p.role!=='GK'||owner===p||Math.hypot(playerInput.x||0,playerInput.y||0)>.1),dir=attackDirection(s,p.team);
  let dx=0,dy=0,sprint=false;
  if(manual){dx=playerInput.x||0;dy=playerInput.y||0;sprint=playerInput.sprint;}
  else {let tx=p.homeX,ty=p.homeY;
   if(p.role==='GK'){
    const autoRush=(p.team===1||s.mode==='auto')&&owner?.team!==p.team&&Math.abs(s.ball.x-ownGoalX(s,p.team))<19&&Math.abs(s.ball.y-34)<19&&matchQuality(p,'spd')>=75;
    const positioning=keeperPosition(s,p,(playerInput.gk&&(p.team===0||s.networkInputs))||autoRush);tx=positioning.x;ty=positioning.y;
    if(positioning.diving){p.shotReadAt??=s.time;if(s.time-p.shotReadAt<positioning.reaction)ty=p.y;else{p.visual={kind:'dive',until:s.time+.22,vx:dir,vy:0,rollSign:Math.sign(ty-p.y)*dir};sprint=true;}}
    else p.shotReadAt=null;
    if(owner===p&&p.cooldown===0&&(!p.handling||p.holdTime>1.4)){kick(s,p.handling?'shot':'long',.6,{},random);p.cooldown=1;}
   }
   else if(owner===p){tx=p.x+dir*12;ty=34+(p.y-34)*.6;
    if(p.cooldown===0){const goalDistance=Math.abs(p.x-(dir>0?105:0));if(goalDistance<20+matchQuality(p,'sho')*.07&&Math.abs(p.y-34)<20){kick(s,'shot',.55+random()*.4,{},random);p.cooldown=.9;}else if(random()<dt*(s.difficulty==='extrahard'?1.6:1)*(p.team===0?(.7+(s.advancedTactics?.tempo??50)*.006):1)){kick(s,random()<.2?'through':'pass',.6,{},random);p.cooldown=.8;}}
   }else if(p.runTarget?.until>s.time&&!owner){tx=p.runTarget.x;ty=p.runTarget.y;sprint=true;}
   else if(chasers[p.team].includes(i)&&(!owner||owner.team!==p.team)){tx=clamp(s.ball.x+(owner?.vx||0)*.22,.5,104.5);ty=clamp(s.ball.y+(owner?.vy||0)*.22,.5,67.5);sprint=!!owner&&matchQuality(p,'def')>75;if(owner&&owner.team!==p.team&&distance(p,owner)<1.9&&random()<dt*(.3+matchQuality(p,'def')*.005)*(p.team===0?tacticModifiers(s.advancedTactics).defence:1)){attemptTackle(s,i,false,random);if(s.setPiece||s.finished)return;}}
   else {const target=supportPosition(s,p,owner);tx=target.x;ty=target.y;if(owner?.team===p.team&&offsideInfo)tx=dir*Math.min(dir*tx,Math.max(52,dir*offsideInfo.line-.9,dir*owner.x-.9));}
   const len=Math.hypot(tx-p.x,ty-p.y);if(len>.7){dx=(tx-p.x)/len;dy=(ty-p.y)/len;}
  }
  // Assist a forward run before the pass; once the ball is released the runner is free.
  if(owner&&owner!==p&&owner.team===p.team&&p.role!=='GK'&&offsideInfo){
   const safe=dir*Math.max(52,dir*offsideInfo.line-1,dir*owner.x-1);
   if(dir*p.x>dir*safe){dx=-dir*Math.max(.6,Math.abs(dx));}
   else if(dir*dx>0&&dir*p.x>dir*safe-1.4)dx=0;
  }
  const tactics=p.team===0?tacticModifiers(s.advancedTactics):tacticModifiers(defaultTactics),conditions=weatherModifiers(s.weather);
  const norm=Math.hypot(dx,dy);if(norm>1){dx/=norm;dy/=norm;}
  const speed=1.18*(3.3+matchQuality(p,p.role==='GK'?'spd':'pac')*.042)*(sprint&&p.stamina>5?1.45:1)*(p.stamina<20?.8:1),blend=1-Math.exp(-dt*(4+matchQuality(p,'dri')*.045)*conditions.grip);p.vx+=(dx*speed-p.vx)*blend;p.vy+=(dy*speed-p.vy)*blend;const motion=owner===p?skillMotion(p,s.time):null;if(motion){p.vx=motion.vx;p.vy=motion.vy;}if(heldKeeper===p){p.vx=0;p.vy=0;}p.x=clamp(p.x+p.vx*dt,.4,104.6);p.y=clamp(p.y+p.vy*dt,.4,67.6);p.stamina=clamp(p.stamina+dt*(norm>.1?(sprint?-.20:-.035)*tactics.fatigue*conditions.fatigue:.22),0,100);
 }
 for(let i=0;i<s.players.length;i++)for(let j=i+1;j<s.players.length;j++){const a=s.players[i],b=s.players[j];if(!active(a)||!active(b))continue;const d=distance(a,b);if(d>0&&d<1.15){const push=(1.15-d)*.5,dx=(a.x-b.x)/d*push,dy=(a.y-b.y)/d*push;a.x+=dx;a.y+=dy;b.x-=dx;b.y-=dy;}}
 keepAreaClear(s);
 const b=s.ball,current=s.players[s.owner],previous={x:b.x,y:b.y,z:b.z};
 if(current){const dir=attackDirection(s,current.team);b.x=current.x+dir*.9;b.y=current.y;b.z=0;b.vx=current.vx;b.vy=current.vy;b.vz=0;
  const motion=skillMotion(current,s.time);if(motion){b.x=current.x+motion.ballX;b.y=current.y+motion.ballY;b.z=motion.height;}
  if(protectedKeeper(s)){b.x=current.x+dir*.35;b.z=1.35;current.visual={kind:'catch',until:s.time+.15};}
  if(current.handling&&!inPenaltyArea(s,current.team,current.x,current.y))current.handling=false;
  if(current.handling&&current.role==='GK'&&inPenaltyArea(s,current.team,current.x,current.y)){current.holdTime=(current.holdTime||0)+dt;if(current.holdTime>8){ruleEvent(s,'keeperHolding',{team:current.team});awardRestart(s,'corner',1-current.team,ownGoalX(s,current.team),current.y<34?0:68);notify(s,'GOALKEEPER 8 SECONDS - CORNER');return;}}
  handleBoundary(s,previous,(team,last)=>goal(s,team,last));return;
 }
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.z=Math.max(0,b.z+b.vz*dt);b.vz-=9.8*dt;if(b.z===0&&b.vz<0)b.vz=-b.vz*.3;const friction=s.weather==='snow'?.48:s.weather==='rain'?.39:.42;b.vx*=Math.exp(-friction*dt);b.vy*=Math.exp(-friction*dt);if(s.weather==='wind')b.vy+=Math.sin(s.time*.5)*.25*dt;
 if(handleBoundary(s,previous,(team,last)=>goal(s,team,last)))return;
 const candidates=s.players.map((p,i)=>({p,i})).filter(({p})=>active(p)&&p.cooldown===0&&distance(p,b)<(p.role==='GK'&&inPenaltyArea(s,p.team,p.x,p.y)?1.65:1.35)&&b.z<(p.role==='GK'&&inPenaltyArea(s,p.team,p.x,p.y)?2.5:1.1)).sort((a,c)=>distance(a.p,b)-distance(c.p,b));
 const hit=candidates[0];if(!hit)return;
 const keeper=hit.p.role==='GK'&&inPenaltyArea(s,hit.p.team,hit.p.x,hit.p.y),shot=s.last?.kind==='shot';
 if(keeper&&shot){hit.p.visual={kind:'dive',until:s.time+.5,vx:attackDirection(s,hit.p.team),vy:0,rollSign:Math.sign(b.y-hit.p.y)*attackDirection(s,hit.p.team)||1};
  const roll=random(),{catchChance,parry}=keeperSaveChances(hit.p,Math.hypot(b.vx,b.vy),Math.abs(hit.p.x-ownGoalX(s,hit.p.team))>7,isNearPostShot(s.lastShot));
  if(roll<catchChance){if(!receiveBall(s,hit.i))return;hit.p.visual={...hit.p.visual,kind:Math.abs(b.y-hit.p.y)>.4?'dive':'catch',until:s.time+.42};notify(s,'SAVE');}
  else if(roll<catchChance+parry){if(!legalTouch(s,hit.p,{controlled:false}))return;s.lastTouch={id:hit.p.id,name:hit.p.name,team:hit.p.team,kind:'deflection'};b.vx*=-.5;b.vy+=(b.y>hit.p.y?1:-1)*9;b.vz=2.8;hit.p.cooldown=.4;notify(s,'PARRIED');}else hit.p.cooldown=.35;return;
 }
 receiveBall(s,hit.i);
}
export function engineResult(s){return {finished:s.finished,minute:s.abandoned?90:s.minute,abandonedAt:s.abandonedAt,lineup:[...s.lineup],log:s.log,substitutions:s.substitutions,injured:[],stats:s.stats,rulesLog:s.rulesLog,discipline:s.discipline,addedTime:s.addedTime,abandoned:!!s.abandoned,engine:'player-v2-rules'};}
