import * as THREE from 'three';
import profiles from '../../data/portraitFaces.json' with {type:'json'};
export const portraitFaceProfile=url=>profiles[url];

// A photographic front-face layer, not a scanned or likeness-certified 3D head.
// Original image files remain untouched. Curvature avoids a floating name-card plane.
export function attachPortraitFace(head,player){
 const geometry=new THREE.SphereGeometry(1,24,20,0,Math.PI,0,Math.PI);
 const material=new THREE.MeshBasicMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const face=new THREE.Mesh(geometry,material);face.userData.portraitFace=true;face.scale.set(.109,.149,.121);head.add(face);face.visible=false;
 let disposed=false;material.addEventListener('dispose',()=>{disposed=true;});
 new THREE.TextureLoader().load(player.portrait,texture=>{
  if(disposed){texture.dispose();return;}
  texture.colorSpace=THREE.SRGBColorSpace;
  // Headshots use a tight source crop. Full photos retain more of their source.
  const headshot=player.portraitStyle==='headshot';
  const profile=portraitFaceProfile(player.portrait);
  texture.repeat.fromArray(profile?.repeat||[headshot?.9:.46,headshot?.94:.43]);
  texture.offset.fromArray(profile?.offset||[headshot?.05:.27,headshot?.03:.51]);
  material.map=texture;material.needsUpdate=true;face.visible=true;
 },undefined,()=>{face.visible=false;});
 return face;
}
