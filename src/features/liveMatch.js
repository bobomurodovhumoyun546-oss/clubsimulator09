import {createMatchMoments} from './matchMoments.js';
import {fitsPosition,positionGroup} from '../games/core/players.js';
const pick=(list,random)=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
export function startLiveMatch(club,opponent,opponentLineup,winChance,random=Math.random){
 const count=10+Math.floor(random()*5);
 const slots=Array.from({length:14},(_,i)=>({minute:3+i*6+Math.floor(random()*3),key:random(),home:i%2===0})).sort((a,b)=>a.key-b.key).slice(0,count).sort((a,b)=>a.minute-b.minute);
 return {minute:0,lineup:[...club.lineup],owned:[...club.lineup,...(club.bench||club.owned)].filter(Boolean),roles:[...club.roles],clubId:'you',clubName:club.name,opponent,opponentLineup,winChance,schedule:slots,cursor:0,pending:null,log:[],off:[],substitutions:[],injured:[],injuryMinute:random()<.01?10+Math.floor(random()*70):null,finished:false};
}
export function canSubstitute(match,outId,inPlayer){
 const slot=match.lineup.indexOf(outId);
 return slot>=0&&inPlayer&&match.owned.includes(inPlayer.id)&&!match.lineup.includes(inPlayer.id)&&!match.off.includes(inPlayer.id)&&!match.injured.includes(inPlayer.id)&&match.substitutions.length<5&&(fitsPosition(inPlayer,match.roles[slot])||fitsPosition(inPlayer,positionGroup(match.roles[slot])));
}
function resolveAttempt(state,choice){
 const p=state.pending;if(!p)return state;
 const success=Number.isInteger(choice)&&p.cells.includes(choice);
 const goal=p.home?success:!success;
 const entry={...p,cells:undefined,goal,choice,playerId:p.attackerId,name:p.attackerName,clubId:p.home?'you':state.opponent.id,clubName:p.home?state.clubName:state.opponent.name,assistId:goal?p.assistId:null,assistName:goal?p.assistName:null};
 return {...state,pending:null,log:[...state.log,entry]};
}
export function advanceLiveMatch(state,action,players,random=Math.random){
 if(state.finished)return state;
 if(action.type==='choose')return action.cell>=0&&action.cell<20?resolveAttempt(state,action.cell):state;
 if(action.type==='substitute'){
  const player=players.find(p=>p.id===action.inId);if(!canSubstitute(state,action.outId,player))return state;
  const identity=player.basePlayerId||player.id;
  if(state.lineup.some(id=>(players.find(p=>p.id===id)?.basePlayerId||id)===identity))return state;
  return {...state,lineup:state.lineup.map(id=>id===action.outId?action.inId:id),off:[...state.off,action.outId],substitutions:[...state.substitutions,{minute:state.minute,outId:action.outId,inId:action.inId}]};
 }
 if(action.type!=='tick')return state;
 let next={...state,minute:Math.min(90,state.minute+1)};
 if(next.pending&&next.minute>=next.pending.minute+5)next=resolveAttempt(next,null);
 if(next.minute===next.injuryMinute){
  const eligible=next.lineup.filter(id=>!fitsPosition(players.find(p=>p.id===id)||{positions:[]},'GK'));
  const injured=pick(eligible,random);if(injured)next={...next,injured:[injured]};
 }
 const chance=next.schedule[next.cursor];
 if(chance&&chance.minute===next.minute){
  if(next.pending)next=resolveAttempt(next,null);
  const own=next.lineup.filter(id=>!next.injured.includes(id)).map(id=>players.find(p=>p.id===id)).filter(Boolean),opposition=next.opponentLineup.map(item=>players.find(p=>p.id===item.id)).filter(Boolean);
  const attacking=chance.home?own:opposition,defending=chance.home?opposition:own;
  const forwards=attacking.filter(p=>fitsPosition(p,'FWD'));
  const attacker=pick(forwards.length?forwards:attacking.filter(p=>!fitsPosition(p,'GK')),random),keeper=defending.find(p=>fitsPosition(p,'GK'));
  const support=attacking.filter(p=>p.id!==attacker?.id&&!fitsPosition(p,'GK'));
  const assist=random()<.7?pick(support,random):null;
  const cells=createMatchMoments(next.winChance,random);
  next={...next,cursor:next.cursor+1,pending:attacker&&keeper?{minute:next.minute,home:chance.home,attackerId:attacker.id,attackerName:attacker.fullName,keeperId:keeper.id,keeperName:keeper.fullName,assistId:assist?.id||null,assistName:assist?.fullName||null,cells:chance.home?cells.attack:cells.defence}:null};
 }
 if(next.minute===90){if(next.pending)next=resolveAttempt(next,null);next.finished=true;}
 return next;
}
export function liveScore(match){return {home:match.log.filter(e=>e.goal&&e.home).length,away:match.log.filter(e=>e.goal&&!e.home).length};}
