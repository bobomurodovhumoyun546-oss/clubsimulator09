export function inventoryPlayers(players,club){
 const originals=players.filter(p=>!p.copyOf),lookup=new Map(originals.map(p=>[p.id,p]));
 const copies=Object.entries(club.cardCopies||{}).flatMap(([id,copyOf])=>{
  const player=lookup.get(copyOf);
  return player&&!lookup.has(id)?[{...player,id,copyOf,basePlayerId:player.basePlayerId||player.id}]:[];
 });
 return copies.length?[...originals,...copies]:originals;
}
export function ownsCard(club,id){return club.owned.includes(id)||Object.entries(club.cardCopies||{}).some(([copy,original])=>original===id&&club.owned.includes(copy));}
export function awardCard(club,player){
 const original=player.copyOf||player.id;
 if(!ownsCard(club,original))return {state:{...club,owned:[...club.owned,original]},awardedId:original,duplicate:false};
 let serial=Number.isSafeInteger(club.copySerial)?club.copySerial:0,id;
 do{id=`${original}::copy:${++serial}`;}while(club.owned.includes(id)||club.cardCopies?.[id]);
 return {state:{...club,copySerial:serial,cardCopies:{...club.cardCopies,[id]:original},owned:[...club.owned,id]},awardedId:id,duplicate:true};
}
