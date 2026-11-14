import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {rivalsEvent} from '../src/data/rivalsEvent.js';
import {ballonEventByName} from '../src/data/ballonEvent.js';
import {normalizeAnswer} from '../src/lib/gameEngine.js';
import {playerOVR,playerAttributes} from '../src/features/playerRatings.js';
import {marketPlayers} from '../src/features/simulatorSearch.js';
import {initialClub,clubAction} from '../src/features/clubSimulator.js';
import {packPools,simulatorPacks,packOdds} from '../src/features/simulatorPacks.js';
import {inventoryPlayers} from '../src/features/cardInventory.js';
import {restoreClub,exportClub} from '../src/game/saveGame.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
test('Rivals has 56 unique cards, preserves Kompany blue and continues red/blue after him',async()=>{
 const players=await catalogue,cards=marketPlayers(players,{edition:'rivals'});assert.equal(cards.length,56);
 for(const [i,event]of rivalsEvent.entries()){
  const p=cards.find(card=>normalizeAnswer(card.fullName)===normalizeAnswer(event.name));assert.ok(p,event.name);assert.equal(playerOVR(p),event.overall);assert.equal(p.rivalsSide,event.side);assert.equal(p.basePlayerId,p.id.replace('::rivals',''));assert.ok(p.image);
  if(event.image){assert.ok(p.imageSource.startsWith('https://'));assert.ok((await readFile(new URL('../public'+p.image,import.meta.url))).length>1000);}
  if(i>=9)assert.equal(p.rivalsSide,(i-9)%2?'blue':'red');
 }
 assert.equal(cards.find(p=>p.fullName==='Vincent Kompany').rivalsSide,'blue');
 for(const [name,position,side]of [['Eden Hazard','LW','blue'],['Gareth Bale','RW','red']]){
  const player=cards.find(p=>p.fullName===name);assert.equal(playerOVR(player),104);assert.equal(player.positions[0],position);assert.equal(player.primaryPosition,position);assert.equal(player.rivalsSide,side);
 }
 assert.ok(cards.find(p=>p.fullName==='Nemanja Vidi\u0107').rivalsLegend);assert.equal(cards.find(p=>p.fullName==='Jude Bellingham').rivalsLegend,false);
 for(const name of ['Steven Gerrard','Frank Lampard','Khvicha Kvaratskhelia','Jude Bellingham','Pedri'])assert.ok(!players.some(p=>p.cardEdition==='ballondor'&&p.fullName===name));
});
test('95 through 100 each have four additional rivals, split two red and two blue',async()=>{
 const players=await catalogue,low=players.filter(p=>p.cardEdition==='rivals'&&p.cardOverall<=100);assert.equal(low.length,24);
 for(let ovr=95;ovr<=100;ovr++){const tier=low.filter(p=>p.cardOverall===ovr);assert.equal(tier.length,4);assert.equal(tier.filter(p=>p.rivalsSide==='red').length,2);assert.equal(tier.filter(p=>p.rivalsSide==='blue').length,2);for(const p of tier){const rival=tier.find(q=>q.fullName===p.rivalsOpponent);assert.ok(rival);assert.notEqual(rival.rivalsSide,p.rivalsSide);assert.equal(rival.rivalsOpponent,p.fullName);}}
 for(const ovr of [101,102,103,104,105])assert.equal(players.filter(p=>p.cardEdition==='rivals'&&p.cardOverall===ovr).length,ovr===104?8:6);
});

