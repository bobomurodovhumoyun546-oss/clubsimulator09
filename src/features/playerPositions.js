import mobile from '../data/fcMobilePositions.json' with {type:'json'};
export function withAlternatePositions(player){
 const id=player.basePlayerId||player.id,entry=mobile.players[id];
 if(!entry||entry.name!==player.fullName||entry.primary!==player.positions?.[0])return player;
 const positions=[...new Set([...player.positions,...entry.alternate])];
 return {...player,positions,attributePositions:player.attributePositions||player.positions,primaryPosition:positions[0],alternatePositions:positions.slice(1),positionSource:entry.source};
}
