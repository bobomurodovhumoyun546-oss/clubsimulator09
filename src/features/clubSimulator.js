import {inventoryPlayers,ownsCard} from './cardInventory.js';
import {playerPrice,sellPrice} from './playerEconomy.js';
import {benchSlots} from './squadBench.js';
import {openSimulatorPack,choosePackPlayer} from './simulatorPacks.js';
export {playerPrice};
import {matchReward} from './matchMoments.js';
import {ensureOpponentSquads} from './opponentSquads.js';
import {goalEvents} from './seasonScorers.js';
import { fitsPosition } from '../games/core/players.js';
import { playerOVR } from './playerRatings.js';
import {createSeason,currentSeason,addSeasonMembers,seasonForMatch,recordSeasonMatch,seasonRows} from './clubSeason.js';
import { matchPreview,simulateScore,expectedGoals } from './footballMatch.js';
export const formations={
 '4-3-3':['GK','LB','CB','CB','RB','CM','CDM','CM','LW','ST','RW'],
 '4-3-3 Attack':['GK','LB','CB','CB','RB','CM','CAM','CM','LW','ST','RW'],
 '4-1-2-1-2 Narrow':['GK','LB','CB','CB','RB','CDM','CM','CM','CAM','ST','ST'],
 '4-1-2-1-2 Wide':['GK','LB','CB','CB','RB','CDM','LM','RM','CAM','ST','ST'],
 '4-2-3-1':['GK','LB','CB','CB','RB','CDM','CDM','LM','CAM','RM','ST'],
 '3-4-3':['GK','CB','CB','CB','LM','CM','CM','RM','LW','ST','RW'],
 '5-3-2':['GK','LB','CB','CB','CB','RB','CM','CDM','CM','ST','ST'],
 '4-3-2-1':['GK','LB','CB','CB','RB','CM','CDM','CM','CAM','CAM','ST'],
 '4-4-2':['GK','LB','CB','CB','RB','LM','CM','CM','RM','ST','ST'],
 '3-5-2':['GK','CB','CB','CB','LM','CM','CDM','CM','RM','ST','ST'],
};
import {coaches} from '../data/managers.js';
export {coaches};
export const simRating=playerOVR;
export function fitsSlot(player,slot){return fitsPosition(player,slot)||fitsPosition(player,{LB:'DEF',RB:'DEF',CB:'DEF',CM:'MID',CAM:'MID',CDM:'MID',LM:'MID',RM:'MID',LW:'FWD',RW:'FWD',ST:'FWD'}[slot]);}
export function autoLineup(players,formation){const picked=new Set();return formations[formation].map(slot=>{const p=players.find(p=>!picked.has(p.basePlayerId||p.id)&&fitsSlot(p,slot));if(p)picked.add(p.basePlayerId||p.id);return p?.id||null;});}
export function bestLineup(players,formation,training={}){
 const roles=formations[formation],chosen=Array(11).fill(null);
 const available=[...players].sort((a,b)=>simRating(b,training[b.id]||0)-simRating(a,training[a.id]||0)||a.fullName.localeCompare(b.fullName));
 function assign(player,visited){
  const slots=roles.map((role,i)=>({role,i})).filter(({role})=>fitsSlot(player,role)).sort((a,b)=>Number(player.positions.includes(b.role))-Number(player.positions.includes(a.role)));
  for(const {i}of slots){if(visited.has(i))continue;visited.add(i);if(!chosen[i]||assign(chosen[i],visited)){chosen[i]=player;return true;}}
  return false;
 }
 const identities=new Set();let filled=0;for(const player of available){const identity=player.basePlayerId||player.id;if(identities.has(identity))continue;if(assign(player,new Set())){filled++;identities.add(identity);}if(filled===11)break;}
 return chosen.map(p=>p?.id||null);
}
export function initialClub(players){
 const candidates=players.filter(p=>p.positions.length&&p.image&&!p.deathDate).sort((a,b)=>simRating(a)-simRating(b)||a.fullName.localeCompare(b.fullName));
 const lineup=autoLineup(candidates,'4-3-3'),owned=lineup.filter(Boolean);
 for(const p of candidates)if(owned.length<18&&!owned.includes(p.id))owned.push(p.id);
 return {version:1,name:'FC Legacy',symbol:'⚽',shape:'shield',primary:'#16a34a',secondary:'#f8fafc',pattern:'stripes',coins:25000,owned,lineup,formation:'4-3-3',coach:'academy',coaches:['academy'],training:{},tactics:'balanced',difficulty:'easy',season:createSeason(),leagueMembers:[],history:[],goalsFor:0,goalsAgainst:0,played:0,wins:0,draws:0,losses:0,trophies:0};
}
export function squadOVR(state,players){const lookup=new Map(players.map(p=>[p.id,p]));const total=state.lineup.reduce((n,id)=>n+(lookup.has(id)?simRating(lookup.get(id),state.training[id]||0):0),0);return Math.round(total/11)+(coaches.find(c=>c.id===state.coach)?.boost||0);}
export function clubAction(state,action,players,random=Math.random){
 players=inventoryPlayers(players,state);
 const lookup=new Map(players.map(p=>[p.id,p]));const fail=error=>({state,error});
 if(action.type==='bench'){
  if(!Number.isInteger(action.slot)||action.slot<0||action.slot>6)return fail('locked');
  const bench=benchSlots(state,players),p=lookup.get(action.id);
  if(action.id!=null){
   if(!p||!state.owned.includes(p.id)||state.lineup.some(id=>(lookup.get(id)?.basePlayerId||id)===(p.basePlayerId||p.id)))return fail('locked');
   for(let i=0;i<7;i++)if(i!==action.slot&&(lookup.get(bench[i])?.basePlayerId||bench[i])===(p.basePlayerId||p.id))bench[i]=null;
  }
  bench[action.slot]=action.id??null;return {state:{...state,bench}};
 }
 if(action.type==='league-members'){
   const members=action.members||[],season=addSeasonMembers(currentSeason(state),members);
   if(state.season===season&&JSON.stringify(state.leagueMembers||[])===JSON.stringify(members))return {state};
   return {state:{...state,leagueMembers:members,season}};
 }
 if(action.type==='pack')return openSimulatorPack(state,action.id,players,random);
 if(action.type==='choose-pack')return choosePackPlayer(state,action.index,players);
 if(action.type==='reveal-pack'){
  if(!state.lastPack||!Number.isInteger(action.index)||!state.lastPack.cards[action.index])return fail('locked');
  return {state:{...state,lastPack:{...state.lastPack,cards:state.lastPack.cards.map((c,i)=>i===action.index?{...c,revealed:true}:c)}}};
 }
 if(action.type==='buy'){
   const p=lookup.get(action.id);if(!p||ownsCard(state,p.id))return fail('owned');const cost=playerPrice(p);if(cost>state.coins)return fail('notEnoughCoins');
   return {state:{...state,coins:state.coins-cost,owned:[...state.owned,p.id]}};
 }
 if(action.type==='sell'){
   if(!state.owned.includes(action.id)||state.lineup.includes(action.id))return fail('needXI');
   const p=lookup.get(action.id);if(!p)return fail('noPlayers');
   const training={...state.training},sellValues={...state.sellValues},cardCopies={...state.cardCopies};delete training[p.id];delete sellValues[p.id];delete cardCopies[p.id];
   return {state:{...state,training,sellValues,cardCopies,bench:benchSlots(state,players).map(id=>id===p.id?null:id),coins:state.coins+sellPrice(state,p),owned:state.owned.filter(id=>id!==p.id)}};
 }
 if(action.type==='train'){
   const level=state.training[action.id]||0,cost=1200+level*600;if(!state.owned.includes(action.id)||level>=5)return fail('locked');if(cost>state.coins)return fail('notEnoughCoins');
   return {state:{...state,coins:state.coins-cost,training:{...state.training,[action.id]:level+1}}};
 }
 if(action.type==='coach'){
   const coach=coaches.find(c=>c.id===action.id);if(!coach)return fail('locked');const owned=state.coaches.includes(coach.id),cost=owned?0:coach.price;if(cost>state.coins)return fail('notEnoughCoins');
   return {state:{...state,coins:state.coins-cost,coach:coach.id,coaches:owned?state.coaches:[...state.coaches,coach.id]}};
 }
 if(action.type==='lineup'){
   const p=lookup.get(action.id),slot=formations[state.formation][action.slot];if(!p||!state.owned.includes(p.id)||!slot||!fitsSlot(p,slot))return fail('needXI');
   if(state.lineup.some((id,i)=>i!==action.slot&&id!==p.id&&(lookup.get(id)?.basePlayerId||id)===(p.basePlayerId||p.id)))return fail('owned');
   const bench=benchSlots(state,players),benchIndex=bench.indexOf(p.id),outgoing=state.lineup[action.slot];
   const previous=state.lineup.indexOf(p.id),next=[...state.lineup];if(previous>=0)next[previous]=null;next[action.slot]=p.id;
   if(benchIndex>=0)bench[benchIndex]=outgoing;
   const updated={...state,lineup:next,bench};return {state:{...updated,bench:benchSlots(updated,players)}};
 }
 if(action.type==='formation'){
   if(!formations[action.value])return fail('needXI');return {state:{...state,formation:action.value,lineup:autoLineup(state.owned.map(id=>lookup.get(id)).filter(Boolean),action.value)}};
 }
 if(action.type==='best-lineup'){
   return {state:{...state,lineup:bestLineup(state.owned.map(id=>lookup.get(id)).filter(Boolean),state.formation,state.training)}};
 }
 if(action.type==='match'){
   if(new Set(state.lineup.filter(Boolean)).size!==11||state.lineup.some((id,i)=>!state.owned.includes(id)||!lookup.has(id)||!fitsSlot(lookup.get(id),formations[state.formation][i])))return fail('needXI');
   const previousSeason=currentSeason(state);
   state={...state,lastSeason:previousSeason.complete?previousSeason:state.lastSeason,season:ensureOpponentSquads(seasonForMatch(state),players,state.difficulty)};
   const own=squadOVR(state,players),preview=matchPreview(state,players,formations[state.formation],own),opponentOVR=preview.opponent.overall,opponent=preview.opponent.name;
   const live=action.liveMatch;
   if(live&&(!live.finished||live.minute!==90||!Array.isArray(live.log)||live.log.length>20))return fail('generic');
   const score=live?{home:0,away:0}:simulateScore(preview.xg,random);
   const moments=action.moments;
   const attackGoal=moments?.goal===true?1:0,quizGoal=moments?.quiz===true&&random()<.35?1:0,conceded=moments&&moments.saved===false?1:0;
   let home=Math.min(10,score.home+attackGoal+quizGoal),away=Math.min(10,score.away+conceded);
   const ownLineup=state.lineup.map(id=>({id,training:state.training[id]||0}));
   const opponentLineup=state.season.squads?.[preview.opponent.id]?.lineup||[];
   let events=[...goalEvents(home,ownLineup,'you',state.name,players,random,true),...goalEvents(away,opponentLineup,preview.opponent.id,opponent,players,random,false)];
   const minute=index=>Number.isInteger(moments?.minutes?.[index])&&moments.minutes[index]>=1&&moments.minutes[index]<=90?moments.minutes[index]:null;
   const ownEvents=events.filter(e=>e.home),awayEvents=events.filter(e=>!e.home);
   if(attackGoal&&minute(0)&&ownEvents.length)ownEvents[0].minute=minute(0);
   if(quizGoal&&minute(2)&&ownEvents.length>attackGoal)ownEvents[attackGoal].minute=minute(2);
   if(conceded&&minute(1)&&awayEvents.length)awayEvents[0].minute=minute(1);
   if(live){
    const opposition=new Set(opponentLineup.map(p=>p.id));
    if(live.log.some(e=>typeof e.goal!=='boolean'||typeof e.home!=='boolean'||!Number.isInteger(e.minute)||e.minute<1||e.minute>90||!((e.ownGoal?!e.home:e.home)?state.owned.includes(e.playerId):opposition.has(e.playerId))))return fail('generic');
    events=live.log.filter(e=>e.goal).map(e=>({...e,name:lookup.get(e.playerId)?.fullName+(e.ownGoal?' (OG)':''),clubId:e.home?'you':preview.opponent.id,clubName:e.home?state.name:opponent}));
    home=events.filter(e=>e.home).length;away=events.filter(e=>!e.home).length;
    if(home>10||away>10||!Array.isArray(live.lineup)||live.lineup.length!==11||new Set(live.lineup).size!==11||live.lineup.some((id,i)=>!state.owned.includes(id)||!lookup.has(id)||!fitsSlot(lookup.get(id),formations[state.formation][i])))return fail('needXI');
   }
   events.sort((a,b)=>a.minute-b.minute);
   const won=home>away,draw=home===away,reward=matchReward(home,away);
   const report={season:state.season.number,matchday:preview.opponent.round,venue:preview.opponent.venue,opponent,opponentOVR,own,power:preview.power,xg:preview.xg,winChance:Math.round(preview.chances.win*100),home,away,reward,events,attempts:live?.log,matchStats:live?.stats,rulesLog:live?.rulesLog,discipline:live?.discipline,addedTime:live?.addedTime,abandoned:live?.abandoned,abandonedAt:live?.abandonedAt,substitutions:live?.substitutions,injured:live?.injured,points:won?3:draw?1:0};
   const season=recordSeasonMatch(state.season,home,away,match=>{
    const strength=id=>state.season.squads?.[id]?.overall||80;
    const score=simulateScore(expectedGoals(strength(match.homeId),strength(match.awayId)),random);
    const teamName=id=>state.season.opponents.find(p=>p.id===id)?.name||id;
    return {...score,events:[...goalEvents(score.home,state.season.squads?.[match.homeId]?.lineup||[],match.homeId,teamName(match.homeId),players,random,true),...goalEvents(score.away,state.season.squads?.[match.awayId]?.lineup||[],match.awayId,teamName(match.awayId),players,random,false)]};

   },events);
   const champion=season.complete&&seasonRows(season,state.name)[0].id==='you';
   const history=[...state.history,report].slice(-Math.max(40,season.fixtures.length));
   return {state:{...state,lineup:live?.lineup||state.lineup,season,coins:state.coins+reward+(champion?15000:0),goalsFor:(state.goalsFor??state.history.reduce((n,r)=>n+r.home,0))+home,goalsAgainst:(state.goalsAgainst??state.history.reduce((n,r)=>n+r.away,0))+away,played:state.played+1,wins:state.wins+Number(won),draws:state.draws+Number(draw),losses:state.losses+Number(!won&&!draw),trophies:state.trophies+Number(champion),history},report};
 }
 return fail('generic');
}
