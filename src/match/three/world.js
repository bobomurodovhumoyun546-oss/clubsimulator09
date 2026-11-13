import * as THREE from 'three';
// Football world is unchanged (105 x 68 metres). Y is now real height, Z is pitch width.
export function worldPosition(x,y,height=0){return {x:x-52.5,y:height,z:y-34};}
export function yawForVelocity(vx,vy,fallback=0){return Math.hypot(vx,vy)>.2?Math.atan2(vx,vy):fallback;}
export function smoothAngle(current,target,amount){const diff=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+diff*amount;}
export function actionState(player,time){
 if(player.visual?.until>time)return player.visual.kind;
 const speed=Math.hypot(player.vx,player.vy);return speed<.35?'idle':speed<3?'walk':speed>8?'sprint':'run';
}
export function cameraOffset(mode,aspect=16/9){
 const narrow=aspect<1.2?1.3:1;
 if(mode==='tactical')return new THREE.Vector3(0,95*narrow,28*narrow);
 if(mode==='end')return new THREE.Vector3(-66*narrow,36*narrow,12*narrow);
 return new THREE.Vector3(0,53*narrow,65*narrow);
}
export function disposeScene(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(object=>{if(object.skeleton)object.skeleton.dispose();if(object.geometry)geometries.add(object.geometry);if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});
 textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
}

export function screenMovement(cameraPosition,target,x,y){
 const dx=target.x-cameraPosition.x,dz=target.z-cameraPosition.z,length=Math.hypot(dx,dz)||1;
 const forwardX=dx/length,forwardZ=dz/length;
 return {x:-forwardZ*x-forwardX*y,y:forwardX*x-forwardZ*y};
}
