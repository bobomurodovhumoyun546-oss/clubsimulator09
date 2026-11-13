import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatchKeyboard,movementInput} from '../src/match/keyboard.js';
test('WASD works from body on first input, Enter replaces J and numpad Enter works',()=>{
 const surface=new EventTarget(),body={tagName:'BODY'},select={tagName:'SELECT'},shell={contains:t=>t===select};surface.document={body};const keys=createMatchKeyboard({closest:()=>shell},surface);
 const send=(type,code,target=body)=>{const event=new Event(type,{cancelable:true});Object.defineProperties(event,{code:{value:code},target:{value:target}});surface.dispatchEvent(event);return event;};
 send('keydown','KeyW');assert.ok(keys.held.has('KeyW'));send('keyup','KeyW');assert.ok(keys.released.has('KeyW'));
 send('keydown','KeyJ');assert.equal(keys.held.has('KeyJ'),false);send('keydown','NumpadEnter');assert.ok(keys.pressed.has('Enter'));send('keyup','NumpadEnter');assert.ok(keys.released.has('Enter'));
 send('keydown','KeyD',select);assert.equal(keys.held.has('KeyD'),false);surface.dispatchEvent(new Event('blur'));assert.equal(keys.held.size,0);keys.destroy();send('keydown','KeyW');assert.equal(keys.held.size,0);
});

test('each WASD key and untouched controls produce finite independent axes',()=>{
 const expected={KeyW:[0,-1],KeyA:[-1,0],KeyS:[0,1],KeyD:[1,0]};
 for(const [key,axes] of Object.entries(expected)){const input=movementInput(new Set([key]),{zoom:1.12});assert.deepEqual([input.x,input.y],axes);}
 assert.deepEqual([movementInput(new Set()).x,movementInput(new Set()).y],[0,0]);
 const touch=movementInput(new Set(),{up:true});assert.deepEqual([touch.x,touch.y],[0,-1]);
});
