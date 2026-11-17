import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizePlayers} from '../src/games/core/players.js';
import {normalizeAnswer} from '../src/lib/gameEngine.js';
import {legendaryRatings} from '../src/data/legendaryRatings.js';
import {simulatorCards} from '../src/features/simulatorCards.js';
import {playerOVR} from '../src/features/playerRatings.js';
import {initialClub,bestLineup,formations,clubAction} from '../src/features/clubSimulator.js';
import {ensureOpponentSquads} from '../src/features/opponentSquads.js';
import {startLiveMatch,advanceLiveMatch,liveScore,canSubstitute} from '../src/features/liveMatch.js';
const catalogue=readFile(new URL('../public/game-data/players.json',import.meta.url),'utf8').then(s=>simulatorCards(normalizePlayers(JSON.parse(s))));
function random(seed=123){return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);}
test('all requested legendary ratings exist, including Uzbek players below the ordinary 85 threshold',async()=>{
 const players=await catalogue;
 for(const [name,ovr] of legendaryRatings){const p=players.find(p=>p.cardEdition==='legendary'&&normalizeAnswer(p.fullName)===normalizeAnswer(name));assert.ok(p,name);assert.equal(playerOVR(p),ovr,name);assert.equal(playerOVR(p,5),ovr+5,name);}
});
test('extra hard uses distinct footballers with trained OVR 95-100 for every AI team',async()=>{
 const players=await catalogue,club=initialClub(players),season=ensureOpponentSquads(club.season,players,'extrahard');
 for(const opponent of season.opponents){const squad=season.squads[opponent.id];assert.equal(squad.lineup.length,11);assert.ok(squad.overall>=95&&squad.overall<=100);const identities=new Set();for(const item of squad.lineup){const p=players.find(p=>p.id===item.id);assert.ok(playerOVR(p,item.training)>=95&&playerOVR(p,item.training)<=100);identities.add(p.basePlayerId);}assert.equal(identities.size,11);}
});
test('90 clock ticks produce exactly the visible goals and persist real scorers, assists and substitutions',async()=>{
 const players=await catalogue,rng=random(),base=initialClub(players),club={...base,owned:players.map(p=>p.id),lineup:bestLineup(players,'4-3-3')};
 const season=ensureOpponentSquads(club.season,players,'easy'),opponent=season.opponents.find(p=>p.id===season.fixtures[0].opponentId);
 let match=startLiveMatch({...club,roles:formations[club.formation]},opponent,season.squads[opponent.id].lineup,.7,rng);
 const out=match.lineup[8],identity=players.find(p=>p.id===out).basePlayerId;
 const incoming=players.find(p=>canSubstitute(match,out,p)&&p.basePlayerId!==identity&&!match.lineup.some(id=>players.find(p=>p.id===id).basePlayerId===p.basePlayerId));
 match=advanceLiveMatch(match,{type:'substitute',outId:out,inId:incoming.id},players,rng);assert.ok(match.lineup.includes(incoming.id));assert.equal(match.substitutions.length,1);
 for(let minute=1;minute<=90;minute++){
  match=advanceLiveMatch(match,{type:'tick'},players,rng);assert.equal(match.minute,minute);
  if(match.pending){assert.equal(match.pending.cells.length,14);assert.ok(match.pending.attackerName&&match.pending.keeperName);match=advanceLiveMatch(match,{type:'choose',cell:match.pending.cells[0]},players,rng);for(let review=0;review<3;review++)match=advanceLiveMatch(match,{type:'tick'},players,rng);}
 }
 assert.equal(match.finished,true);assert.equal(match.log.length,match.schedule.length);
 const score=liveScore(match),result=clubAction(club,{type:'match',liveMatch:match},players,rng);assert.equal(result.error,undefined);
 assert.equal(result.report.home,score.home);assert.equal(result.report.away,score.away);assert.equal(result.report.events.length,score.home+score.away);assert.deepEqual(result.state.lineup,match.lineup);
 for(const event of result.report.events)assert.ok(match.log.some(e=>e.goal&&e.playerId===event.playerId&&e.minute===event.minute));
 assert.equal(result.state.season.table.you.goalsFor,score.home);
});
test('injury chance is 1% per match and unanswered chances expire without stopping the clock',async()=>{
 const players=await catalogue,club=initialClub(players),setup={...club,roles:formations[club.formation]},rng=random(83);let injuries=0;
 for(let i=0;i<10000;i++)if(startLiveMatch(setup,{},[],.7,rng).injuryMinute!==null)injuries++;
 assert.ok(injuries>65&&injuries<135,`injuries ${injuries}`);
 let match=startLiveMatch(setup,{id:'rival',name:'Rival'},club.lineup.map(id=>({id})),.7,()=>0);assert.notEqual(match.injuryMinute,null);
 for(let i=0;i<90;i++)match=advanceLiveMatch(match,{type:'tick'},players,()=>0);
 assert.equal(match.finished,true);assert.equal(match.minute,90);assert.equal(match.injured.length,1);
 assert.equal(match.pending,null);assert.equal(liveScore(match).home,0);assert.equal(liveScore(match).away,match.schedule.filter(e=>!e.home).length);
});
