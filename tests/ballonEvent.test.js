import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ballonEvent} from '../src/data/ballonEvent.js';
import {normalizeAnswer} from '../src/lib/gameEngine.js';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {playerOVR} from '../src/features/playerRatings.js';
import {playerPrice} from '../src/features/playerEconomy.js';
import {initialClub,clubAction} from '../src/features/clubSimulator.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
test('all 79 event footballers have exactly the requested OVRs and a maximum +5',async()=>{
 const players=await catalogue;
 assert.equal(ballonEvent.length,79);
 for(const event of ballonEvent){const p=players.find(p=>p.cardEdition==='ballondor'&&normalizeAnswer(p.fullName)===normalizeAnswer(event.name));assert.ok(p,event.name);assert.equal(playerOVR(p),event.overall,event.name);assert.equal(playerOVR(p,5),event.overall+5);assert.ok(playerOVR(p,50)<=110);assert.equal(p.basePlayerId,p.id.replace('::ballondor',''));}
 const papin=players.find(p=>p.fullName==='Jean-Pierre Papin'&&p.cardEdition==='ballondor'),vanDijk=players.find(p=>p.fullName==='Virgil van Dijk'&&p.cardEdition==='ballondor');assert.equal(playerOVR(papin),103);assert.equal(playerOVR(vanDijk),103);assert.ok(playerPrice(papin)>playerPrice(vanDijk));
});
test('event pack offers only event cards, and selecting a duplicate adds a separate copy without a refund',async()=>{
 const players=await catalogue,club={...initialClub(players),coins:1000000};
 let opened=clubAction(club,{type:'pack',id:'ballon'},players,()=>0).state;
 assert.ok(opened.lastPack.cards.every(c=>players.find(p=>p.id===c.playerId).cardEdition==='ballondor'));
 for(let i=0;i<5;i++)opened=clubAction(opened,{type:'reveal-pack',index:i},players).state;
 const existing=opened.lastPack.cards[2].playerId;opened={...opened,owned:[...opened.owned,existing]};const coins=opened.coins;
 const claimed=clubAction(opened,{type:'choose-pack',index:2},players).state;assert.equal(claimed.owned.length,opened.owned.length+1);assert.equal(claimed.coins,coins);assert.equal(claimed.lastPack.cards[2].compensation,0);assert.equal(claimed.cardCopies[claimed.lastPack.cards[2].awardedId],existing);assert.equal(clubAction(claimed,{type:'choose-pack',index:0},players).error,'locked');
 const legacy={...club,lastPack:{cards:[{playerId:existing,revealed:true}]}};assert.equal(clubAction(legacy,{type:'pack',id:'80'},players,()=>0).error,undefined);
});
