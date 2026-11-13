import {active,attackDirection,inPenaltyArea,ownGoalX,notify} from './rules.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const SKILLS={rainbow:.85,fakeShot:.6,laneChange:.65,elastico:.75};
export function performSkill(s,kind,input={}){
 const p=s.players[s.owner];
 if(!SKILLS[kind]||!p||!active(p)||s.owner!==s.selected||s.mode==='auto'||s.paused||s.finished||s.setPiece||s.restart>0||p.handling||p.role==='GK'||(p.skillReadyAt||0)>s.time)return false;
 const length=Math.hypot(input.x||0,input.y||0),moving=Math.hypot(p.vx,p.vy),dir=attackDirection(s,p.team);
 const fx=length>.1?input.x/length:moving>.5?p.vx/moving:dir,fy=length>.1?input.y/length:moving>.5?p.vy/moving:0;
 p.skill={kind,start:s.time,until:s.time+SKILLS[kind],fx,fy};p.skillReadyAt=s.time+SKILLS[kind]+.65;p.stamina=Math.max(0,p.stamina-1.5);
 p.visual={kind,until:p.skill.until,vx:fx,vy:fy};notify(s,kind==='fakeShot'?'FAKE SHOT':kind==='laneChange'?'LANE CHANGE':kind.toUpperCase());return true;
}
export function skillMotion(p,time){
 const skill=p.skill;if(!skill||time>=skill.until)return null;
 const u=clamp((time-skill.start)/SKILLS[skill.kind],0,1),{kind,fx,fy}=skill;
 let forward=4,side=0,lateral=0,height=0;
 if(kind==='rainbow'){forward=5.8;height=Math.sin(Math.PI*u)*2.7;}
 if(kind==='fakeShot'){forward=u<.55?.3:4.5;lateral=Math.sin(Math.PI*u)*.35;}
 if(kind==='laneChange'){forward=4.8;side=Math.sin(Math.PI*u)*5;lateral=.6*Math.sin(Math.PI*u);}
 if(kind==='elastico'){forward=4.2;side=u<.38?4:-3.7;lateral=u<.38?u/.38*.8:.8-(u-.38)/.62*1.5;}
 return {vx:fx*forward-fy*side,vy:fy*forward+fx*side,ballX:fx*.95-fy*lateral,ballY:fy*.95+fx*lateral,height};
}
export function protectedKeeper(s){const p=s.players[s.owner];return p&&active(p)&&p.role==='GK'&&p.handling&&inPenaltyArea(s,p.team,p.x,p.y)?p:null;}
export function keepAreaClear(s){
 const keeper=protectedKeeper(s);if(!keeper)return;
 const dir=attackDirection(s,keeper.team),goal=ownGoalX(s,keeper.team);
 for(const p of s.players){if(p===keeper||!active(p)||!inPenaltyArea(s,keeper.team,p.x,p.y))continue;
  const exits=[{d:Math.abs(p.x-(goal+dir*17.3)),x:goal+dir*17.3,y:p.y},{d:p.y-13,x:p.x,y:13},{d:55-p.y,x:p.x,y:55}].sort((a,b)=>a.d-b.d);
  p.x=exits[0].x;p.y=exits[0].y;p.vx=0;p.vy=0;
 }
}
