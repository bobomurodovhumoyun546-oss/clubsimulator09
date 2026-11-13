import {playerOVR} from './playerRatings.js';

export function benchSlots(club,players){
 const lookup=new Map(players.map(p=>[p.id,p]));
 const identities=new Set(club.lineup.filter(Boolean).map(id=>lookup.get(id)?.basePlayerId||id));
 const seen=new Set(identities);
 const candidates=Array.isArray(club.bench)?club.bench:[...players].filter(p=>club.owned.includes(p.id)).sort((a,b)=>playerOVR(b,club.training?.[b.id]||0)-playerOVR(a,club.training?.[a.id]||0)).filter(p=>{const identity=p.basePlayerId||p.id;if(seen.has(identity))return false;seen.add(identity);return true;}).map(p=>p.id);
 const slots=Array(7).fill(null);
 for(let i=0;i<Math.min(7,candidates.length);i++){
  const p=lookup.get(candidates[i]),identity=p?.basePlayerId||p?.id;
  if(p&&club.owned.includes(p.id)&&!identities.has(identity)){slots[i]=p.id;identities.add(identity);}
 }
 return slots;
}
