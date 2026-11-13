import {test} from 'node:test';
import assert from 'node:assert/strict';
import {benchSlots} from '../src/features/squadBench.js';
import {clubAction} from '../src/features/clubSimulator.js';
import {startLiveMatch,canSubstitute} from '../src/features/liveMatch.js';

const players=Array.from({length:21},(_,i)=>({id:`p${i}`,fullName:`Player ${i}`,positions:['ST'],cardOverall:70+i,cardEdition:'normal'}));
const club={owned:players.map(p=>p.id),lineup:players.slice(0,11).map(p=>p.id),formation:'4-3-3',training:{},name:'Test'};
test('seven substitutes are separate from the starting eleven and remaining collection',()=>{
 const bench=benchSlots(club,players);assert.equal(bench.length,7);assert.equal(new Set(bench).size,7);assert.ok(bench.every(id=>!club.lineup.includes(id)));assert.equal(bench[0],'p20');
 let state=clubAction({...club,bench},{type:'bench',slot:0,id:'p11'},players).state;
 assert.equal(state.bench[0],'p11');assert.ok(state.owned.includes('p20'));
 state=clubAction(state,{type:'lineup',slot:9,id:'p11'},players).state;
 assert.equal(state.lineup[9],'p11');assert.equal(state.bench[0],'p9');
 state=clubAction(state,{type:'bench',slot:0,id:null},players).state;
 assert.equal(benchSlots(JSON.parse(JSON.stringify(state)),players)[0],null);
 assert.equal(clubAction(state,{type:'bench',slot:7,id:'p12'},players).error,'locked');
 assert.equal(clubAction(state,{type:'bench',slot:0,id:'p11'},players).error,'locked');
});
test('match substitutes are restricted to the selected bench',()=>{
 const state={...club,bench:['p11',null,null,null,null,null,null],roles:Array(11).fill('ST')};
 const match=startLiveMatch(state,{name:'AI'},[],.5,()=>.5);
 assert.ok(canSubstitute(match,'p0',players[11]));assert.ok(!canSubstitute(match,'p0',players[12]));
});
