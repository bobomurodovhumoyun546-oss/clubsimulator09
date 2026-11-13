import {normalizeAnswer} from '../lib/gameEngine.js';
import {playerOVR} from './playerRatings.js';

export function marketPlayers(players,{edition='normal',query='',position='',nation='',min='',max='',order='desc'}={}){
 const key=normalizeAnswer(query);
 return players.filter(p=>!p.copyOf&&p.cardEdition===edition&&p.image&&p.positions.length&&normalizeAnswer(p.fullName).includes(key)&&(!position||p.positions.includes(position))&&(!nation||p.nationality===nation)&&(min===''||playerOVR(p)>=Number(min))&&(max===''||playerOVR(p)<=Number(max))).sort((a,b)=>(order==='asc'?1:-1)*(playerOVR(a)-playerOVR(b))||(edition==='rivals'?(a.rivalsIndex??0)-(b.rivalsIndex??0):a.fullName.localeCompare(b.fullName)));
}
export function reservePlayers(club,players,order='desc'){
 const starters=new Set(club.lineup),owned=new Set(club.owned);
 return players.filter(p=>owned.has(p.id)&&!starters.has(p.id)).sort((a,b)=>(order==='asc'?1:-1)*(playerOVR(a,club.training[a.id]||0)-playerOVR(b,club.training[b.id]||0))||a.fullName.localeCompare(b.fullName));
}
