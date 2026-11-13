import test from 'node:test';
import assert from 'node:assert/strict';
import {createEngine,kick,stepEngine,performSkill} from '../src/match/engine.js';
import {attemptTackle,inPenaltyArea} from '../src/match/rules.js';
import {skillMotion,keepAreaClear} from '../src/match/skills.js';
const roles=['GK','LB','CB','CB','RB','CM','CM','CAM','LW','ST','RW'];
const players=Array.from({length:22},(_,i)=>({id:'skill'+i,fullName:'Player '+i,positions:[roles[i%11]],cardOverall:85,careerClubs:[]}));
function create(){const s=createEngine({lineup:players.slice(0,11).map(p=>p.id),training:{},bench:[]},players,roles,players.slice(11).map((p,i)=>({id:p.id,role:roles[i]})));s.restart=0;return s;}
test('held keeper cannot be tackled after temporary protection expires; both teams stay outside area',()=>{
 for(const switched of [false,true]){const s=create();s.endsSwitched=switched;s.owner=0;s.selected=12;const keeper=s.players[0];keeper.x=switched?101:4;keeper.y=34;keeper.handling=true;keeper.protectedUntil=0;s.time=5;const opponent=s.players[12];opponent.x=keeper.x+1;opponent.y=34;
 for(const slide of [false,true]){attemptTackle(s,12,slide,()=>0);assert.equal(s.owner,0);assert.equal(s.stats[1].fouls,0);}
 keepAreaClear(s);for(const p of s.players.filter(p=>p!==keeper))assert.equal(inPenaltyArea(s,0,p.x,p.y),false);
 stepEngine(s,.05,{x:-1},()=>.5);assert.equal(s.owner,0);assert.equal(s.ball.z,1.35);
 }
});
test('keeper J action punts forward in the air, clears hands and does not count a shot',()=>{
 for(const switched of [false,true]){const s=create();s.endsSwitched=switched;s.owner=0;s.selected=0;const p=s.players[0];p.x=switched?101:4;p.y=34;p.handling=true;p.holdTime=2;
 assert.equal(kick(s,'shot',.8,{},()=>.5),true);assert.equal(s.owner,null);assert.equal(p.handling,false);assert.equal(s.stats[0].shots,0);assert.equal(p.visual.kind,'punt');assert.ok(s.ball.z>1&&s.ball.vz>9);assert.ok(s.ball.vx*(switched?-1:1)>0);
 }
});
test('each skill changes real movement/ball, respects cooldown and ends without losing identity',()=>{
 for(const kind of ['rainbow','fakeShot','laneChange','elastico']){const s=create();s.players.forEach((p,i)=>{p.x=20+i*2;p.y=60;});s.owner=9;s.selected=9;const p=s.players[9];p.x=50;p.y=34;const id=p.id;
 assert.equal(performSkill(s,kind,{x:1,y:0}),true);assert.equal(performSkill(s,kind),false);assert.equal(kick(s,'shot'),false);
 for(let i=0;i<10;i++)stepEngine(s,.05,{},()=>.5);
 assert.equal(p.id,id);assert.equal(s.owner,9);assert.ok(p.x>50);assert.equal(p.visual.kind,kind);
 if(kind==='rainbow')assert.ok(s.ball.z>1);if(kind==='laneChange')assert.ok(p.y>34);
 assert.equal(skillMotion(p,p.skill.until+.01),null);
 }
});
test('skill input is ignored without possession, while paused, in auto or by a keeper',()=>{
 for(const patch of [{owner:null},{paused:true},{mode:'auto'},{selected:8},{owner:0,selected:0}]){const s=Object.assign(create(),{owner:9,selected:9},patch);assert.equal(performSkill(s,'rainbow'),false);}
});
