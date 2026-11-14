import {withAlternatePositions} from './playerPositions.js';
import {ratingInfo} from './playerRatings.js';
import {normalizeAnswer} from '../lib/gameEngine.js';
import {legendaryRatings} from '../data/legendaryRatings.js';
import {rivalsEventByName} from '../data/rivalsEvent.js';
import {ballonEventByName} from '../data/ballonEvent.js';
import rivalsLegacy from '../data/rivalsLegacy.json' with {type:'json'};
import ballonPortraits from '../data/ballonPortraits.json' with {type:'json'};
const legacyByName=new Map(rivalsLegacy.map(p=>[normalizeAnswer(p.name),p]));
const custom=new Map(legendaryRatings.map(([name,ovr])=>[normalizeAnswer(name),ovr]));

export function simulatorCards(players){
 return players.flatMap(original=>{
  const player=withAlternatePositions(original);
  const peak=ratingInfo(player).overall;
  const normal=normalizeAnswer(player.fullName)==='robert lewandowski'?88:peak;
  const base={...player,basePlayerId:player.id,cardEdition:'normal',cardOverall:normal};
  const legendary=custom.get(normalizeAnswer(player.fullName));
  const cards=peak>=85||legendary?[base,{...player,id:`${player.id}::legendary`,basePlayerId:player.id,cardEdition:'legendary',cardOverall:legendary??Math.min(100,Math.max(95,peak+5))}]:[base];
  const event=ballonEventByName.get(normalizeAnswer(player.fullName));
  if(event)cards.push({...player,...ballonPortraits[player.fullName],id:`${player.id}::ballondor`,basePlayerId:player.id,cardEdition:'ballondor',cardOverall:event.overall,ballonWinner:event.winner});
  const rival=rivalsEventByName.get(normalizeAnswer(player.fullName));
  const rivalPositions=rival?.position?[rival.position,...player.positions.filter(position=>position!==rival.position)]:player.positions;
  if(rival)cards.push({...player,positions:rivalPositions,primaryPosition:rivalPositions[0],alternatePositions:rivalPositions.slice(1),attributePositions:player.attributePositions||player.positions,id:`${player.id}::rivals`,basePlayerId:player.id,cardEdition:'rivals',cardOverall:rival.overall,rivalsSide:rival.side,rivalsIndex:rival.index,rivalsPortraitCentered:Boolean(rival.portraitCentered),rivalsPortraitPosition:rival.portraitPosition,rivalsRegular:Boolean(rival.regular),replacesBallon:Boolean(rival.replacesBallon),rivalsOpponent:rival.rival,rivalsLegend:Boolean(player.isLegend||player.isRetired||player.deathDate),...(rival.image?{image:rival.image,imageSource:rival.imageSource,imageAuthor:rival.imageAuthor||'User-supplied event portrait',imageLicense:rival.imageLicense||'Rights retained by the original rights holder',portraitStyle:rival.portraitStyle||'photo',portraitZoom:1}:{})});
  const legacy=legacyByName.get(normalizeAnswer(player.fullName));
  if(legacy&&!rival)cards.push({...player,id:`${player.id}::rivals`,basePlayerId:player.id,cardEdition:'rivalsLegacy',cardOverall:legacy.overall,rivalsSide:legacy.side,archived:true});
  return cards;
 });
}

export function formationRows(roles){
 const defenders=roles.map((r,i)=>({r,i})).filter(({r})=>['LB','RB','CB','LWB','RWB'].includes(r));
 const forwards=roles.map((r,i)=>({r,i})).filter(({r})=>['ST','LW','RW','CF'].includes(r));
 const midfield=roles.map((r,i)=>({r,i})).filter(({i})=>i>0&&!defenders.some(x=>x.i===i)&&!forwards.some(x=>x.i===i));
 const attacking=midfield.filter(x=>x.r==='CAM'),central=midfield.filter(x=>x.r!=='CAM');
 return [forwards,attacking,central,defenders,[{r:'GK',i:0}]].filter(row=>row.length);
}
