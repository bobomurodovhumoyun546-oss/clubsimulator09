import Phaser from 'phaser';
import {stepEngine,kick,tackle,switchPlayer,clamp} from './engine';
import {VIEW,project,animationPose,arrangeLabels} from './rendering';
import {buildStadium,buildGoals,makeShadow} from './stadium';

export function mountMatch(parent,state,controls,onUpdate,onError=()=>{}){
 class MatchScene extends Phaser.Scene {
  preload(){
   this.load.spritesheet('footballer-home',`${import.meta.env.BASE_URL}match/players-atlas.png`,{frameWidth:128,frameHeight:128});
   this.load.spritesheet('footballer-away',`${import.meta.env.BASE_URL}match/players-away-atlas.png`,{frameWidth:128,frameHeight:128});
   this.load.on('loaderror',()=>onError('Football sprite atlas could not load. Please reload the match.'));
  }
  create(){
   const c=controls.current;this.low=c.graphics==='low';this.night=c.timeOfDay==='night';
   this.field=this.add.image(0,0,buildStadium(this,this.night,this.low)).setOrigin(0).setDepth(-100);
   buildGoals(this);makeShadow(this);
   this.figures=state.players.map(p=>this.makeFigure(p));
   this.selection=this.add.graphics().setDepth(2);this.ballShadow=this.add.image(0,0,'soft-shadow').setScale(.22).setDepth(1);
   this.ball=this.add.graphics();this.referee=this.makeFigure({team:0,name:'',role:'REF'});this.referee.sprite.setTint(0xffe98a);this.referee.name.setVisible(false);
   this.weather=this.add.graphics().setScrollFactor(0).setDepth(5000);
   this.lighting=this.add.graphics().setScrollFactor(0).setDepth(4500);this.crowd=this.add.graphics().setDepth(-90);
   this.keys=this.input.keyboard.addKeys('W,A,S,D,SHIFT,SPACE,E,Q,J,K,G');
   this.input.keyboard.addCapture(['SPACE','W','A','S','D','SHIFT','E','Q','J','K','G']);
   this.charge=0;this.accumulator=0;this.hudTime=0;this.labelTime=0;this.visualClock=0;this.lastScore=0;this.cheer=0;
   this.cameras.main.setBounds(-155,-100,1550,900);this.cameras.main.centerOn(620,350);
   this.input.on('pointerdown',()=>parent.focus());
   // Browser focus loss must never leave a held sprint, movement or charge active.
   this.blur=()=>{for(const key of ['up','down','left','right','sprint','shoot','gk'])controls.current[key]=false;this.keys&&Object.values(this.keys).forEach(key=>key.reset());this.charge=0;};
   window.addEventListener('blur',this.blur);this.events.once('shutdown',()=>window.removeEventListener('blur',this.blur));
   parent.focus();
  }
  makeFigure(p){
   const key=p.team?'footballer-away':'footballer-home';
   const shadow=this.add.image(0,0,'soft-shadow').setScale(.55).setDepth(1);
   const ghost=this.add.image(0,0,key,0).setOrigin(.5,.96).setAlpha(0);
   const sprite=this.add.image(0,0,key,p.team?4:0).setOrigin(.5,.96);
   const name=this.add.text(0,0,p.name,{fontFamily:'Arial',fontSize:'10px',fontStyle:'bold',color:'#f6faf8',stroke:'#10252e',strokeThickness:3,padding:{x:3,y:2}}).setOrigin(.5,1).setDepth(2500);
   return {sprite,ghost,shadow,name,pose:{facing:p.team?4:0},blend:1,lastId:p.id};
  }
  updateFigure(figure,p,dt,index){
   const pos=project(p.x,p.y),pose=animationPose(p,this.visualClock,figure.pose),active=pose.state!=='idle'&&pose.state!=='catch',height=pos.scale;
   if(figure.pose.state!==pose.state||figure.pose.facing!==pose.facing){figure.ghost.setTexture(figure.sprite.texture.key,figure.sprite.frame.name);figure.blend=0;}
   figure.blend=Math.min(1,figure.blend+dt/110);figure.pose=pose;
   const stride=pose.state==='run'||pose.state==='sprint'?Math.sin(this.visualClock*(pose.state==='sprint'?24:18)+index)*.75:0;
   const breathe=pose.state==='idle'?Math.sin(this.visualClock*2+index)*.25:0;
   const key=p.role==='GK'?'footballer-home':p.team?'footballer-away':'footballer-home';
   figure.sprite.setTexture(key,pose.frame).setPosition(pos.x,pos.y+stride+breathe).setScale(height).setDepth(pos.y).setAlpha(figure.blend);
   figure.ghost.setPosition(pos.x,pos.y+stride).setScale(height).setDepth(pos.y-.01).setAlpha(1-figure.blend);
   if(p.role==='GK'){figure.sprite.setTint(p.team?0xb4ed9a:0xe0ceff);figure.ghost.setTint(p.team?0xb4ed9a:0xe0ceff);}else {figure.sprite.clearTint();figure.ghost.clearTint();}
   // A subtle follow-through rotates around the feet while action poses crossfade.
   const angle=pose.state==='shoot'?-.045:pose.state==='tackle'?.12:pose.state==='turn'?.045:0;
   figure.sprite.rotation=Phaser.Math.Linear(figure.sprite.rotation,angle,.25);
   figure.shadow.setPosition(pos.x+4,pos.y+2).setScale(height*1.4,height*.9).setAlpha(active?.8:1);
   if(figure.lastId!==p.id){figure.name.setText(p.name);figure.lastId=p.id;}
   return pos;
  }
  update(_time,delta){
   if(!this.keys)return;
   const k=this.keys,c=controls.current,focused=document.activeElement?.tagName!=='SELECT';
   const input={x:focused?(Number(k.D.isDown||c.right)-Number(k.A.isDown||c.left)):0,y:focused?(Number(k.S.isDown||c.down)-Number(k.W.isDown||c.up)):0,sprint:focused&&(k.SHIFT.isDown||c.sprint),gk:focused&&(k.G.isDown||c.gk)};
   if(!state.paused&&!state.finished){
    this.visualClock+=Math.min(delta/1000,.1);
    const own=state.players[state.owner]?.team===0;
    if(focused){
     if(Phaser.Input.Keyboard.JustDown(k.K)||c.switch){switchPlayer(state);c.switch=false;}
     if(Phaser.Input.Keyboard.JustDown(k.SPACE)||c.pass){if(own&&state.owner===state.selected)kick(state,'pass',.6,input);else tackle(state);c.pass=false;}
     for(const [key,type] of [['E','through'],['Q','long']])if(Phaser.Input.Keyboard.JustDown(k[key])||c[type]){if(own&&state.owner===state.selected)kick(state,type,.6,input);else tackle(state,key==='E');c[type]=false;}
     if(k.J.isDown||c.shoot)this.charge=clamp(this.charge+delta/1200,0,1);
     if(Phaser.Input.Keyboard.JustUp(k.J)||c.release){if(own&&state.owner===state.selected)kick(state,'shot',Math.max(.15,this.charge),input);else tackle(state);this.charge=0;c.release=false;}
    }
    this.accumulator+=Math.min(delta/1000,.1);while(this.accumulator>=1/60){stepEngine(state,1/60,input);this.accumulator-=1/60;}
   }
   // Event expiry uses simulation time, while run cycles use visual time. Pauses freeze both.
   const positions=state.players.map((p,i)=>{const visual=p.visual?.until>state.time?{...p.visual,until:this.visualClock+.1}:undefined;return this.updateFigure(this.figures[i],{...p,visual},delta,i);});
   this.selection.clear();if(state.mode!=='auto'){const pos=positions[state.selected];this.selection.lineStyle(2,0x48e5ff,.95);this.selection.strokeEllipse(pos.x,pos.y+1,27,11);this.selection.fillStyle(0x48e5ff,.14);this.selection.fillEllipse(pos.x,pos.y+1,27,11);this.selection.fillStyle(0x48e5ff);this.selection.fillTriangle(pos.x-4,pos.y-59,pos.x+4,pos.y-59,pos.x,pos.y-53);}
   this.labelTime+=delta;if(this.labelTime>100){this.labelTime=0;
    const labels=this.figures.map((f,i)=>{const text=state.players[i].name+(c.ovr?` · ${state.players[i].ovr}`:'');if(f.name.text!==text)f.name.setText(text);f.name.setColor(i===state.selected&&state.mode!=='auto'?'#9af2ff':'#f6faf8');return {i,x:positions[i].x,y:positions[i].y-53,width:f.name.width,selected:i===state.selected};});
    for(const label of arrangeLabels(labels))this.figures[label.i].name.setPosition(label.x,label.y);
   }
   const bp=project(state.ball.x,state.ball.y),z=state.ball.z*8;
   this.ballShadow.setPosition(bp.x+2,bp.y+1).setScale(.19+state.ball.z*.018).setAlpha(Math.max(.3,1-state.ball.z*.15));
   this.ball.clear().setDepth(bp.y+1+z);this.ball.fillStyle(0xf8faf5);this.ball.fillCircle(bp.x,bp.y-3-z,3.5);this.ball.lineStyle(.6,0x85958e);this.ball.strokeCircle(bp.x,bp.y-3-z,3.5);this.ball.fillStyle(0x203b42);this.ball.fillCircle(bp.x+Math.sin(this.visualClock*10)*1.3,bp.y-3-z,1.2);this.ball.fillCircle(bp.x-1.5,bp.y-4.5-z,.6);
   this.updateFigure(this.referee,{x:52+(state.ball.x-52)*.35,y:22+(state.ball.y-34)*.35,vx:1.2,vy:0,team:0},delta,22);this.referee.name.setVisible(false);this.referee.sprite.setTint(0xffd66b);
   const camera=this.cameras.main,zoom=c.zoom||1;camera.setZoom(Phaser.Math.Linear(camera.zoom,zoom,1-Math.exp(-delta/130)));
   const center=project(52.5+(state.ball.x-52.5)*.64,34+(state.ball.y-34)*.38),lerp=1-Math.exp(-delta/550);
   const targetX=zoom<=1?620:clamp(center.x,620/zoom,1240-620/zoom),targetY=zoom<=1?350:clamp(center.y,350/zoom,700-350/zoom);
   camera.scrollX+=(targetX-620-camera.scrollX)*lerp;camera.scrollY+=(targetY-350-camera.scrollY)*lerp;
   this.updateAtmosphere(delta,c);
   this.hudTime+=delta;if(this.hudTime>150){this.hudTime=0;onUpdate(this.charge);}
  }
  updateAtmosphere(delta,c){
   const night=c.timeOfDay==='night';if(night!==this.night){this.night=night;this.field.setTexture(buildStadium(this,night,this.low));}
   this.weather.clear();const weather=c.weather||'clear',clock=this.visualClock;
   if(weather!=='clear'){
    const count=this.low?28:95;
    if(weather==='rain'){this.weather.fillStyle(0x092641,.065);this.weather.fillRect(0,0,1240,700);this.weather.lineStyle(.8,0xcce2f0,.42);for(let i=0;i<count;i++){const x=(i*137.21+clock*70)%1280-20,y=(i*87.17+clock*340)%740-20;this.weather.lineBetween(x,y,x-5,y+13);}}
    else {this.weather.fillStyle(0xf1f8ff,.65);for(let i=0;i<count;i++){const x=(i*137.21+clock*17+Math.sin(i+clock)*12)%1280-20,y=(i*87.17+clock*40)%740-20;this.weather.fillCircle(x,y,i%3===0?1.7:.9);}}
   }
   this.lighting.clear();if(night){for(const x of [50,1190]){this.lighting.fillStyle(0xf0f8ff,.025);this.lighting.fillTriangle(x,45,x-330,650,x+330,650);this.lighting.fillStyle(0xe4f5ff,.9);this.lighting.fillRoundedRect(x-24,40,48,6,2);}}
   const score=state.score[0]+state.score[1];if(score!==this.lastScore){this.lastScore=score;this.cheer=3;}
   this.cheer=Math.max(0,this.cheer-delta/1000);this.crowd.clear();if(this.cheer>0){this.crowd.lineStyle(2,0xb8f4ff,.3+Math.sin(clock*14)*.2);for(let i=0;i<75;i++){const x=20+i*16;this.crowd.lineBetween(x,70+Math.sin(i+clock*14)*3,x+3,63+Math.sin(i+clock*14)*3);}}
  }
 }
 const fps=controls.current.fps||60;
 return new Phaser.Game({type:Phaser.AUTO,parent,width:VIEW.width,height:VIEW.height,backgroundColor:'#172c30',scene:MatchScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},fps:{target:fps,limit:fps},audio:{noAudio:true},input:{keyboard:{target:parent}},render:{antialias:true,roundPixels:false,powerPreference:controls.current.graphics==='low'?'low-power':'high-performance'}});
}
