import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizePlayers} from '../src/games/core/players.js';
import {withAlternatePositions} from '../src/features/playerPositions.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {inventoryPlayers} from '../src/features/cardInventory.js';
import {fitsSlot} from '../src/features/clubSimulator.js';
import {marketPlayers} from '../src/features/simulatorSearch.js';
import {playerAttributes,playerOVR} from '../src/features/playerRatings.js';
import mobile from '../src/data/fcMobilePositions.json' with {type:'json'};
const players=normalizePlayers(JSON.parse(readFileSync(new URL('../public/game-data/players.json',import.meta.url))));
test('Ronaldinho has verified CAM eligibility on every edition and owned copy',()=>{
 const original=players.find(p=>p.fullName==='Ronaldinho'),cards=simulatorCards([original]);assert.ok(cards.length>=2);
 for(const p of cards){assert.equal(p.positions[0],'LW');assert.ok(p.alternatePositions.includes('CAM'));assert.ok(fitsSlot(p,'CAM'));assert.match(p.positionSource,/^https:\/\/renderz.app\/player\/\d+$/);}
 const copies=inventoryPlayers(cards,{cardCopies:{testCopy:cards[0].id}});assert.ok(copies.find(p=>p.id==='testCopy').positions.includes('CAM'));
 assert.deepEqual(original.positions,['LW']);
});
test('verified alternate positions are unique valid source facts and preserve identity, OVR and stats',()=>{
 const valid=new Set(['GK','CB','LB','RB','LWB','RWB','CM','CDM','CAM','LM','RM','LW','RW','ST','CF','LF','RF']);assert.ok(mobile.matchedCount>500);
 for(const [id,fact] of Object.entries(mobile.players)){const p=players.find(p=>p.id===id);assert.ok(p);const enriched=withAlternatePositions(p);assert.equal(enriched.id,p.id);assert.equal(enriched.positions[0],p.positions[0]);assert.equal(new Set(enriched.positions).size,enriched.positions.length);for(const pos of fact.alternate)assert.ok(valid.has(pos)&&pos!==fact.primary&&pos!=='GK');assert.equal(playerOVR(enriched),playerOVR(p));assert.deepEqual(playerAttributes(enriched),playerAttributes(p));}
});
test('CAM market filter includes Ronaldinho and unknown identities never get invented alternates',()=>{
 const p=players.find(p=>p.fullName==='Ronaldinho'),cards=simulatorCards([p]);assert.ok(marketPlayers(cards,{edition:'normal',position:'CAM'}).some(p=>p.fullName==='Ronaldinho'));
 const unknown={id:'not-in-source',fullName:'Unknown',positions:['LW']};assert.equal(withAlternatePositions(unknown),unknown);
});
