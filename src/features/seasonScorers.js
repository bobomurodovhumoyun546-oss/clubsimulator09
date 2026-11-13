import {fitsPosition} from '../games/core/players.js';
import {playerAttributes} from './playerRatings.js';
function pick(entries,weight,random){
 const weights=entries.map(weight),total=weights.reduce((a,b)=>a+b,0);let target=Math.max(0,Math.min(1-Number.EPSILON,random()))*total;
 for(let i=0;i<entries.length;i++){target-=weights[i];if(target<0)return entries[i];}return entries.at(-1);
}
export function goalEvents(goals,lineup,clubId,clubName,players,random=Math.random,home=false){
 const lookup=new Map(players.map(p=>[p.id,p]));
 const entries=lineup.map(item=>({...item,player:lookup.get(item.id)})).filter(p=>p.player&&!fitsPosition(p.player,'GK')).map(item=>({...item,attributes:playerAttributes(item.player,item.training).values}));
 if(!entries.length)return [];
 const events=[];
 for(let i=0;i<goals;i++){
  const scorer=pick(entries,e=>e.attributes.sho**2*(fitsPosition(e.player,'FWD')?5:fitsPosition(e.player,'MID')?2:.35),random);
  const candidates=entries.filter(e=>e.id!==scorer.id);
  const assist=candidates.length&&random()<.85?pick(candidates,e=>e.attributes.pas**2*(fitsPosition(e.player,'MID')?3:1),random):null;
  events.push({minute:1+Math.min(89,Math.floor(random()*90)),home,clubId,clubName,playerId:scorer.id,name:scorer.player.fullName,assistId:assist?.id||null,assistName:assist?.player.fullName||null});
 }
 return events;
}
export function addScoringEvents(stats,events){
 const next=structuredClone(stats||{});
 const entry=(event,id,name)=>next[`${event.clubId}:${id}`]||=({playerId:id,name,clubId:event.clubId,clubName:event.clubName,goals:0,assists:0});
 for(const event of events){if(!event.playerId||event.ownGoal)continue;entry(event,event.playerId,event.name).goals++;if(event.assistId&&event.assistId!==event.playerId)entry(event,event.assistId,event.assistName).assists++;}
 return next;
}
export function scoringLeaders(season,field){return Object.values(season.playerStats||{}).filter(p=>p[field]>0).sort((a,b)=>b[field]-a[field]||(field==='goals'?b.assists-a.assists:b.goals-a.goals)||a.name.localeCompare(b.name));}
