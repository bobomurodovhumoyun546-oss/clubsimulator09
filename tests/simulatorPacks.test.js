import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {simulatorPacks,packOdds,packPools,openSimulatorPack} from '../src/features/simulatorPacks.js';
import {playerPrice,sellPrice} from '../src/features/playerEconomy.js';
import {playerOVR} from '../src/features/playerRatings.js';
import {initialClub,clubAction} from '../src/features/clubSimulator.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
test('80+ pack costs 10000 and has the exact requested per-card odds; all pack pools honour guarantees',async()=>{
 const players=await catalogue,pack=simulatorPacks.find(p=>p.id==='80');assert.equal(pack.price,10000);
 assert.deepEqual(packOdds(pack).map(p=>p.weight),[70,20,5,3.5,1,.4,.1]);
 for(const pack of simulatorPacks){const tiers=packPools(pack,players);assert.ok(Math.abs(tiers.reduce((n,t)=>n+t.weight,0)-100)<1e-9);for(const tier of tiers){assert.ok(tier.players.length,`${pack.id} ${tier.min}`);for(const p of tier.players)assert.ok(playerOVR(p)>=pack.minimum&&playerOVR(p)>=tier.min&&playerOVR(p)<=tier.max);}}
});
test('pack charges once and allows exactly one claim after revealing five options',async()=>{
 const players=await catalogue,club={...initialClub(players),coins:1000000};
 const result=openSimulatorPack(club,'80',players,()=>0);assert.equal(result.error,undefined);let next=result.state;
 assert.equal(next.lastPack.cards.length,5);assert.ok(next.lastPack.cards.every(c=>!c.revealed));
 assert.equal(next.coins,club.coins-10000);assert.deepEqual(next.owned,club.owned);
 assert.equal(clubAction(next,{type:'choose-pack',index:0},players).error,'locked');
 assert.equal(openSimulatorPack(next,'80',players).error,'locked');
 assert.equal(openSimulatorPack({...club,coins:0},'80',players).error,'notEnoughCoins');
 for(let i=0;i<5;i++){const before=next.coins;next=clubAction(next,{type:'reveal-pack',index:i},players).state;assert.equal(next.coins,before);}
 assert.ok(next.lastPack.cards.every(c=>c.revealed));assert.equal(openSimulatorPack(next,'80',players,()=>0).error,'locked');
 next=clubAction(next,{type:'choose-pack',index:0},players).state;
 assert.equal(next.lastPack.selectedIndex,0);assert.ok(next.owned.includes(next.lastPack.cards[0].playerId));
 assert.equal(next.owned.length,club.owned.length+1);
 assert.ok(next.lastPack.cards.slice(1).every(c=>!next.owned.includes(c.playerId)));
 assert.equal(clubAction(next,{type:'choose-pack',index:1},players).error,'locked');
 assert.equal(openSimulatorPack(next,'80',players,()=>0).error,undefined);
 const restored=JSON.parse(JSON.stringify(next));assert.deepEqual(restored.lastPack,next.lastPack);
 assert.ok(sellPrice(next,players.find(p=>p.id===next.lastPack.cards[0].playerId))>0);
});
test('same OVR has individual prices and training never changes the market valuation',async()=>{
 const players=await catalogue,pele=players.find(p=>p.fullName==='Pelé'&&p.cardEdition==='legendary'),ronaldo=players.find(p=>p.fullName==='Cristiano Ronaldo'&&p.cardEdition==='legendary');
 assert.equal(playerOVR(pele),100);assert.equal(playerOVR(ronaldo),100);assert.notEqual(playerPrice(pele),playerPrice(ronaldo));
 const club={...initialClub(players),owned:[pele.id],coins:1000000};const price=playerPrice(pele),trained=clubAction(club,{type:'train',id:pele.id},players).state;
 assert.equal(trained.training[pele.id],1);assert.equal(playerPrice(pele),price);
 assert.ok(playerPrice({...pele,cardOverall:95})<price);
});

test('all requested pack prices are exact, with additional packs available',async()=>{
 const prices={'50':1000,'60':4000,'70':6000,'80':10000,'85':20000,'90':50000,'95':65000,'97':110000,ballon:35000,ballon100:75000,ballon103:115000};
 for(const [id,price]of Object.entries(prices))assert.equal(simulatorPacks.find(p=>p.id===id).price,price);
 assert.ok(simulatorPacks.length>Object.keys(prices).length);
 const players=await catalogue;for(const p of players)assert.ok(playerPrice(p)<=170000,p.fullName);
});
