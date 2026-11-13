// A deterministic football rules layer. Coordinates remain metres, X is goal-to-goal.
export const BALL_RADIUS=.23;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const active=p=>!p.sentOff;
export const attackDirection=(s,team)=>(team?-1:1)*(s.endsSwitched?-1:1);
export const ownGoalX=(s,team)=>attackDirection(s,team)>0?0:105;
export const inPenaltyArea=(s,team,x,y)=>Math.abs(x-ownGoalX(s,team))<=16.5&&y>=13.84&&y<=54.16;
export function ruleEvent(s,type,details={}){s.rulesLog??=[];s.rulesLog.push({type,minute:Math.max(1,s.minute),added:s.addedMinute||0,...details});s.rulesLog=s.rulesLog.slice(-250);}
export function notify(s,text,kind=null){s.notice=text;s.noticeTime=2.7;if(kind)s.refereeSignal={kind,until:s.time+2};}
export function offsidePlayers(s,passer){
 const dir=attackDirection(s,passer.team),defenders=s.players.filter(p=>active(p)&&p.team!==passer.team).map(p=>dir*p.x).sort((a,b)=>b-a),line=defenders[1]??-Infinity;
 return {line:Number.isFinite(line)?line/dir:(dir>0?0:105),ids:s.players.filter(p=>active(p)&&p.team===passer.team&&p.id!==passer.id&&dir*p.x>dir*52.5+.01&&dir*p.x>dir*passer.x+.01&&dir*p.x>line+.01).map(p=>p.id)};
}
export function snapshotOffside(s,passer,exempt=false){const snapshot=offsidePlayers(s,passer);s.offside=exempt?null:{...snapshot,team:passer.team};}
const restartNames={corner:'CORNER',throwIn:'THROW IN',goalKick:'GOAL KICK',freeKick:'FREE KICK',indirect:'INDIRECT FREE KICK',penalty:'PENALTY',kickoff:'KICK OFF'};
export function awardRestart(s,kind,team,x,y,details={}){
 const dir=attackDirection(s,team);x=clamp(x,.35,104.65);y=clamp(y,.35,67.65);
 if(kind==='penalty'){x=dir>0?94:11;y=34;}
 if(kind==='goalKick'){x=ownGoalX(s,team)+(dir*5.5);y=34;}
 if(kind==='kickoff'){x=52.5;y=34;}
 const available=s.players.map((p,i)=>({p,i})).filter(({p})=>active(p)&&p.team===team);
 available.sort((a,b)=>{
  if(kind==='penalty')return Number(a.p.role==='GK')-Number(b.p.role==='GK')||(b.p.stats.sho||b.p.ovr)-(a.p.stats.sho||a.p.ovr)||Number(b.p.role==='ST')-Number(a.p.role==='ST');
  if(kind==='goalKick')return Number(b.p.role==='GK')-Number(a.p.role==='GK');
  if(a.p.role==='GK'&&kind!=='goalKick')return 1;if(b.p.role==='GK'&&kind!=='goalKick')return -1;
  return Math.hypot(a.p.x-x,a.p.y-y)-Math.hypot(b.p.x-x,b.p.y-y);
 });
 const taker=available[0];if(!taker)return;
 s.owner=null;s.penaltyInFlight=false;s.last=null;s.offside=null;s.restartTouch=null;s.lastShot=null;s.restart=0;s.ball={x,y,vx:0,vy:0,z:0,vz:0};
 s.setPiece={kind,team,x,y,taker:taker.i,wait:1.1,ready:false,age:0};
 s.players.forEach(p=>{p.vx=p.vy=0;if(!active(p))return;
  if(kind==='kickoff'){const facing=attackDirection(s,p.team);p.x=ownGoalX(s,p.team)+facing*(5+(Math.abs(p.homeX-ownGoalX(s,p.team))-5)*.49);p.y=p.homeY;if(facing*(p.x-52.5)>0)p.x=52.5-facing*(3+Math.abs(p.homeY-34)*.15);if(p.team!==team&&Math.hypot(p.x-52.5,p.y-34)<9.15){p.x=52.5+dir*10;p.y=p.homeY;}return;}
  if(kind==='penalty'&&p!==taker.p){if(p.team!==team&&p.role==='GK'){p.x=dir>0?104.6:.4;p.y=34;}else if(p.role!=='GK'){p.x=x-dir*(10+Math.abs(p.homeY-34)*.12);p.y=clamp(p.homeY,4,64);}return;}
  const minimum=kind==='throwIn'?2:9.15,distance=Math.hypot(p.x-x,p.y-y);
  if(p.team!==team&&distance<minimum){const angle=Math.atan2(p.y-y,p.x-x)||Math.PI/2;p.x=clamp(x+Math.cos(angle)*(minimum+.3),.8,104.2);p.y=clamp(y+Math.sin(angle)*(minimum+.3),.8,67.2);}
  if(kind==='goalKick'&&p.team!==team&&inPenaltyArea(s,team,p.x,p.y))p.x=ownGoalX(s,team)+dir*18;
 });
 taker.p.x=x-dir*.9;taker.p.y=y;taker.p.cooldown=0;
 if(kind==='kickoff'){const partner=available.find(({p})=>p!==taker.p&&p.role!=='GK');if(partner){partner.p.x=x-dir*4;partner.p.y=y;}} 
 if(kind==='freeKick'||kind==='indirect'){
  const wall=s.players.filter(p=>active(p)&&p.team!==team&&p.role!=='GK').sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x)).slice(0,3);
  wall.forEach((p,i)=>{p.x=clamp(x+dir*9.3,.8,104.2);p.y=clamp(y+(i-1)*1.3,.8,67.2);});
 }
 if(s.networkInputs)s.selectedByTeam[team]=taker.i;if(team===0&&s.mode!=='auto')s.selected=taker.i;
 if(kind==='penalty'&&team===1&&s.mode!=='auto'){const keeper=s.players.findIndex(p=>active(p)&&p.team===0&&p.role==='GK');if(keeper>=0)s.selected=keeper;}
 if(kind==='corner')s.stats[team].corners++;if(kind==='penalty')s.stats[team].penalties++;
 ruleEvent(s,kind,{team,...details});notify(s,restartNames[kind],'whistle');
}
// Returns false when an offside/double-touch offence stopped play; mere offside position is not an offence.
export function legalTouch(s,player,{controlled=true}={}){
 if(s.offside?.team===player.team&&s.offside.ids.includes(player.id)){
  const line=s.offside.line;s.stats[player.team].offsides++;ruleEvent(s,'offside',{team:player.team,playerId:player.id,name:player.name});awardRestart(s,'indirect',1-player.team,player.x,player.y);s.offsideLine={x:line,until:s.time+2.5};notify(s,`OFFSIDE - ${player.name}`);return false;
 }
 if(s.restartTouch?.id===player.id){ruleEvent(s,'doubleTouch',{team:player.team,playerId:player.id});awardRestart(s,'indirect',1-player.team,player.x,player.y);notify(s,'SECOND TOUCH - INDIRECT FREE KICK');return false;}
 s.restartTouch=null;
 if(controlled&&s.offside&&s.offside.team!==player.team)s.offside=null;
 return true;
}
export function disciplinePlayer(s,player,card){
 s.discipline??={};const record=s.discipline[player.id]??={yellow:0,red:false};if(record.red)return;
 if(card==='yellow'){record.yellow++;s.stats[player.team].yellow++;ruleEvent(s,'yellow',{team:player.team,playerId:player.id,name:player.name});}
 if(card==='red'||record.yellow>=2){record.red=true;player.sentOff=true;player.vx=player.vy=0;s.stats[player.team].red++;ruleEvent(s,'red',{team:player.team,playerId:player.id,name:player.name,secondYellow:record.yellow>=2});
  if(s.owner===s.players.indexOf(player))s.owner=null;
  if(player.role==='GK'){const emergency=s.players.find(p=>active(p)&&p.team===player.team);if(emergency)emergency.role='GK';}
  if(s.networkInputs&&s.selectedByTeam[player.team]===s.players.indexOf(player))s.selectedByTeam[player.team]=s.players.findIndex(p=>active(p)&&p.team===player.team&&p.role!=='GK');
  if(s.selected===s.players.indexOf(player)){const replacement=s.players.findIndex(p=>active(p)&&p.team===0&&p.role!=='GK');if(replacement>=0)s.selected=replacement;}
 }
 return record.red?'red':card;
}
export function awardFoul(s,offender,victim,{reckless=false,severe=false,dogso=false}={}){
 const penalty=inPenaltyArea(s,offender.team,victim.x,victim.y);s.stats[offender.team].fouls++;
 ruleEvent(s,'foul',{team:offender.team,playerId:offender.id,name:offender.name,victimId:victim.id});
 const card=severe||dogso&&!penalty?'red':reckless||dogso?'yellow':null;
 const shown=card?disciplinePlayer(s,offender,card):null;
 awardRestart(s,penalty?'penalty':'freeKick',victim.team,victim.x,victim.y);
 notify(s,`${penalty?'PENALTY':'FOUL - FREE KICK'}${shown?` - ${shown.toUpperCase()} CARD`:''}`,shown||'whistle');
 if([0,1].some(team=>s.players.filter(p=>active(p)&&p.team===team).length<7)){s.finished=true;s.abandonedAt=s.minute;s.abandoned=true;notify(s,'MATCH ABANDONED - FEWER THAN 7 PLAYERS');ruleEvent(s,'abandoned');}
}
export function attemptTackle(s,index,slide=false,random=Math.random){
 const p=s.players[index],q=s.players[s.owner];if(!p||!q||!active(p)||p.team===q.team||(q.role==='GK'&&q.handling&&inPenaltyArea(s,q.team,q.x,q.y))||s.setPiece||p.tackleCooldown>0||(q.protectedUntil||0)>s.time||Math.hypot(p.x-q.x,p.y-q.y)>(slide?4:2.8))return;
 p.tackleCooldown=slide?1.15:.65;p.visual={kind:slide?'slide':'tackle',until:s.time+(slide?.7:.4),vx:q.x-p.x,vy:q.y-p.y};
 const speed=Math.hypot(q.vx,q.vy),qx=speed>.2?q.vx/speed:attackDirection(s,q.team),qy=speed>.2?q.vy/speed:0,d=Math.hypot(p.x-q.x,p.y-q.y)||1,behind=((p.x-q.x)*qx+(p.y-q.y)*qy)/d<-.35;
 const roll=random(),clean=clamp(((p.stats.def||p.ovr)*.6+p.ovr*.4)/125+(((p.stats.phy||p.ovr)*.6+p.ovr*.4)-((q.stats.dri||q.ovr)*.6+q.ovr*.4))*.003-(slide?.09:0)-(behind?.18:0),.25,.86);
 if(roll<clean){s.owner=index;s.last={id:p.id,name:p.name,team:p.team,kind:'control'};s.lastTouch=s.last;s.offside=null;s.restartTouch=null;q.cooldown=.6;q.tackleCooldown=1.1;p.cooldown=.25;p.protectedUntil=s.time+.9;p.handling=false;p.skill=null;q.skill=null;p.runTarget=null;s.passReceiver=null;s.lastShot=null;s.lastAssist=null;if(s.networkInputs)s.selectedByTeam[p.team]=index;if(p.team===0&&s.mode!=='auto')s.selected=index;notify(s,'TACKLE');return;}
 // Failed challenges usually miss the ball; contact from behind/slides carry greater risk.
 const foulChance=slide?(behind?.22:.13):(behind?.07:.025);
 if(roll<1-foulChance)return;
 const dir=attackDirection(s,q.team),ahead=s.players.filter(a=>active(a)&&a.team!==q.team&&a.id!==p.id&&dir*(a.x-q.x)>0).length;
 awardFoul(s,p,q,{reckless:slide&&(behind||roll>.88),severe:slide&&roll>.985,dogso:ahead<=1&&Math.abs(q.x-(dir>0?105:0))<25&&Math.abs(q.y-34)<18});
}
export function crossing(previous,ball){
 const exits=[];const dx=ball.x-previous.x,dy=ball.y-previous.y;
 for(const x of [-BALL_RADIUS,105+BALL_RADIUS])if(dx&&(x<0?ball.x<x:ball.x>x)){const t=(x-previous.x)/dx;if(t>=0&&t<=1)exits.push({kind:'goalLine',t,x,y:previous.y+dy*t,z:previous.z+(ball.z-previous.z)*t});}
 for(const y of [-BALL_RADIUS,68+BALL_RADIUS])if(dy&&(y<0?ball.y<y:ball.y>y)){const t=(y-previous.y)/dy;if(t>=0&&t<=1)exits.push({kind:'touchline',t,y,x:previous.x+dx*t,z:previous.z+(ball.z-previous.z)*t});}
 return exits.sort((a,b)=>a.t-b.t)[0]||null;
}
export function handleBoundary(s,previous,onGoal){
 const b=s.ball,exit=crossing(previous,b);if(!exit)return false;
 const last=s.lastTouch||s.last;
 if(exit.kind==='touchline'){awardRestart(s,'throwIn',last?1-last.team:0,clamp(exit.x,.35,104.65),exit.y<0?.35:67.65);return true;}
 const right=exit.x>50,scoringTeam=attackDirection(s,0)===(right?1:-1)?0:1,defendingTeam=1-scoringTeam;
 const inMouth=exit.y>=27+BALL_RADIUS&&exit.y<=41-BALL_RADIUS&&exit.z+BALL_RADIUS<=2.5;
 const post=(Math.abs(exit.y-27)<BALL_RADIUS+.08||Math.abs(exit.y-41)<BALL_RADIUS+.08)&&exit.z<2.7;
 const bar=exit.y>27&&exit.y<41&&Math.abs(exit.z-2.5)<BALL_RADIUS;
 if(post||bar){b.x=right?104.65:.35;b.y=exit.y;b.vx=-b.vx*.65;if(bar)b.vz=-Math.abs(b.vz||2);notify(s,'WOODWORK');ruleEvent(s,'woodwork');return true;}
 if(inMouth&&last){
  const direct=s.restartTouch;
  if(direct&&((direct.kind==='throwIn'||direct.kind==='indirect')||direct.team!==scoringTeam)){
   awardRestart(s,direct.team===scoringTeam?'goalKick':'corner',direct.team===scoringTeam?defendingTeam:scoringTeam,right?104.65:.35,exit.y<34?.35:67.65);return true;
  }
  onGoal(scoringTeam,last);return true;
 }
 const corner=last?.team===defendingTeam;awardRestart(s,corner?'corner':'goalKick',corner?scoringTeam:defendingTeam,right?104.65:.35,exit.y<34?.35:67.65);return true;
}
export function advanceClock(s,dt){
 s.time+=dt;const start=s.periodStart||0,elapsed=s.time-start,base=s.half?45:0;
 s.minute=Math.min(base+45,base+Math.floor((elapsed+1e-8)/4));s.addedMinute=Math.max(0,Math.floor((elapsed-180+1e-8)/4));
 const period=s.half?1:0;s.lostTime??=[0,0];s.addedTime??=[null,null];
 if(elapsed>=180&&s.addedTime[period]===null)s.addedTime[period]=Math.ceil(s.lostTime[period]/4);
 // Do not end while a penalty already awarded still needs to be completed.
 const penaltyLive=s.setPiece?.kind==='penalty'||s.penaltyInFlight;
 return elapsed+1e-7>=180+(s.addedTime[period]||0)*4&&!penaltyLive;
}
export function accountStoppage(s,dt){const p=s.half?1:0;s.lostTime[p]+=dt;if(s.addedTime[p]!==null)s.addedTime[p]=Math.ceil(s.lostTime[p]/4);}
