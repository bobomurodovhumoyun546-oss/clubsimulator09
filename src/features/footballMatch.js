import {ensureOpponentSquads,opponentBands} from './opponentSquads.js';
import {seasonForMatch} from './clubSeason.js';
import {playerAttributes,playerOVR} from './playerRatings.js';
import {positionGroup} from '../games/core/players.js';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function upcomingOpponent(state){
 const season=seasonForMatch(state),round=season.played,fixture=season.fixtures[round];
 const opponent=season.opponents.find(p=>p.id===fixture.opponentId);
 const [minimum,maximum]=opponentBands[state.difficulty]||opponentBands.easy;
 const index=season.opponents.findIndex(p=>p.id===opponent.id);
 const fallback=minimum+index%(maximum-minimum+1);
 const squad=season.squadDifficulty===`${state.difficulty||'easy'}:2`?season.squads?.[opponent.id]:null;
 return {...opponent,overall:squad?.overall??fallback,round:round+1,venue:fixture.venue,season:season.number,total:season.fixtures.length};
}
export function teamPower(state,players,roles,overall){
 const lookup=new Map(players.map(p=>[p.id,p])),units={GK:[],DEF:[],MID:[],FWD:[]};let mismatches=0;
 state.lineup.forEach((id,i)=>{
  const p=lookup.get(id);if(!p)return;
  const group=positionGroup(roles[i]),v=playerAttributes(p,state.training[id]||0).values,o=playerOVR(p,state.training[id]||0);
  if(!p.positions.includes(roles[i])&&!p.positions.includes(group))mismatches++;
  const strength=group==='GK'?(v.ref*.35+v.div*.25+v.pos*.25+v.han*.15):group==='DEF'?(v.def*.55+v.phy*.25+v.pac*.1+v.pas*.1):group==='MID'?(v.pas*.45+v.dri*.3+v.phy*.15+v.pac*.1):(v.sho*.5+v.dri*.2+v.pac*.2+v.pas*.1);
  units[group]?.push(Number.isFinite(strength)?strength:o);
 });
 const avg=group=>units[group].length?units[group].reduce((a,b)=>a+b,0)/units[group].length:overall;
 const attributes=avg('FWD')*.32+avg('MID')*.23+avg('DEF')*.25+avg('GK')*.2;
 return Math.round(Math.max(1,overall*.7+attributes*.3-Math.min(2,mismatches*.15))*10)/10;
}
export function expectedGoals(power,opponent,tactics='balanced',venue='home'){
 const advantage=(power-opponent)*.06;
 const own=(venue==='away'?1.3:1.5)*Math.exp(advantage),away=(venue==='away'?1.5:1.3)*Math.exp(-advantage);
 return {home:clamp(own*(tactics==='attack'?1.12:tactics==='defend'?.88:1),.2,5),away:clamp(away*(tactics==='attack'?1.12:tactics==='defend'?.78:1),.12,4.5)};
}
export function goalDistribution(mean){
 const probabilities=[Math.exp(-mean)];let sum=probabilities[0];
 for(let goals=1;goals<10;goals++){probabilities[goals]=probabilities[goals-1]*mean/goals;sum+=probabilities[goals];}
 probabilities.push(Math.max(0,1-sum));return probabilities;
}
export function matchChances(xg){
 const home=goalDistribution(xg.home),away=goalDistribution(xg.away);let win=0,draw=0,loss=0;
 home.forEach((a,i)=>away.forEach((b,j)=>{if(i>j)win+=a*b;else if(i===j)draw+=a*b;else loss+=a*b;}));
 return {win,draw,loss};
}
function sampleGoals(mean,random){const value=clamp(random(),0,1-Number.EPSILON);let cumulative=0;const distribution=goalDistribution(mean);for(let i=0;i<distribution.length;i++){cumulative+=distribution[i];if(value<cumulative)return i;}return 10;}
export function simulateScore(xg,random=Math.random){return {home:sampleGoals(xg.home,random),away:sampleGoals(xg.away,random)};}
export function matchPreview(state,players,roles,overall){const season=ensureOpponentSquads(seasonForMatch(state),players,state.difficulty),opponent=upcomingOpponent({...state,season}),power=teamPower(state,players,roles,overall),xg=expectedGoals(power,opponent.overall,state.tactics,opponent.venue);return {opponent,power,xg,chances:matchChances(xg)};}