test('a 105 Rivals card can be bought and trained to 110, stops at +5 and survives export/import',async()=>{
 const players=await catalogue,p=players.find(p=>p.cardEdition==='rivals'&&p.cardOverall===105);let club={...initialClub(players),coins:1000000};
 club=clubAction(club,{type:'buy',id:p.id},players).state;assert.ok(club.owned.includes(p.id));
 for(let i=0;i<5;i++)club=clubAction(club,{type:'train',id:p.id},players).state;
 assert.equal(playerOVR(p,club.training[p.id]),110);assert.equal(clubAction(club,{type:'train',id:p.id},players).error,'locked');
 const restored=restoreClub(JSON.parse(exportClub(club)),players);assert.equal(restored.training[p.id],5);assert.ok(restored.owned.includes(p.id));
 for(const p of players.filter(p=>p.cardEdition==='rivals')){assert.equal(playerOVR(p,999),p.cardOverall+5);assert.ok(playerOVR(p,999)<=110);}
});
test('Rivals packs draw only Rivals, retain published odds and leave other pack editions isolated',async()=>{
 const players=await catalogue,pack=simulatorPacks.find(p=>p.id==='rivals');assert.deepEqual(packOdds(pack).map(t=>[t.min,t.weight]),[[104,70],[105,30]]);
 for(const offer of simulatorPacks)for(const tier of packPools(offer,players))for(const p of tier.players)assert.equal(p.cardEdition,offer.event==='rivals'?'rivals':offer.event?'ballondor':tier.legendary?'legendary':'normal');
 const club={...initialClub(players),coins:1000000};for(const roll of [.01,.99]){const result=clubAction(club,{type:'pack',id:'rivals'},players,()=>roll);assert.equal(result.error,undefined);assert.equal(result.state.coins,club.coins-pack.price);assert.ok(result.state.lastPack.cards.every(c=>players.find(p=>p.id===c.playerId).cardEdition==='rivals'));}
});
test('retired Gerrard/Lampard Ballon editions migrate ownership, starting XI, bench, copies and training without losing coins',async()=>{
 const players=await catalogue,g=players.find(p=>p.cardEdition==='rivals'&&p.fullName==='Steven Gerrard'),l=players.find(p=>p.cardEdition==='rivals'&&p.fullName==='Frank Lampard');
 const oldG=g.id.replace('::rivals','::ballondor'),oldL=l.id.replace('::rivals','::ballondor'),oldCopy=oldG+'::copy:4';
 const club=initialClub(players);club.coins=345678;club.owned.push(oldG,oldL,oldCopy);club.lineup[5]=oldG;club.bench=[oldL];club.cardCopies={[oldCopy]:oldG};club.copySerial=4;club.training={[oldG]:5,[oldL]:2,[oldCopy]:3};
 club.lastPack={packId:'ballon',selectionRequired:true,selectedIndex:0,cards:[{playerId:oldG,awardedId:oldCopy,revealed:true}]};
 const restored=restoreClub(club,players),cards=inventoryPlayers(players,restored),copy=cards.find(p=>p.copyOf===g.id);
 assert.equal(restored.coins,club.coins);assert.equal(restored.owned.length,club.owned.length);assert.equal(restored.lineup[5],g.id);assert.equal(restored.bench[0],l.id);assert.equal(restored.training[g.id],5);assert.equal(restored.training[l.id],2);assert.ok(copy);assert.equal(restored.training[copy.id],3);assert.equal(restored.lastPack.cards[0].awardedId,copy.id);assert.equal(restored.lastPack.cards[0].playerId,g.id);assert.equal(copy.cardEdition,'rivals');
 assert.deepEqual(restoreClub(JSON.parse(exportClub(restored)),players),restored);assert.equal(club.lineup[5],oldG);
});
test('migration preserves both cards if an imported save already owns the replacement Rivals edition',async()=>{
 const players=await catalogue,g=players.find(p=>p.cardEdition==='rivals'&&p.fullName==='Steven Gerrard'),old=g.id.replace('::rivals','::ballondor');let club=initialClub(players);club.owned.push(g.id,old);club.training={[g.id]:1,[old]:5};
 club=restoreClub(club,players);const cards=inventoryPlayers(players,club),copy=cards.find(p=>p.copyOf===g.id);assert.ok(copy);assert.ok(club.owned.includes(copy.id));assert.equal(club.training[copy.id],5);assert.equal(club.training[g.id],1);
});

test('the expanded 95+ pack reaches every Rivals tier and keeps copies out of the draw pool',async()=>{
 const players=await catalogue,pack=simulatorPacks.find(p=>p.id==='rivals95'),tiers=packPools(pack,players);assert.equal(pack.minimum,95);assert.equal(pack.price,35000);assert.deepEqual(packOdds(pack).map(t=>t.weight),[60,25,12,3]);
 const pool=tiers.flatMap(t=>t.players);assert.equal(new Set(pool.map(p=>p.id)).size,56);assert.ok(pool.every(p=>p.cardEdition==='rivals'&&!p.copyOf));
});
test('Kvaratskhelia, Bellingham and Pedri Ballon cards migrate to 103 Rivals with training and copies',async()=>{
 const players=await catalogue,names=['Khvicha Kvaratskhelia','Jude Bellingham','Pedri'];
 for(const name of names){const p=players.find(p=>p.cardEdition==='rivals'&&p.fullName===name),old=p.id.replace('::rivals','::ballondor'),copy=old+'::copy:12';let club=initialClub(players);club.owned.push(old,copy);club.bench=[old];club.training={[old]:5,[copy]:2};club.cardCopies={[copy]:old};club.copySerial=12;const coins=club.coins,restored=restoreClub(JSON.parse(exportClub(club)),players),expanded=inventoryPlayers(players,restored),newCopy=expanded.find(q=>q.copyOf===p.id);
 assert.equal(restored.coins,coins);assert.equal(restored.bench[0],p.id);assert.equal(restored.training[p.id],5);assert.equal(playerOVR(p,restored.training[p.id]),108);assert.ok(newCopy);assert.equal(restored.training[newCopy.id],2);assert.equal(restored.owned.length,club.owned.length);assert.deepEqual(restoreClub(JSON.parse(exportClub(restored)),players),restored);}
});

