import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,stepEngine,kick} from '../src/match/engine.js';
import {keeperPosition} from '../src/match/tactics.js';
import {celebrationActive,celebrationStyle} from '../src/match/presentation.js';

const roles=['GK','LB','CB','CB','RB','CM','CM','CAM','LW','ST','RW'];
const players=Array.from({length:22},(_,i)=>({id:`p${i}`,fullName:`Player ${i}`,positions:[roles[i%11]],cardOverall:90,careerClubs:[]}));
function match(){const s=createEngine({lineup:players.slice(0,11).map(p=>p.id),training:{}},players,roles,players.slice(11).map((p,i)=>({id:p.id,role:roles[i]})));s.restart=0;return s;}
test('goal presentation freezes the clock, retains goal location and resumes a valid kickoff exactly once',()=>{
 const s=match();s.lastTouch={id:'p9',name:'Player 9',team:0,kind:'shot'};s.last=s.lastTouch;s.lastShot=s.last;
 s.players[9].x=98;s.players[9].y=30;s.ball={x:104.9,y:34,z:0,vx:40,vy:0,vz:0};
 stepEngine(s,.05,{},()=>.99);assert.deepEqual(s.score,[1,0]);assert.ok(celebrationActive(s));assert.equal(s.celebration.name,'Player 9');assert.ok(s.celebration.positions[9].x>95);
 const time=s.time,ball=structuredClone(s.ball);
 for(let i=0;i<20;i++)stepEngine(s,.05,{x:1,shoot:true},()=>.99);
 assert.equal(s.time,time);assert.deepEqual(s.ball,ball);assert.equal(s.log.length,1);
 assert.equal(kick(s,'shot'),false);
 for(let i=0;i<60;i++)stepEngine(s,.05,{},()=>.99);
 assert.equal(celebrationActive(s),false);assert.equal(s.setPiece.kind,'kickoff');assert.equal(s.setPiece.team,1);assert.equal(s.log.length,1);
 const after=s.time;stepEngine(s,.05,{},()=>.5);assert.ok(s.time>after);
});
test('rushing keeper pursues either wing and mirrors direction after halftime',()=>{
 const s=match(),p=s.players[0];s.ball={x:18,y:48,vx:-4,vy:2};let target=keeperPosition(s,p,true);assert.ok(target.x>p.x);assert.ok(target.y>40);
 s.ball.y=20;target=keeperPosition(s,p,true);assert.ok(target.y<28);
 s.endsSwitched=true;p.x=101;s.ball.x=87;target=keeperPosition(s,p,true);assert.ok(target.x<p.x);assert.ok(target.y<28);
});
test('celebrations remain stable for identity and offer multiple poses',()=>{
 assert.equal(celebrationStyle('p1'),celebrationStyle('p1'));
 assert.equal(new Set(players.map(p=>celebrationStyle(p.id))).size,4);
});
