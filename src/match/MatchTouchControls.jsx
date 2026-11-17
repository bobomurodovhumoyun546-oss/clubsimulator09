import {useEffect,useRef,useState} from 'react';
import {playFeatures} from '../data/playFeaturesCopy';
import {joystickVector} from './touchInput';
export default function MatchTouchControls({onInput,host,language,disabled=false,charge=0}){
 const w=playFeatures(language),pointer=useRef(null),pressed=useRef(new Map()),sprintActive=useRef(false),[thumb,setThumb]=useState({x:0,y:0}),[sprinting,setSprinting]=useState(false);
 useEffect(()=>{
  const reset=()=>{pointer.current=null;pressed.current.clear();sprintActive.current=false;onInput({joystick:null,sprint:false,shoot:false,release:false,gk:false});setThumb({x:0,y:0});setSprinting(false);};
  const visibility=()=>{if(document.hidden)reset();};
  window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);onInput({joystick:null,sprint:false,shoot:false,release:false,gk:false});};
 },[onInput]);
 useEffect(()=>{if(disabled){sprintActive.current=false;onInput({joystick:null,shoot:false,release:false,sprint:false,gk:false});}},[disabled,onInput]);
 function move(e){if(pointer.current!==e.pointerId||disabled)return;e.preventDefault();const box=e.currentTarget.getBoundingClientRect(),radius=box.width*.32,v=joystickVector(e.clientX-box.left-box.width/2,e.clientY-box.top-box.height/2,radius);onInput({joystick:v});setThumb({x:v.x*radius,y:v.y*radius});}
 function releaseStick(e){if(pointer.current!==e.pointerId)return;pointer.current=null;onInput({joystick:null});setThumb({x:0,y:0});}
 function release(e,key,cancel=false){if(pressed.current.get(key)!==e.pointerId)return;pressed.current.delete(key);if(key==='gk')onInput({gk:false});if(key==='shoot')onInput({shoot:false,release:!cancel});}
 function action(key,label,main=false){return <button type="button" className={'pm-touch-action pm-touch-action--'+key+(main?' is-primary':'')} disabled={disabled} key={key} aria-pressed={key==='sprint'?!disabled&&sprinting:undefined} onPointerDown={e=>{if(disabled)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);host.current?.focus();if(key==='sprint'){const next=!sprintActive.current;sprintActive.current=next;onInput({sprint:next});setSprinting(next);}else{pressed.current.set(key,e.pointerId);onInput({[key]:true});}}} onPointerUp={e=>release(e,key)} onPointerCancel={e=>release(e,key,true)} onLostPointerCapture={e=>release(e,key,true)}>{label}{key==='shoot'&&<span className="pm-touch-power" style={{width:Math.max(0,Math.min(1,charge))*100+'%'}}/>}</button>;}
 return <div className="pm-mobile-controls" data-disabled={disabled}>
  <div className="pm-joystick" role="group" aria-label={w.joystick} onPointerDown={e=>{if(disabled||pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);host.current?.focus();move(e);}} onPointerMove={move} onPointerUp={releaseStick} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><span className="pm-joystick-ring"/><span className="pm-joystick-thumb" style={{transform:`translate(${disabled?0:thumb.x}px,${disabled?0:thumb.y}px)`}}/></div>
  <div className="pm-mobile-actions"><div className="pm-mobile-primary">{action('sprint',w.sprint)}{action('shoot',w.shoot,true)}{action('pass',w.pass)}{action('through',w.through)}</div><div className="pm-mobile-secondary">{action('long',w.long)}{action('switch',w.switch)}{action('gk',w.keeper)}</div></div>
 </div>;
}
