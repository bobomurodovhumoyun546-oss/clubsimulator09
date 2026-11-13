export const SHOT_KEY='Enter';
export function createMatchKeyboard(parent,surface,onClear=()=>{}){
 const held=new Set(),pressed=new Set(),released=new Set();
 const supported=new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','KeyE','KeyQ',SHOT_KEY,'KeyK','KeyG','ArrowUp','ArrowDown','ArrowRight','ArrowLeft']);
 const code=e=>e.code==='NumpadEnter'?SHOT_KEY:e.code;
 function keyDown(e){const key=code(e),tag=e.target?.tagName;if(!supported.has(key)||e.target?.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(tag))return;
  const shell=parent.closest('.pm-shell');if(e.target&&e.target!==surface.document?.body&&e.target!==surface.document?.documentElement&&!shell?.contains(e.target))return;
  if(key===SHOT_KEY&&tag==='BUTTON')return;
  e.preventDefault();if(!held.has(key))pressed.add(key);held.add(key);
 }
 function keyUp(e){const key=code(e);if(!supported.has(key)||!held.has(key))return;e.preventDefault();held.delete(key);released.add(key);}
 function clear(){held.clear();pressed.clear();released.clear();onClear();}
 surface.addEventListener('keydown',keyDown);surface.addEventListener('keyup',keyUp);surface.addEventListener('blur',clear);
 return {held,pressed,released,clear,destroy(){surface.removeEventListener('keydown',keyDown);surface.removeEventListener('keyup',keyUp);surface.removeEventListener('blur',clear);clear();}};
}

export function movementInput(held,controls={}){
 const down=(code,touch)=>held.has(code)||Boolean(controls[touch]);
 return {x:Number(down('KeyD','right'))-Number(down('KeyA','left')),y:Number(down('KeyS','down'))-Number(down('KeyW','up')),sprint:held.has('ShiftLeft')||held.has('ShiftRight')||Boolean(controls.sprint),gk:down('KeyG','gk'),aim:controls.shotAim};
}
