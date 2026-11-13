import * as THREE from 'three';
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const box=(scene,w,h,d,color,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;};
function grassTexture(){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const c=canvas.getContext('2d');
 for(let i=0;i<20;i++){c.fillStyle=i%2?'#387c36':'#448b40';c.fillRect(i*76.8,0,77,1024);}
 let seed=17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<75000;i++){c.fillStyle=random()>.5?'rgba(174,196,117,.16)':'rgba(18,57,27,.16)';c.fillRect(random()*1536,random()*1024,.7,1+random()*3);}
 const x=v=>v/105*1536,y=v=>v/68*1024;const line=points=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(x(px),y(py)):c.moveTo(x(px),y(py)));c.stroke();};
 c.strokeStyle='#ecf2da';c.lineWidth=2.5;line([[0,0],[105,0],[105,68],[0,68],[0,0]]);line([[52.5,0],[52.5,68]]);
 const circle=(cx,cy,r,a=0,b=Math.PI*2)=>{c.beginPath();c.ellipse(x(cx),y(cy),x(r),y(r),0,a,b);c.stroke();};circle(52.5,34,9.15);
 for(const side of [0,105]){const dir=side?-1:1;line([[side,13.84],[side+dir*16.5,13.84],[side+dir*16.5,54.16],[side,54.16]]);line([[side,24.84],[side+dir*5.5,24.84],[side+dir*5.5,43.16],[side,43.16]]);circle(side+dir*11,34,9.15,side?Math.PI*.71:-Math.PI*.29,side?Math.PI*1.29:Math.PI*.29);c.fillStyle='#eef3db';c.beginPath();c.arc(x(side+dir*11),y(34),2,0,7);c.fill();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function pole(scene,a,b,r=.06,color=0xf2f2e9){const direction=new THREE.Vector3().subVectors(b,a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),8),mat(color));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());mesh.castShadow=true;scene.add(mesh);return mesh;}
