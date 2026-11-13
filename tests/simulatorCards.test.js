import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {simulatorCards,formationRows} from '../src/features/simulatorCards.js';
import {formations,initialClub,bestLineup,clubAction,simRating} from '../src/features/clubSimulator.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
test('base and legendary editions have separate identities, prices and training',async()=>{
 const players=await catalogue;
 for(const [name,base,prime] of [['Pelé',95,100],['Robert Lewandowski',88,98],['Alessandro Del Piero',93,98]]){
  const cards=players.filter(p=>p.fullName===name&&['normal','legendary'].includes(p.cardEdition));assert.equal(cards.length,2);
  assert.equal(simRating(cards[0]),base);assert.equal(simRating(cards[1]),prime);
  assert.notEqual(cards[0].id,cards[1].id);assert.equal(cards[0].basePlayerId,cards[1].basePlayerId);
  assert.equal(simRating(cards[0],5),base+5);assert.equal(simRating(cards[0]),base);
 }
 for(const p of players.filter(p=>p.cardEdition==='legendary'))assert.ok(simRating(p)>=95&&simRating(p)<=100);
});
test('all formations place eleven unique footballers and every slot appears once on pitch',async()=>{
 const players=await catalogue;
 for(const [formation,roles] of Object.entries(formations)){
  assert.equal(roles.length,11);assert.deepEqual(formationRows(roles).flat().map(x=>x.i).sort((a,b)=>a-b),Array.from({length:11},(_,i)=>i));
  const lineup=bestLineup(players,formation);assert.ok(lineup.every(Boolean));
  assert.equal(new Set(lineup.map(id=>players.find(p=>p.id===id).basePlayerId)).size,11);
 }
});
test('match decisions update the actual result, events and league together',async()=>{
 const players=await catalogue,base=initialClub(players),lineup=bestLineup(players,'4-3-3');
 const club={...base,lineup,owned:lineup};
 const regular=clubAction(club,{type:'match'},players,()=>.5);
 const interactive=clubAction(club,{type:'match',moments:{goal:true,saved:false,quiz:false}},players,()=>.5);
 assert.equal(interactive.report.home,regular.report.home+1);assert.equal(interactive.report.away,regular.report.away+1);
 assert.equal(interactive.report.events.length,interactive.report.home+interactive.report.away);
 assert.equal(interactive.state.season.table.you.goalsFor,interactive.report.home);
});
