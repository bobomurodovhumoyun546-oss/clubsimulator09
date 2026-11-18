import {attachPortraitFace,portraitFaceProfile} from './portraitFace.js';
import * as THREE from 'three';
import {drawKitBadge,loadKitBadge} from '../../features/clubBadge.js';
import {matchKit,secondaryPanel} from './kit.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {actionState,yawForVelocity,smoothAngle,worldPosition} from './world.js';
const material=color=>new THREE.MeshStandardMaterial({color,roughness:.83,metalness:0});
const sphere=new THREE.SphereGeometry(1,12,9),cylinder=new THREE.CylinderGeometry(1,1,1,10),bootShape=new THREE.CapsuleGeometry(.075,.16,3,8);
const hash=id=>[...String(id)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
function mesh(parent,geometry,mat,position,scale){const m=new THREE.Mesh(geometry,mat);m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function segment(parent,mat,length,top,bottom){const geo=new THREE.CylinderGeometry(top,bottom,length,10);return mesh(parent,geo,mat,[0,-length/2,0],[1,1,1]);}
function limb(parent,position,lengths,radii,upperMat,lowerMat,handMat,isLeg){
 const joint=new THREE.Bone();joint.position.set(...position);parent.add(joint);
 segment(joint,upperMat,lengths[0],radii[0],radii[1]);
 const elbow=new THREE.Bone();elbow.position.y=-lengths[0];joint.add(elbow);
 mesh(elbow,sphere,lowerMat,[0,0,0],[radii[1],radii[1],radii[1]]);
 segment(elbow,lowerMat,lengths[1],radii[1],radii[2]);
 if(isLeg){const sock=segment(elbow,handMat,lengths[1]*.68,radii[1]*1.04,radii[2]*1.05);sock.position.y=-lengths[1]*.6;
 const boot=mesh(elbow,bootShape,upperMat,[0,-lengths[1],.07],[1.1,1,1.4]);boot.rotation.x=Math.PI/2;}
 else mesh(elbow,sphere,handMat,[0,-lengths[1]-.025,.01],[.046,.075,.038]);
 return {joint,elbow};
}
function torsoGeometry(){const profile=[[.16,0],[.18,.13],[.225,.36],[.21,.44],[.115,.51]],points=[];for(let i=0;i<profile.length-1;i++)for(let j=0;j<8;j++){const t=j/8;points.push(new THREE.Vector2(THREE.MathUtils.lerp(profile[i][0],profile[i+1][0],t),THREE.MathUtils.lerp(profile[i][1],profile[i+1][1],t)));}points.push(new THREE.Vector2(...profile.at(-1)));return new THREE.LatheGeometry(points,32);}
export function createFootballer(player,number=1,club={}){
 const kit=matchKit(club,player.team);
 const seed=hash(player.baseId||player.id||'referee'),skin=material(portraitFaceProfile(player.portrait)?.skin||[0xb97950,0xdbac81,0x805139,0xc28f66,0xe5ba94][seed%5]),hair=material([0x281e19,0x322720,0x171b1b,0x60452c][seed%4]);
 const shirt=material(player.role==='REF'?0xf7ca45:player.role==='GK'?(player.team?0x983ee0:0xe9bc39):kit.primary),shorts=material(kit.shorts),socks=material(kit.socks),sleeves=material(player.role==='GK'||player.role==='REF'?shirt.color:kit.sleeves),trim=material(kit.trim),boots=material(seed%2?0xff8d42:0xd6e94f);
 const root=new THREE.Group(),body=new THREE.Bone();root.add(body);
 const shirtGeometry=torsoGeometry();
 if(player.role!=='GK'&&player.role!=='REF'){
  const position=shirtGeometry.attributes.position,colors=new Float32Array(position.count*3),a=new THREE.Color(kit.primary),b=new THREE.Color(kit.secondary);
  for(let i=0;i<position.count;i++){const color=secondaryPanel(kit.pattern,position.getX(i)/.225,position.getY(i)/.51)?b:a;colors.set([color.r,color.g,color.b],i*3);}
  shirtGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 }
 const torso=mesh(body,shirtGeometry,shirt,[0,1.02,0],[1,1,.66]);root.userData.kit=kit;
 mesh(body,cylinder,skin,[0,1.57,0],[.07,.12,.07]);
 const head=new THREE.Bone();head.position.set(0,1.74,.005);body.add(head);
 const faceWidth=.101+(seed%17)*.0016,faceHeight=.133+((seed>>>5)%13)*.0018;
 mesh(head,sphere,skin,[0,0,0],[faceWidth,faceHeight,.102+((seed>>>9)%9)*.002]);
 const style=(seed>>>13)%5;
 if(style!==0)mesh(head,new THREE.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI*(style===1?.44:.57)),hair,[0,.025,-.013],[faceWidth*1.04,faceHeight*(style===2?1.25:.96),.111]);
 if(style===3){for(let n=0;n<5;n++)mesh(head,sphere,hair,[(n-2)*.037,.13,-.006],[.03,.042,.087]);}
 if(style===4)mesh(head,sphere,hair,[0,.075,-.105],[.077,.085,.056]);
 const eyeSpacing=.035+((seed>>>17)%8)*.002;
 const brow=material(0x30251e),lip=material(0x805449);
 for(const side of [-1,1]){
  mesh(head,sphere,skin,[side*faceWidth,-.01,0],[.02,.027+(seed%5)*.002,.016]);
  if(player.portrait)continue;
  mesh(head,sphere,material(0xe8e3d6),[side*eyeSpacing,.017,.099],[.016,.009,.008]);
  mesh(head,sphere,material([0x38271b,0x314e42,0x496779][(seed>>>21)%3]),[side*eyeSpacing,.017,.106],[.007,.007,.004]);
  const eyebrow=mesh(head,sphere,brow,[side*eyeSpacing,.039,.1],[.019,.005,.006]);eyebrow.rotation.z=side*((seed%5)-2)*.08;
 }
 if(!player.portrait){
  mesh(head,sphere,lip,[0,-.06,.101],[.024+(seed%6)*.002,.004,.006]);
  if((seed>>>24)%3===0)mesh(head,new THREE.SphereGeometry(1,12,6,0,Math.PI*2,Math.PI*.61,Math.PI*.37),hair,[0,-.006,.003],[faceWidth*1.015,faceHeight*.98,.108]);
  mesh(head,sphere,skin,[0,-.012,.112],[.019+(seed%7)*.002,.023+((seed>>>7)%5)*.002,.02+((seed>>>11)%6)*.002]);
 }
 mesh(body,sphere,shorts,[0,.99,0],[.185,.13,.12]);
 const arms=[-1,1].map(side=>{
  mesh(body,sphere,sleeves,[side*.22,1.45,0],[.08,.095,.09]);
  const arm=limb(body,[side*.245,1.43,0],[.24,.24],[.066,.05,.037],skin,skin,skin,false);arm.joint.rotation.z=side*.12;return arm;
 });
 const legs=[-1,1].map(side=>{
  const leg=limb(body,[side*.095,.96,0],[.43,.44],[.086,.064,.045],skin,skin,socks,true);
  // Tailored shorts overlap the upper thigh; boots use a shared rounded mesh.
  segment(leg.joint,shorts,.22,.095,.089);const shoe=leg.elbow.children.at(-1);shoe.material=boots;return leg;
 });
 // Thin kit seams, collar and a genuinely curved number patch on the back.
 const collar=mesh(body,new THREE.TorusGeometry(.082,.012,5,12),trim,[0,1.525,0],[1,1,1]);collar.rotation.x=Math.PI/2;
 if(kit.collar==='v'||kit.collar==='polo')for(const side of [-1,1]){
  const edge=mesh(body,cylinder,trim,[side*.043,1.49,.092],[.012,.11,.012]);edge.rotation.z=side*.65;
 }
 if(kit.collar==='polo')mesh(body,cylinder,trim,[0,1.44,.105],[.01,.1,.01]);
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle=kit.text;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText((player.name||'').split(' ').at(-1).slice(0,12).toUpperCase(),32,12);ctx.font='bold 40px Arial';ctx.fillText(String((number-1)%11+1),32,53);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const decal=new THREE.Mesh(new THREE.PlaneGeometry(.18,.2),new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide,depthWrite:false}));decal.position.set(0,1.32,-.151);decal.rotation.y=Math.PI;body.add(decal);
 if(player.role!=='REF'){
  const front=document.createElement('canvas');front.width=128;front.height=64;const paint=front.getContext('2d');paint.fillStyle=kit.text;paint.textAlign='center';paint.font='bold 12px Arial';drawKitBadge(paint,{...club,primary:kit.primary,secondary:kit.secondary});paint.fillStyle=kit.text;paint.font='bold 14px Arial';paint.fillText(kit.sponsor.slice(0,17).toUpperCase(),64,42);
  const print=new THREE.CanvasTexture(front);print.colorSpace=THREE.SRGBColorSpace;let printDisposed=false;print.addEventListener('dispose',()=>{printDisposed=true;});if(club.badgeTeamId)void loadKitBadge(club).then(image=>{if(!image||printDisposed)return;paint.clearRect(0,0,128,64);drawKitBadge(paint,{...club,primary:kit.primary,secondary:kit.secondary});paint.fillStyle=kit.text;paint.textAlign='center';paint.font='bold 14px Arial';paint.fillText(kit.sponsor.slice(0,17).toUpperCase(),64,42);print.needsUpdate=true;});const patch=new THREE.Mesh(new THREE.PlaneGeometry(.34,.18),new THREE.MeshBasicMaterial({map:print,transparent:true,depthWrite:false}));patch.position.set(0,1.32,.155);body.add(patch);
 }
 if(player.portrait)attachPortraitFace(head,player);
 bakeRig(root);root.scale.setScalar(1.35);
 const figure={root,body,head,torso,arms,legs,yaw:player.team?-Math.PI/2:Math.PI/2,pose:'idle'};root.rotation.y=figure.yaw;return figure;
}
export function updateFootballer(figure,player,time,dt,index=0){
 const {body,arms,legs}=figure,state=actionState(player,time),speed=Math.hypot(player.vx,player.vy),visual=player.visual?.until>time?player.visual:null;
 const targetYaw=yawForVelocity(visual?.vx??player.vx,visual?.vy??player.vy,figure.yaw);figure.yaw=smoothAngle(figure.yaw,targetYaw,1-Math.exp(-dt*12));figure.root.rotation.y=figure.yaw;
 const position=worldPosition(player.x,player.y);figure.root.position.set(position.x,0,position.z);
 const running=state==='run'||state==='sprint'||state==='walk',phase=time*(state==='sprint'?20:state==='walk'?9:15)+index*.73,stride=running?Math.min(.95,speed*.085):0;
 const target={arm0:Math.sin(phase)*stride,arm1:-Math.sin(phase)*stride,fore0:-.4,fore1:-.4,leg0:-Math.sin(phase)*stride,leg1:Math.sin(phase)*stride,knee0:Math.max(0,Math.cos(phase))*.9*stride,knee1:Math.max(0,-Math.cos(phase))*.9*stride,lean:running?.09:0,roll:0,height:running?Math.abs(Math.sin(phase))*.035:Math.sin(time*2+index)*.005,raise:0};
 if(state==='pass'||state==='shoot'){target.leg1=state==='shoot'?-1.25:-.85;target.knee1=.2;target.arm0=-.7;target.arm1=.5;target.lean=.16;}
 const skillPhase=player.skill?Math.max(0,Math.min(1,player.skill.progress??0)):0;
 if(state==='punt'){target.leg1=-1.55;target.knee0=.35;target.arm0=-.8;target.arm1=.6;target.lean=-.18;}
 if(state==='rainbow'){target.leg0=.8;target.knee0=1.7;target.leg1=-.65;target.arm0=-.7;target.arm1=.7;target.height=.12;target.lean=-.12;}
 if(state==='fakeShot'){target.leg1=skillPhase<.5?-1.05:.3;target.knee1=.65;target.lean=.18;target.arm0=-.65;}
 if(state==='laneChange'){target.roll=-.22;target.leg0=-.5;target.leg1=.5;target.arm0=-.8;target.arm1=.4;}
 if(state==='elastico'){target.roll=skillPhase<.38?.24:-.24;target.leg1=skillPhase<.38?-.75:.55;target.knee1=.5;target.arm0=-.5;target.arm1=.5;}
 if(state==='tackle'){target.leg1=-.9;target.knee0=.55;target.height=-.15;target.lean=.25;}
 if(state==='slide'){target.leg1=-1.3;target.leg0=-.6;target.knee0=1.3;target.height=-.67;target.roll=.4;target.lean=-.5;target.arm0=-.9;target.arm1=.8;}
 if(state==='celebrate'){
  const style=visual?.style||'arms';target.raise=style==='salute'?.1:style==='dance'?1.3:2.6;target.arm0=-.3;target.arm1=-.3;
  if(style==='jump'){target.height=Math.abs(Math.sin(time*5))*.38;target.knee0=.35;target.knee1=.35;}
  else if(style==='dance'){target.roll=Math.sin(time*7)*.18;target.leg0=Math.sin(time*7)*.35;target.leg1=-target.leg0;}
  else if(style==='salute'){target.raise1=2;target.arm1=-.8;target.fore1=-1.9;}
  else target.height=Math.abs(Math.sin(time*5))*.08;
 }
 if(state==='dive'){target.roll=1.25*(visual?.rollSign||1);target.height=-.65;target.raise=2.5;target.arm0=-.6;target.arm1=-.6;}
 if(state==='throw'){target.raise=2.6;target.fore0=-1;target.fore1=-1;}
 if(state==='yellow'||state==='red'){target.raise1=2.7;target.arm1=-.1;}
 if(state==='whistle'){target.arm1=-1.2;target.fore1=-1.3;}
 if(state==='catch'){target.arm0=-1.3;target.arm1=-1.3;target.fore0=-.85;target.fore1=-.85;}
 const blend=1-Math.exp(-dt*16),lerp=THREE.MathUtils.lerp;
 arms.forEach((a,i)=>{a.joint.rotation.x=lerp(a.joint.rotation.x,target[`arm${i}`],blend);a.joint.rotation.z=lerp(a.joint.rotation.z,(i?1:-1)*(.12+(target[`raise${i}`]??target.raise)),blend);a.elbow.rotation.x=lerp(a.elbow.rotation.x,target[`fore${i}`],blend);});
 legs.forEach((leg,i)=>{leg.joint.rotation.x=lerp(leg.joint.rotation.x,target[`leg${i}`],blend);leg.elbow.rotation.x=lerp(leg.elbow.rotation.x,target[`knee${i}`],blend);});
 body.position.y=lerp(body.position.y,target.height,blend);body.rotation.x=lerp(body.rotation.x,target.lean,blend);body.rotation.z=lerp(body.rotation.z,target.roll,blend);figure.pose=state;
}

// One vertex-coloured skinned draw per athlete. Rigid bone weights retain joint anatomy
// while avoiding hundreds of separate body-part draw calls on mobile.
function bakeRig(root){
 root.updateMatrixWorld(true);const bones=[],parts=[],originals=[];root.traverse(o=>{if(o.isBone)bones.push(o);});
 root.traverse(object=>{if(!object.isMesh||object.material.map||object.userData.portraitFace)return;const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);const count=geometry.attributes.position.count,color=object.material.color,colors=new Float32Array(count*3),indices=new Uint16Array(count*4),weights=new Float32Array(count*4);let bone=object.parent;while(bone&&!bone.isBone)bone=bone.parent;const index=Math.max(0,bones.indexOf(bone));for(let i=0;i<count;i++){colors.set(geometry.attributes.color?[geometry.attributes.color.getX(i),geometry.attributes.color.getY(i),geometry.attributes.color.getZ(i)]:[color.r,color.g,color.b],i*3);indices[i*4]=index;weights[i*4]=1;}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));parts.push(geometry);originals.push(object);});
 const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());originals.forEach(part=>part.removeFromParent());
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82}));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));root.userData.skinnedMesh=mesh;
}
