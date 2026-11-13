import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {initialClub,clubAction} from '../src/features/clubSimulator.js';
import {inventoryPlayers,ownsCard} from '../src/features/cardInventory.js';
import {packPools,simulatorPacks} from '../src/features/simulatorPacks.js';
import {playerPrice,sellPrice} from '../src/features/playerEconomy.js';
import {marketPlayers} from '../src/features/simulatorSearch.js';
import {exportClub,restoreClub} from '../src/game/saveGame.js';
import {coaches} from '../src/data/managers.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
test('duplicate picks survive reload, train independently and are sold only on request',async()=>{
 const players=await catalogue,original=players.find(p=>p.cardEdition==='ballondor'&&p.cardOverall===105);
 let club={...initialClub(players),coins:1000000,owned:[...initialClub(players).owned,original.id]};
 function pick(){club={...club,lastPack:{packId:'ballon103',price:115000,selectionRequired:true,selectedIndex:null,cards:Array.from({length:5},()=>({playerId:original.id,revealed:true}))}};const before=club.coins;const result=clubAction(club,{type:'choose-pack',index:0},players);assert.equal(result.error,undefined);club=result.state;assert.equal(club.coins,before);return club.lastPack.cards[0].awardedId;}
 const first=pick(),second=pick();assert.notEqual(first,second);assert.notEqual(first,original.id);assert.equal(club.cardCopies[first],original.id);assert.ok(club.owned.includes(first));assert.ok(club.owned.includes(second));
 club=clubAction(club,{type:'train',id:first},players).state;assert.equal(club.training[first],1);assert.equal(club.training[original.id]||0,0);assert.equal(club.training[second]||0,0);
 club=clubAction(club,{type:'bench',id:first,slot:0},players).state;assert.equal(club.bench[0],first);
 club=restoreClub(JSON.parse(exportClub(club)),players);assert.equal(club.bench[0],first);assert.equal(club.training[first],1);assert.equal(club.cardCopies[second],original.id);
 const expanded=inventoryPlayers(players,club);assert.equal(expanded.find(p=>p.id===first).basePlayerId,original.basePlayerId);
 assert.ok(!marketPlayers(expanded,{edition:'ballondor'}).some(p=>p.copyOf));
 for(const pack of simulatorPacks)assert.ok(packPools(pack,expanded).every(t=>t.players.every(p=>!p.copyOf)));
 const coins=club.coins,value=sellPrice(club,original);club=clubAction(club,{type:'sell',id:first},players).state;
 assert.equal(club.coins,coins+value);assert.ok(!club.owned.includes(first));assert.ok(club.owned.includes(original.id));assert.ok(club.owned.includes(second));assert.equal(club.cardCopies[first],undefined);assert.equal(club.training[first],undefined);assert.equal(club.bench[0],null);
 club=clubAction(club,{type:'sell',id:original.id},players).state;assert.ok(ownsCard(club,original.id));assert.equal(clubAction(club,{type:'buy',id:original.id},players).error,'owned');
});
test('requested OVR price bands, shared resale and future top-rating caps are respected',async()=>{
 const players=await catalogue,bands={105:[150000,170000],104:[120000,135000],103:[90000,110000],102:[60000,75000],101:[35000,50000]};
 for(const p of players.filter(p=>p.cardOverall>=95)){const [min,max]=bands[p.cardOverall]||[15000,20000];assert.ok(playerPrice(p)>=min&&playerPrice(p)<=max,`${p.fullName} ${p.cardOverall}`);}
 for(const ovr of [95,96,97,98,99,100,101,102,103,104,105]){const group=players.filter(p=>p.cardOverall===ovr);assert.ok(group.length);assert.equal(new Set(group.map(p=>sellPrice({sellValues:{[p.id]:1}},p))).size,1);}
 const reference=players.find(p=>p.cardOverall===105),future={...reference,cardOverall:107};assert.ok(playerPrice(future)>=150000&&playerPrice(future)<=170000);
 const trained=players.find(p=>p.cardOverall===98),untrained=players.find(p=>p.cardOverall===103);assert.equal(sellPrice({training:{[trained.id]:5}},trained),sellPrice({},untrained));
 const peers=players.filter(p=>p.cardOverall===103);assert.ok(new Set(peers.map(playerPrice)).size>5);
 for(const coach of coaches)assert.ok(coach.price>=10000&&coach.price<=100000);
 assert.equal(coaches.find(c=>c.id==='guardiola').price,100000);
});