test('Rivals range packs match Ballon prices and odds and never draw below their minimum',async()=>{
 const players=await catalogue,club={...initialClub(players),coins:1000000};
 for(const [rivalId,ballonId]of [['rivals95','ballon'],['rivals100','ballon100'],['rivals102','ballon102'],['rivals103','ballon103']]){
  const rival=simulatorPacks.find(p=>p.id===rivalId),ballon=simulatorPacks.find(p=>p.id===ballonId);assert.ok(rival);assert.equal(rival.minimum,ballon.minimum);assert.equal(rival.price,ballon.price);assert.deepEqual(packOdds(rival),packOdds(ballon));
  for(const tier of packPools(rival,players)){assert.ok(tier.players.length);assert.ok(tier.players.every(p=>p.cardEdition==='rivals'&&p.cardOverall>=rival.minimum&&p.cardOverall<=105));}
  for(const roll of [0,.99999]){const result=clubAction(club,{type:'pack',id:rivalId},players,()=>roll);assert.equal(result.error,undefined);assert.equal(result.state.coins,club.coins-rival.price);assert.equal(result.state.lastPack.cards.length,5);for(const card of result.state.lastPack.cards){const p=players.find(p=>p.id===card.playerId);assert.equal(p.cardEdition,'rivals');assert.ok(p.cardOverall>=rival.minimum&&p.cardOverall<=105);}}
 }
});

test('the 24 lower Rivals are regular players, exclude Ballon names and have lower attributes',async()=>{
 const players=await catalogue,cards=players.filter(p=>p.cardEdition==='rivals'&&p.cardOverall<=100);assert.equal(cards.length,24);
 for(const p of cards){assert.equal(p.isLegend,false,p.fullName);assert.equal(p.isRetired,false,p.fullName);assert.ok(!p.deathDate,p.fullName);assert.equal(p.rivalsLegend,false,p.fullName);assert.ok(!ballonEventByName.has(normalizeAnswer(p.fullName)),p.fullName);assert.ok(p.rivalsRegular);
  const stats=Object.values(playerAttributes(p).values);assert.ok(stats.every(n=>n<=p.cardOverall-7),p.fullName);assert.ok(Object.values(playerAttributes(p,5).values).every(n=>n<=100));
 }
 const top=players.filter(p=>p.cardEdition==='rivals'&&p.cardOverall>=101),average=ps=>ps.reduce((sum,p)=>sum+Object.values(playerAttributes(p).values).reduce((a,b)=>a+b,0)/6,0)/ps.length;
 assert.ok(average(cards)<average(top)-5);
});
test('archived former Rivals preserve purchased inventory and training but are absent from market and all packs',async()=>{
 const players=await catalogue,archives=players.filter(p=>p.cardEdition==='rivalsLegacy');assert.equal(archives.length,24);assert.ok(archives.every(p=>p.archived));
 const old=archives.find(p=>p.fullName==='Wayne Rooney'),copy=old.id+'::copy:90';let club=initialClub(players);club.owned.push(old.id,copy);club.cardCopies={[copy]:old.id};club.training={[old.id]:4,[copy]:2};club.copySerial=90;const coins=club.coins;
 club=restoreClub(JSON.parse(exportClub(club)),players);assert.ok(club.owned.includes(old.id)&&club.owned.includes(copy));assert.equal(club.training[old.id],4);assert.equal(club.training[copy],2);assert.equal(club.coins,coins);assert.equal(inventoryPlayers(players,club).find(p=>p.id===copy).cardEdition,'rivalsLegacy');
 assert.ok(!marketPlayers(players,{edition:'rivals'}).some(p=>p.archived));for(const pack of simulatorPacks)assert.ok(packPools(pack,inventoryPlayers(players,club)).every(t=>t.players.every(p=>!p.archived&&!p.copyOf)));
});
