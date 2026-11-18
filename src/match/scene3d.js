import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {stepEngine,performSkill,kick,tackle,switchPlayer,clamp} from './engine';
import {createMatchKeyboard,movementInput} from './keyboard.js';
import {arrangeLabels} from './rendering';
import {createFootballer,updateFootballer} from './three/footballer';
import {createStadium,createWeather} from './three/stadium3d';
import {celebrationActive} from './presentation.js';
import {cameraOffset,disposeScene,screenMovement} from './three/world';

// WebGL renderer only: authoritative match state remains in engine.js.
export function mountMatch(parent,state,controls,onUpdate,onError=()=>{}){
 const low=controls.current.graphics==='low',scene=new THREE.Scene();
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:!low,alpha:false,powerPreference:low?'low-power':'high-performance'});}catch{onError('3D match requires WebGL 2. Please enable browser hardware acceleration.');return {destroy(){}};}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?1:1.5));renderer.shadowMap.enabled=!low;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 renderer.domElement.className='pm-3d-canvas';renderer.domElement.setAttribute('aria-label','ClubSim 3D football pitch');parent.append(renderer.domElement);
 const labelLayer=document.createElement('div');labelLayer.className='pm-3d-labels';parent.append(labelLayer);
 const camera=new THREE.PerspectiveCamera(46,16/9,.2,450),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=24;orbit.maxDistance=150;orbit.maxPolarAngle=Math.PI*.46;orbit.minPolarAngle=.22;orbit.enabled=false;
 const sky=new THREE.HemisphereLight(0xd9ecff,0x56723b,2.7);scene.add(sky);
 const sun=new THREE.DirectionalLight(0xfff0d0,3.3);sun.position.set(-30,65,28);sun.castShadow=!low;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-79,right:79,top:65,bottom:-65,near:.5,far:180});sun.shadow.bias=-.00025;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);
 const stadium=createStadium(scene,low,state.kits?.[0]?.stadium),weather=createWeather(scene,low);
 function makeFigure(p,i){const figure=createFootballer(p,i+1,state.kits?.[p.team]);scene.add(figure.root);const label=document.createElement('span');label.className='pm-3d-label';labelLayer.append(label);return {...figure,label,id:p.id,labelWidth:95};}
 const figures=state.players.map(makeFigure),referee=createFootballer({id:'referee',team:0,role:'REF'},0);scene.add(referee.root);
 const offsideLine=new THREE.Mesh(new THREE.BoxGeometry(.07,.025,68),new THREE.MeshBasicMaterial({color:0xffaa3f,transparent:true,opacity:.8}));offsideLine.visible=false;scene.add(offsideLine);
 const refereeCard=new THREE.Mesh(new THREE.BoxGeometry(.17,.25,.025),new THREE.MeshBasicMaterial({color:0xffdf36}));refereeCard.visible=false;scene.add(refereeCard);
 const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,2),new THREE.MeshStandardMaterial({color:0xf4f6e8,roughness:.6}));ball.castShadow=true;scene.add(ball);
 // Contrasting stitched panels on the actual 3D football, rotating with travel.
 const panelMaterial=new THREE.MeshStandardMaterial({color:0x183244,roughness:.7});for(const direction of [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){const patch=new THREE.Mesh(new THREE.CircleGeometry(.085,5),panelMaterial),normal=new THREE.Vector3(...direction);patch.position.copy(normal).multiplyScalar(.225);patch.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);ball.add(patch);}
 const selected=new THREE.Mesh(new THREE.RingGeometry(.59,.7,40),new THREE.MeshBasicMaterial({color:0x52e3ff,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));selected.rotation.x=-Math.PI/2;selected.position.y=.045;scene.add(selected);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(32,32,3,32,32,32);gradient.addColorStop(0,'rgba(4,20,12,.32)');gradient.addColorStop(1,'rgba(4,20,12,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}),shadowGeometry=new THREE.PlaneGeometry(2,1.4);
 const shadows=state.players.map(()=>{const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;scene.add(shadow);return shadow;});
 const ballShadow=new THREE.Mesh(new THREE.PlaneGeometry(.85,.85),shadowMaterial);ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.02;scene.add(ballShadow);
 const keyboard=createMatchKeyboard(parent,window,clearInput),{held,pressed,released}=keyboard;
 function clearInput(){for(const key of ['up','down','left','right','sprint','shoot','gk','rainbow','fakeShot','laneChange','elastico','pass','through','long','switch','release'])controls.current[key]=false;controls.current.joystick=null;charge=0;}
 function focus(){parent.focus();}
 function contextLost(event){event.preventDefault();state.paused=true;onError('3D graphics context was lost. Close the match and try Low graphics.');}
 renderer.domElement.addEventListener('pointerdown',focus);renderer.domElement.addEventListener('webglcontextlost',contextLost);
 function resize(){const width=parent.clientWidth||1240,height=parent.clientHeight||700;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(parent);resize();
 const target=new THREE.Vector3(0,0,0),desired=new THREE.Vector3(),screenPoint=new THREE.Vector3(),lastOrbitTarget=new THREE.Vector3();
 camera.position.copy(cameraOffset('broadcast',camera.aspect));camera.lookAt(target);orbit.target.copy(target);
 let puntHeld=false;
 let charge=0,lastStamp=0,accumulator=0,frameTime=0,hudTime=0,labelTime=0,visualTime=0,cheer=0,lastScore=0,lastCamera='',disposed=false,lastNight=null,lastZoom=controls.current.zoom||1.12;
 function runInput(dt){const c=controls.current,input=movementInput(held,c);
  if(celebrationActive(state)){
   pressed.clear();released.clear();charge=0;
   for(const key of ['shoot','release','pass','through','long','rainbow','fakeShot','laneChange','elastico'])c[key]=false;
   if(!c.online&&!state.paused){accumulator+=dt;while(accumulator>=1/60){stepEngine(state,1/60,{});accumulator-=1/60;}}
   return;
  }
  Object.assign(input,screenMovement(camera.position,target,input.x,input.y));
  if(c.online){
   const actions=[];
   for(const [key,action] of [['KeyK','switch'],['Space','pass'],['KeyE','through'],['KeyQ','long'],['ArrowUp','rainbow'],['ArrowDown','fakeShot'],['ArrowRight','laneChange'],['ArrowLeft','elastico']]){if(pressed.has(key)||c[action])actions.push(action);c[action]=false;}
   if(pressed.has('Enter')&&state.players[state.selected]?.handling){actions.push('shot');input.power=.8;puntHeld=true;}
   if(held.has('Enter')||c.shoot)charge=clamp(charge+dt/1.2,0,1);
   if(released.has('Enter')||c.release){if(!puntHeld){actions.push('shot');input.power=Math.max(.15,charge);}puntHeld=false;charge=0;c.release=false;}
   c.sendInput?.(input,actions);pressed.clear();released.clear();return;
  }
  if(!state.paused&&!state.finished){const own=state.players[state.owner]?.team===0;
   if(pressed.has('KeyK')||c.switch){switchPlayer(state);c.switch=false;}
   if(pressed.has('Space')||c.pass){if(own&&state.owner===state.selected)kick(state,'pass',.6,input);else tackle(state);c.pass=false;}
   for(const [key,kind] of [['KeyE','through'],['KeyQ','long']])if(pressed.has(key)||c[kind]){if(own&&state.owner===state.selected)kick(state,kind,.6,input);else tackle(state,key==='KeyE');c[kind]=false;}
   for(const [key,skill] of [['ArrowUp','rainbow'],['ArrowDown','fakeShot'],['ArrowRight','laneChange'],['ArrowLeft','elastico']]){if(pressed.has(key)||c[skill])performSkill(state,skill,input);c[skill]=false;}
   if(pressed.has('Enter')&&own&&state.players[state.owner]?.handling&&state.owner===state.selected){kick(state,'shot',.8,input);charge=0;}
   if(held.has('Enter')||c.shoot)charge=clamp(charge+dt/1.2,0,1);
   if(released.has('Enter')||c.release){if(own&&state.owner===state.selected)kick(state,'shot',Math.max(.15,charge),input);else tackle(state);charge=0;c.release=false;}
   accumulator+=dt;while(accumulator>=1/60){stepEngine(state,1/60,input);accumulator-=1/60;}
  }
  pressed.clear();released.clear();
 }
 function updateCamera(dt){const c=controls.current,mode=c.camera||'broadcast',zoom=clamp(c.zoom||1.12,.8,1.6),blend=1-Math.exp(-dt*3.3);
  if(celebrationActive(state)&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const figure=figures.find(f=>f.id===state.celebration.playerId);
   if(figure){orbit.enabled=false;desired.copy(figure.root.position);desired.y=1.65;target.lerp(desired,1-Math.exp(-dt*5));const yaw=figure.yaw;desired.set(Math.sin(yaw)*5.2,2.5,Math.cos(yaw)*5.2).add(figure.root.position);camera.position.lerp(desired,1-Math.exp(-dt*3.5));camera.lookAt(target);camera.updateMatrixWorld();lastCamera='celebration';return;}
  }
  desired.set((state.ball.x-52.5)*.72,0,(state.ball.y-34)*.45);target.lerp(desired,blend);
  if(mode==='orbit'){
   if(lastCamera!=='orbit'){orbit.target.copy(target);orbit.enabled=true;lastOrbitTarget.copy(target);}
   camera.position.add(desired.copy(target).sub(lastOrbitTarget));orbit.target.copy(target);if(zoom!==lastZoom)camera.position.sub(orbit.target).multiplyScalar(lastZoom/zoom).add(orbit.target);lastOrbitTarget.copy(target);orbit.update();
  }else{orbit.enabled=false;desired.copy(cameraOffset(mode,camera.aspect)).multiplyScalar(1/zoom).add(target);camera.position.lerp(desired,blend);camera.lookAt(target);}
  lastZoom=zoom;lastCamera=mode;camera.updateMatrixWorld();
 }
 function labels(){const c=controls.current,width=parent.clientWidth,height=parent.clientHeight,items=[];
  figures.forEach((f,i)=>{const p=state.players[i],text=p.name+(c.ovr?` · ${p.ovr}`:'');if(f.label.textContent!==text){f.label.textContent=text;f.labelWidth=f.label.offsetWidth||95;}
   f.label.classList.toggle('is-selected',i===state.selected&&state.mode!=='auto');screenPoint.copy(f.root.position);screenPoint.y=2.85;screenPoint.project(camera);const visible=screenPoint.z>-1&&screenPoint.z<1&&Math.abs(screenPoint.x)<1.15&&Math.abs(screenPoint.y)<1.1;f.label.style.display=visible&&!p.sentOff?'block':'none';if(visible&&!p.sentOff)items.push({i,x:(screenPoint.x*.5+.5)*width,y:(-.5*screenPoint.y+.5)*height,width:f.labelWidth,selected:i===state.selected});
  });
  for(const label of arrangeLabels(items))figures[label.i].label.style.transform=`translate(${Math.round(label.x)}px,${Math.round(label.y)}px) translate(-50%,-100%)`;
 }
 function renderFrame(stamp){if(disposed)return;const elapsed=lastStamp?Math.min((stamp-lastStamp)/1000,.1):1/60;lastStamp=stamp;frameTime+=elapsed;const interval=1/(controls.current.fps||60);if(frameTime<interval-.001)return;const dt=Math.min(frameTime,.1);frameTime=0;
  runInput(dt);if(!state.paused&&!state.finished)visualTime+=dt;
  state.players.forEach((p,i)=>{let figure=figures[i];if(figure.id!==p.id){scene.remove(figure.root);disposeScene(figure.root);figure.label.remove();figure=makeFigure(p,i);figures[i]=figure;}figure.root.visible=!p.sentOff;shadows[i].visible=!p.sentOff;const blend=controls.current.online?1-Math.exp(-dt*22):1;figure.onlineX??=p.x;figure.onlineY??=p.y;figure.onlineX+=(p.x-figure.onlineX)*blend;figure.onlineY+=(p.y-figure.onlineY)*blend;const celebrating=celebrationActive(state),goalPosition=celebrating?state.celebration.positions?.[i]:null;updateFootballer(figure,{...p,x:goalPosition?.x??figure.onlineX,y:goalPosition?.y??figure.onlineY,vx:celebrating?0:p.vx,vy:celebrating?0:p.vy,skill:p.skill?{...p.skill,progress:(state.time-p.skill.start)/(p.skill.until-p.skill.start)}:null,visual:celebrating&&p.team===state.celebration.team?{kind:'celebrate',style:p.visual?.style,until:visualTime+.1}:p.visual?.until>state.time?{...p.visual,until:visualTime+.1}:undefined},visualTime,dt,i);shadows[i].position.set(figure.root.position.x,.025,figure.root.position.z);});
  updateFootballer(referee,{x:52+(state.ball.x-52)*.32,y:23+(state.ball.y-34)*.25,vx:1.3,vy:0,visual:state.refereeSignal?.until>state.time?{kind:state.refereeSignal.kind,until:visualTime+.1}:null},visualTime,dt,22);
  offsideLine.visible=state.offsideLine?.until>state.time;if(offsideLine.visible)offsideLine.position.set(state.offsideLine.x-52.5,.045,0);
  const signal=state.refereeSignal;refereeCard.visible=signal?.until>state.time&&['yellow','red'].includes(signal.kind);if(refereeCard.visible){refereeCard.material.color.setHex(signal.kind==='red'?0xff304c:0xffdf36);refereeCard.position.copy(referee.root.position);refereeCard.position.y=3.05;}
  if(controls.current.online)ball.position.lerp(new THREE.Vector3(state.ball.x-52.5,.24+state.ball.z,state.ball.y-34),1-Math.exp(-dt*22));else ball.position.set(state.ball.x-52.5,.24+state.ball.z,state.ball.y-34);if(!state.paused){ball.rotation.z-=state.ball.vx*dt*2;ball.rotation.x+=state.ball.vy*dt*2;}
  ballShadow.position.set(ball.position.x,.02,ball.position.z);ballShadow.scale.setScalar(1+state.ball.z*.18);selected.visible=!celebrationActive(state)&&state.mode!=='auto'&&!state.players[state.selected].sentOff;const player=state.players[state.selected];selected.position.set(controls.current.online?figures[state.selected].onlineX-52.5:player.x-52.5,.045,controls.current.online?figures[state.selected].onlineY-34:player.y-34);
  const night=controls.current.timeOfDay==='night';if(night!==lastNight){scene.background=new THREE.Color(night?0x101d35:0x91b6cb);scene.fog=new THREE.Fog(night?0x13213a:0x9eb9c7,125,260);sky.intensity=night?1.7:2.7;sun.color.setHex(night?0xc9e5ff:0xfff0d0);sun.intensity=night?2.7:3.3;stadium.luminous.emissiveIntensity=night?5:.4;renderer.toneMappingExposure=night?1.15:1.22;lastNight=night;}
  const weatherType=controls.current.weather||state.weather||'clear';state.weather=weatherType;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;weather.update(reduced?'clear':weatherType,state.paused?0:dt);if(scene.fog){scene.fog.near=weatherType==='fog'?40:125;scene.fog.far=weatherType==='fog'?125:260;}const score=state.score[0]+state.score[1];if(score!==lastScore){lastScore=score;cheer=3;}cheer=Math.max(0,cheer-dt);stadium.crowd.position.y=cheer?Math.abs(Math.sin(visualTime*11))*.18:0;
  updateCamera(dt);labelTime+=dt;if(labelTime>.1){labelTime=0;labels();}renderer.render(scene,camera);hudTime+=dt;if(hudTime>.15){hudTime=0;onUpdate(charge);}
 }
 renderer.setAnimationLoop(renderFrame);parent.focus();
 return {destroy(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);observer.disconnect();orbit.dispose();keyboard.destroy();renderer.domElement.removeEventListener('pointerdown',focus);renderer.domElement.removeEventListener('webglcontextlost',contextLost);disposeScene(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();labelLayer.remove();}};
}
