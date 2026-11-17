import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickVector} from '../src/match/touchInput.js';
import {movementInput} from '../src/match/keyboard.js';
import {advanceLiveMatch,liveScore} from '../src/features/liveMatch.js';
const setup=home=>({minute:12,pending:{minute:12,home,cells:[1,4,9],attackerId:'st',attackerName:'Striker',keeperId:'gk',keeperName:'Keeper'},log:[],finished:false,schedule:[],cursor:0,injuryMinute:null,opponent:{id:'rival',name:'Rival'},clubName:'Home'});
test('joystick is analogue, bounded and finite; releasing it stops input',()=>{
 assert.deepEqual(joystickVector(0,0),{x:0,y:0});assert.deepEqual(joystickVector(2,0),{x:0,y:0});
 const half=joystickVector(24,0);assert.equal(half.x,.5);assert.equal(half.y,0);
 const diagonal=joystickVector(100,100);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-10);
 for(const [x,y]of [[NaN,0],[0,Infinity]])assert.deepEqual(joystickVector(x,y),{x:0,y:0});
 const controls={joystick:half,sprint:true},input=movementInput(new Set(),controls);assert.equal(input.x,.5);assert.equal(input.y,0);assert.equal(input.sprint,true);
 controls.joystick=null;assert.equal(movementInput(new Set(),controls).x,0);assert.equal(movementInput(new Set(['KeyW']),controls).y,-1);
});
test('a chosen manager shot reveals zones for three ticks without advancing the clock or accepting another shot',()=>{
 let state=advanceLiveMatch(setup(true),{type:'choose',cell:1},[]);assert.equal(state.review.remaining,3);assert.equal(state.review.goal,true);assert.deepEqual(liveScore(state),{home:1,away:0});
 assert.equal(advanceLiveMatch(state,{type:'choose',cell:0},[]),state);
 for(const remaining of [2,1,null]){state=advanceLiveMatch(state,{type:'tick'},[]);assert.equal(state.minute,12);assert.equal(state.review?.remaining??null,remaining);assert.equal(state.log.length,1);}
 state=advanceLiveMatch(state,{type:'tick'},[]);assert.equal(state.minute,13);
});
test('defending reverses goal/save interpretation and the map stays hidden before choosing',()=>{
 const before=setup(false);assert.equal(before.review,undefined);
 const save=advanceLiveMatch(before,{type:'choose',cell:4},[]),conceded=advanceLiveMatch(before,{type:'choose',cell:3},[]);
 assert.equal(save.review.goal,false);assert.equal(save.review.cells.includes(save.review.choice),true);assert.equal(conceded.review.goal,true);assert.equal(conceded.review.cells.includes(conceded.review.choice),false);
 assert.equal(advanceLiveMatch(before,{type:'choose',cell:1.5},[]),before);
});
