import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {initialClub} from '../src/features/clubSimulator.js';
import {exportClub,restoreClub} from '../src/game/saveGame.js';
test('portable saves keep the squad, coins, training, packs and bench; incompatible files are rejected',async()=>{
 const players=simulatorCards(normalizePlayers(JSON.parse(await readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8'))));
 const club=restoreClub(initialClub(players),players);club.coins=987654;club.training[club.owned[0]]=5;club.lastPack={packId:'97',selectionRequired:true,selectedIndex:null,cards:[{playerId:players[0].id,revealed:true}]};
 const restored=restoreClub(JSON.parse(exportClub(club)),players);assert.equal(restored.coins,987654);assert.deepEqual(restored.bench,club.bench);assert.deepEqual(restored.lastPack,club.lastPack);assert.deepEqual(restored.training,club.training);
 assert.throws(()=>restoreClub({version:1},players));assert.throws(()=>restoreClub({...club,coins:-1},players));assert.throws(()=>restoreClub({...club,owned:['unknown']},players));assert.throws(()=>restoreClub({...club,season:{}},players));
});
