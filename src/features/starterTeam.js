import {teamById,starterCards,teamIdentity} from './starterCards.js';
import {bestLineup} from './clubSimulator.js';
export function applyStarterTeam(club,teamId){
 const team=teamById.get(teamId);if(!team||team.roster.length!==26||club.starterTeamId||club.played>0)throw new Error('starterUnavailable');
 const cards=starterCards({starterTeamId:teamId}),lineup=bestLineup(cards,'4-3-3');if(lineup.some(id=>!id))throw new Error('starterUnavailable');
 const selected=new Set(lineup),bench=cards.filter(p=>!selected.has(p.id)).slice(0,7).map(p=>p.id);
 return {...club,...teamIdentity(team),starterTeamId:teamId,owned:[...new Set([...club.owned,...cards.map(p=>p.id)])],formation:'4-3-3',lineup,bench};
}
