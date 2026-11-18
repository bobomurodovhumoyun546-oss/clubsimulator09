import {defaultTactics} from '../features/career/rules.js';
import {active,attackDirection,ownGoalX} from './rules.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Match-only weighting keeps catalogue ratings intact while making OVR matter.
export const matchQuality=(p,key)=>clamp((p.stats[key]??p.ovr)*.6+p.ovr*.4,1,110);
export function supportPosition(s,p,owner){
 const dir=attackDirection(s,p.team),progress=dir>0?s.ball.x:105-s.ball.x;
 const home=dir>0?p.homeX:105-p.homeX,attacking=owner?.team===p.team;
 const tactical=p.team===0?{...defaultTactics,...s.advancedTactics}:defaultTactics;
 let depth=home+(progress-52.5)*.2+(tactical.mentality-50)*.045;
 if(['ST','CF','LW','RW'].includes(p.role))depth=clamp(progress+(attacking?11:8),32,92);
 else if(['CB','LB','RB','LWB','RWB','CDM','DM'].includes(p.role)){
  const line=clamp(progress-(attacking?19:12),16,68);
  depth=line+(['CDM','DM'].includes(p.role)?9:p.role==='CB'?0:2);
 }
 let y=clamp(34+(p.homeY-34)*(.75+tactical.width*.005)+(s.ball.y-34)*.18,4,64);
 if(['CB','LB','RB','CDM'].includes(p.role))depth+=(tactical.line-50)*.06;
 if(tactical.roles?.[p.id]==='anchor')depth-=3;
 if(tactical.roles?.[p.id]==='runner'&&attacking)depth+=3;
 if(owner&&owner.team!==p.team&&['CB','LB','RB','CDM','DM'].includes(p.role)){
  const threats=s.players.filter(q=>active(q)&&q.team!==p.team&&q!==owner&&q.role!=='GK'&&Math.abs(q.y-p.homeY)<17).sort((a,b)=>Math.abs(a.x-ownGoalX(s,p.team))-Math.abs(b.x-ownGoalX(s,p.team)));
  const mark=threats[0];
  if(mark){depth=Math.min(depth,clamp((dir>0?mark.x:105-mark.x)-2,12,75));y=y*.45+mark.y*.55;}
 }
 return {x:dir>0?depth:105-depth,y};
}
export function keeperPosition(s,p,rush=false){
 const dir=attackDirection(s,p.team),goal=ownGoalX(s,p.team),x=goal+dir*(rush?12:3.2),b=s.ball;
 const shot=s.last?.kind==='shot'&&s.last.team!==p.team&&b.vx*dir<0;
 if(rush){
  // Close the angle along the ball's actual lane, including after changing ends.
  const ahead=clamp((b.x-goal)*dir,3.2,16);
  const travel=clamp(Math.hypot(b.x-p.x,b.y-p.y)/12,0,.45);
  return {x:goal+dir*ahead,y:clamp(b.y+b.vy*travel,14,54),diving:shot,reaction:.24-matchQuality(p,'ref')*.0015};
 }
 if(!shot)return {x,y:34,diving:false};
 const arrival=(p.x-b.x)/(b.vx||1),aim=b.y+b.vy*Math.max(0,arrival);
 return {x:p.x,y:clamp(aim,26.8,41.2),diving:arrival>=0&&arrival<1.3,reaction:.24-matchQuality(p,'ref')*.0015};
}
// Shot side is captured at release so keeper movement cannot change near-post detection.
export function isNearPostShot(shot){
 if(!shot||!Number.isFinite(shot.originY)||!Number.isFinite(shot.targetY))return false;
 const source=shot.originY-34,aim=shot.targetY-34;
 return Math.abs(source)>=2&&Math.abs(aim)>=3.2&&Math.abs(aim)<=6.77&&source*aim>0;
}
export function keeperSaveChances(p,speed,rushing=false,nearPost=false){
 const quality=matchQuality(p,'ref')*.7+matchQuality(p,'han')*.3;
 const elite=clamp((Math.max(quality,p.ovr)-70)/40,0,1);
 // Reachable on-target shots: maximum quality has 70% / 85% save probability.
 // Pace makes lesser keepers less reliable; elite calibration stays explicit.
 let total=clamp(.4+elite*.3-(1-elite)*clamp((speed-35)/300,-.04,.1),.2,.7);
 if(rushing)total+=.075+elite*.075;
 if(nearPost)total=Math.max(total,.8);
 const parry=.14;
 return {catchChance:total-parry,parry};
}