function goal(scene,side){
 const x=side*52.5,back=x+side*3,height=2.5,width=7;for(const z of [-width,width]){pole(scene,new THREE.Vector3(x,0,z),new THREE.Vector3(x,height,z));pole(scene,new THREE.Vector3(x,height,z),new THREE.Vector3(back,height*.8,z),.035,0xc6d3d8);}
 pole(scene,new THREE.Vector3(x,height,-width),new THREE.Vector3(x,height,width));
 const vertices=[];const edge=(a,b)=>vertices.push(...a,...b);
 for(let z=-width;z<=width+.01;z+=.35){edge([back,0,z],[back,height*.8,z]);edge([x,height,z],[back,height*.8,z]);}
 for(let y=0;y<=height*.8+.01;y+=.25)edge([back,y,-width],[back,y,width]);
 for(const z of [-width,width]){for(let y=0;y<=height+.01;y+=.25)edge([x,y,z],[back,y*.8,z]);for(let i=0;i<=8;i++){const p=i/8;edge([x+(back-x)*p,0,z],[x+(back-x)*p,height*(1-p*.2),z]);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const net=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xd6e4de,transparent:true,opacity:.55}));scene.add(net);
}
function boardTexture(){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#133751';c.fillRect(0,0,512,96);c.fillStyle='#8de6ec';c.font='bold 38px Arial';c.textAlign='center';c.fillText('CLUBSIM',256,48);c.fillStyle='#dcefe8';c.font='13px Arial';c.fillText('THE BEAUTIFUL GAME',256,75);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function createStadium(scene,low=false){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,120),mat(0x295338));ground.rotation.x=-Math.PI/2;ground.position.y=-.045;ground.receiveShadow=true;scene.add(ground);
 const pitch=new THREE.Mesh(new THREE.PlaneGeometry(105,68),mat(0xffffff,{map:grassTexture()}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
 for(const side of [-1,1])goal(scene,side);
 const ads=new THREE.InstancedMesh(new THREE.BoxGeometry(7.7,1,.22),mat(0xffffff,{map:boardTexture()}),28),dummy=new THREE.Object3D();let count=0;
 for(const side of [-1,1])for(let i=0;i<14;i++){dummy.position.set(-50+i*7.7,.55,side*37);dummy.rotation.y=side===1?Math.PI:0;dummy.updateMatrix();ads.setMatrixAt(count++,dummy.matrix);}scene.add(ads);
 for(const side of [-1,1]){
  for(let tier=0;tier<7;tier++){box(scene,126,.5,2,0x46535d,0,1+tier*.65,side*(41+tier*1.8));box(scene,2,.5,86,0x3b4f5a,side*(61+tier*1.8),1+tier*.65,0);}
  box(scene,132,2,1.5,0x223a49,0,6.5,side*55);box(scene,1.5,2,98,0x223a49,side*75,6.5,0);
 }
 const crowd=new THREE.Group(),rows=low?4:7,columns=low?85:150,total=rows*columns*4,spectators=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.15,.23,2,5),mat(0xffffff),total),color=new THREE.Color();let n=0;
 for(let side=0;side<4;side++)for(let r=0;r<rows;r++)for(let col=0;col<columns;col++){
  const along=col/(columns-1),sign=side%2?1:-1;
  dummy.position.set(side<2?-60+along*120:sign*(61+r*1.8),1.65+r*.65,side<2?sign*(41+r*1.8):-40+along*80);dummy.scale.setScalar(.85+(col%4)*.08);dummy.rotation.y=side<2?(side===0?0:Math.PI):side===2?Math.PI/2:-Math.PI/2;dummy.updateMatrix();spectators.setMatrixAt(n,dummy.matrix);color.setHex([0xa9b8ba,0x265d9b,0xdaae7f,0xa63e51,0x2d5953,0xe5e3cb][(col+r*3+side)%6]);spectators.setColorAt(n++,color);
 }
 crowd.add(spectators);scene.add(crowd);
 const luminous=mat(0xe9f7ff,{emissive:0xb4d9ff,emissiveIntensity:1.5});
 for(const x of [-60,60])for(const z of [-40,40]){pole(scene,new THREE.Vector3(x,0,z),new THREE.Vector3(x,18,z),.15,0x8a969d);const lamp=new THREE.Mesh(new THREE.BoxGeometry(5,.65,1.7),luminous);lamp.position.set(x,18,z);lamp.rotation.x=z>0?.3:-.3;scene.add(lamp);}
 for(const x of [-52.5,52.5])for(const z of [-34,34]){pole(scene,new THREE.Vector3(x,0,z),new THREE.Vector3(x,1.4,z),.025);const flag=new THREE.Mesh(new THREE.PlaneGeometry(.45,.28),new THREE.MeshStandardMaterial({color:0xfcd65a,side:THREE.DoubleSide}));flag.position.set(x+.22,1.25,z);scene.add(flag);}
 return {crowd,luminous};
}
export function createWeather(scene,low=false){
 const count=low?160:500,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=(i*17.31)%130-65;positions[i*3+1]=(i*7.77)%26;positions[i*3+2]=(i*11.73)%95-47.5;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const particles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xe8f5fc,size:.16,transparent:true,opacity:.65,depthWrite:false}));particles.frustumCulled=false;scene.add(particles);
 return {particles,update(weather,dt){particles.visible=weather!=='clear';if(!particles.visible)return;const rain=weather==='rain';particles.material.size=rain?.075:.18;particles.material.opacity=rain?.4:.75;for(let i=0;i<count;i++){positions[i*3+1]-=dt*(rain?21:2.7);positions[i*3]+=dt*(rain?2:.35);if(positions[i*3+1]<.1)positions[i*3+1]=26;if(positions[i*3]>65)positions[i*3]=-65;}geometry.attributes.position.needsUpdate=true;}};
}
