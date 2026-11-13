function shuffle(values,random){
 const result=[...values];
 for(let i=result.length-1;i>0;i--){const j=Math.min(i,Math.floor(Math.max(0,random())*(i+1)));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function createMatchMoments(winChance,random=Math.random){
 const chance=Math.max(0,Math.min(1,Number.isFinite(winChance)?winChance:0));
 const successfulCells=Math.round(chance*20);
 return {
  successfulCells,
  attack:shuffle(Array.from({length:20},(_,i)=>i),random).slice(0,successfulCells),
  defence:shuffle(Array.from({length:20},(_,i)=>i),random).slice(0,successfulCells),
  minutes:shuffle(Array.from({length:90},(_,i)=>i+1),random).slice(0,3).sort((a,b)=>a-b),
 };
}
export function matchReward(home,away){
 return home>away?7000+Math.min(4,home-away)*250:home===away?4500:3000+Math.min(4,home)*250;
}

export function applyClubGrants(club,grants){
 const applied=new Set(club.appliedGrants||[]);let added=0;
 for(const grant of grants){if(typeof grant.id!=='string'||!Number.isSafeInteger(grant.amount)||grant.amount<=0||applied.has(grant.id))continue;applied.add(grant.id);added+=grant.amount;}
 return added?{...club,coins:club.coins+added,appliedGrants:[...applied]}:club;
}
