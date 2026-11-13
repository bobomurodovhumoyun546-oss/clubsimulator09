// Moved Ballon d'Or editions become Rivals without losing owned cards or training.
export function migrateRivalsClub(club,players){
 if(!club||!Array.isArray(club.owned))return club;
 const replacements=new Map(players.filter(p=>p.cardEdition==='rivals'&&p.replacesBallon).map(p=>[`${p.basePlayerId}::ballondor`,p.id]));
 if(!replacements.size)return club;
 const copies=Object.entries(club.cardCopies||{}),oldCopies=copies.filter(([,original])=>replacements.has(original));
 const needs=club.owned.some(id=>replacements.has(id))||oldCopies.length||club.lastPack?.cards?.some(c=>replacements.has(c.playerId));
 if(!needs)return club;
 const aliases=new Map(replacements),used=new Set([...club.owned,...copies.map(([id])=>id)]);let serial=Number.isSafeInteger(club.copySerial)?club.copySerial:0;
 const allocate=base=>{let id;do{id=`${base}::copy:${++serial}`;}while(used.has(id));used.add(id);return id;};
 const converted=[];
 for(const [old,base] of replacements)if(club.owned.includes(old)){
  const id=used.has(base)?allocate(base):base;used.add(id);aliases.set(old,id);if(id!==base)converted.push([id,base]);
 }
 for(const [old,original] of oldCopies){const base=replacements.get(original),id=allocate(base);aliases.set(old,id);converted.push([id,base]);}
 const remap=value=>typeof value==='string'?(aliases.get(value)||value):Array.isArray(value)?value.map(remap):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[aliases.get(key)||key,remap(v)])):value;
 const next=remap(club);next.copySerial=serial;next.cardCopies={...next.cardCopies,...Object.fromEntries(converted)};
 if(next.lastPack?.cards)next.lastPack.cards=next.lastPack.cards.map((c,i)=>({...c,playerId:replacements.get(club.lastPack.cards[i].playerId)||c.playerId}));
 return next;
}
