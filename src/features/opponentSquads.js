import {fitsPosition} from '../games/core/players.js';
import {playerOVR} from './playerRatings.js';
const roles=['GK','LB','CB','CB','RB','CM','CDM','CM','LW','ST','RW'];
const group=role=>role==='GK'?'GK':['LB','CB','RB'].includes(role)?'DEF':['CM','CDM'].includes(role)?'MID':'FWD';
const hash=value=>{let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const cache=new WeakMap();
export const opponentBands={easy:[70,80],medium:[80,90],hard:[90,94],extrahard:[95,100]};
export function ensureOpponentSquads(season,players,difficulty='easy'){
 const mode=opponentBands[difficulty]?difficulty:'easy',version=`${mode}:2`;
 if(cache.get(season)?.players===players&&cache.get(season)?.difficulty===mode)return cache.get(season).season;
 if(season.squadDifficulty===version&&season.opponents.every(p=>season.squads?.[p.id]?.lineup.length===11))return season;
 const [minimum,maximum]=opponentBands[mode];
 const pool=players.filter(p=>!p.copyOf&&playerOVR(p)>=minimum-(['hard','extrahard'].includes(mode)?5:0)&&playerOVR(p)<=Math.min(maximum,mode==='extrahard'?100:92)&&p.positions.length);
 if(!pool.length)return season;
 const squads=season.squadDifficulty===version?{...season.squads}:{},used=new Set(Object.values(squads).flatMap(s=>s.lineup.map(p=>p.id)));
 for(const opponent of season.opponents){
  if(squads[opponent.id]?.lineup.length===11)continue;
  const local=new Set(),lineup=[];
  for(const role of roles){
   const eligible=pool.filter(p=>!local.has(p.basePlayerId||p.id)&&(fitsPosition(p,role)||fitsPosition(p,group(role))));
   eligible.sort((a,b)=>Number(used.has(a.id))-Number(used.has(b.id))||hash(opponent.id+a.id)-hash(opponent.id+b.id));
   // One fixed example of a partially trained legend, rather than always +5.
   const ginola=opponent.id==='ai-0'&&role==='LW'?eligible.find(p=>/david ginola/i.test(p.fullName)):null;
   const player=ginola||eligible[0];if(!player)continue;
   const rating=playerOVR(player),low=Math.max(0,minimum-rating),high=Math.min(5,maximum-rating);
   const training=ginola?Math.max(low,Math.min(high,3)):low+hash(`${opponent.id}:${player.id}:training`)%(high-low+1);
   lineup.push({id:player.id,training,role});local.add(player.basePlayerId||player.id);used.add(player.id);
  }
  if(lineup.length===11)squads[opponent.id]={lineup,overall:Math.round(lineup.reduce((sum,p)=>sum+playerOVR(players.find(x=>x.id===p.id),p.training),0)/11)};
 }
 const next={...season,squads,squadDifficulty:version};cache.set(season,{players,difficulty:mode,season:next});return next;
}
