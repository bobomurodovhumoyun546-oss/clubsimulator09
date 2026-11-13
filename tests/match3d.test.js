import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {worldPosition,yawForVelocity,smoothAngle,actionState,cameraOffset,disposeScene,screenMovement} from '../src/match/three/world.js';
import {createFootballer,updateFootballer} from '../src/match/three/footballer.js';
test('3D coordinates preserve football world and separate ball height',()=>{assert.deepEqual(worldPosition(52.5,34,2),{x:0,y:2,z:0});assert.deepEqual(worldPosition(0,0),{x:-52.5,y:0,z:-34});});
test('3D direction turns by the shortest path and retains stationary facing',()=>{assert.equal(yawForVelocity(1,0),Math.PI/2);assert.equal(yawForVelocity(0,0,1.2),1.2);assert.ok(Math.abs(smoothAngle(Math.PI-.1,-Math.PI+.1,.5)-Math.PI)<.00001);});
test('camera presets are genuine 3D viewpoints and adapt to narrow screens',()=>{assert.notDeepEqual(cameraOffset('broadcast').toArray(),cameraOffset('end').toArray());assert.ok(cameraOffset('tactical').y>cameraOffset('broadcast').y);assert.ok(cameraOffset('broadcast',.7).y>cameraOffset('broadcast',1.7).y);});
test('real match events override locomotion until their expiry',()=>{const p={vx:9,vy:0,visual:{kind:'shoot',until:4}};assert.equal(actionState(p,3),'shoot');assert.equal(actionState(p,5),'sprint');});
test('athlete is a real skinned mesh; bones animate and player identity is untouched',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({width:64,height:64,getContext:()=>({fillText(){}})})};
 try{const player={id:'real-card-id',team:0,role:'ST',x:70,y:20,vx:8,vy:0},before=structuredClone(player),figure=createFootballer(player,9),skin=figure.root.userData.skinnedMesh;
 assert.ok(skin.isSkinnedMesh);assert.ok(skin.skeleton.bones.length>=10);assert.ok(skin.geometry.attributes.skinWeight);assert.ok(skin.geometry.attributes.position.count>1000);
 updateFootballer(figure,player,.4,.1);figure.root.updateMatrixWorld(true);skin.skeleton.update();assert.ok(Math.abs(figure.legs[0].joint.rotation.x)>.001);assert.equal(figure.root.position.x,17.5);assert.equal(figure.root.position.z,-14);assert.deepEqual(player,before);
 const v=new THREE.Vector3().fromBufferAttribute(skin.geometry.attributes.position,0);skin.applyBoneTransform(0,v);assert.ok(v.toArray().every(Number.isFinite));disposeScene(figure.root);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('movement follows screen directions when the 3D camera rotates',()=>{const origin={x:0,z:0};assert.deepEqual(screenMovement({x:0,z:10},origin,1,0),{x:1,y:0});const end=screenMovement({x:-10,z:0},origin,1,0);assert.equal(Math.abs(end.x),0);assert.equal(end.y,1);const up=screenMovement({x:-10,z:0},origin,0,-1);assert.equal(up.x,1);});


test('3D face geometry varies across identities and stays consistent for editions of one player',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({width:64,height:64,getContext:()=>({fillText(){}})})};
 const figures=[];
 try{
  const make=(id,baseId)=>{const f=createFootballer({id,baseId,team:0,role:'ST'});figures.push(f);return Array.from(f.root.userData.skinnedMesh.geometry.attributes.position.array);};
  const a=make('edition-a','footballer-one'),b=make('edition-b','footballer-one'),c=make('edition-c','footballer-two');
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
 }finally{figures.forEach(f=>disposeScene(f.root));if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});


test('saved kit colours reach the skinned shirt and dive pose follows either corner',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};let figure;
 try{
  const club={primary:'#12ab34',secondary:'#cd1234',pattern:'halves',kitShorts:'#1234cd',kitSocks:'#cdab12',kitCollar:'v'};
  figure=createFootballer({id:'keeper-test',team:0,role:'ST',x:10,y:34,vx:0,vy:0},9,club);assert.equal(figure.root.userData.kit.pattern,'halves');
  const colors=figure.root.userData.skinnedMesh.geometry.attributes.color,primary=new THREE.Color(club.primary),secondary=new THREE.Color(club.secondary);
  const has=c=>{for(let i=0;i<colors.count;i++)if(Math.abs(colors.getX(i)-c.r)<1e-6&&Math.abs(colors.getY(i)-c.g)<1e-6&&Math.abs(colors.getZ(i)-c.b)<1e-6)return true;return false;};assert.ok(has(primary));assert.ok(has(secondary));
  for(const side of [-1,1]){updateFootballer(figure,{x:10,y:34,vx:0,vy:0,visual:{kind:'dive',until:10,rollSign:side}},1,1);assert.equal(Math.sign(figure.body.rotation.z),side);}
 }finally{if(figure)disposeScene(figure.root);if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
