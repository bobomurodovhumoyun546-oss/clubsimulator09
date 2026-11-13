import {useLanguage} from '../i18n/context';
import {friendCopy} from '../data/friendsCopy';
import {onlineNotice} from './onlineCopy';
import {useEffect,useRef,useState} from 'react';
import {accountApi} from '../features/accountApi';
import {mountMatch} from './scene3d';
import './match.css';
export default function OnlineMatch({matchId,onClose}){
 const {language}=useLanguage(),w=friendCopy(language);
 const host=useRef(null),controls=useRef({online:true,zoom:1.344,graphics:'high',fps:60,camera:'broadcast',timeOfDay:'day',weather:'clear',shotAim:0}),engine=useRef(null);
 const [view,setView]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[charge,setCharge]=useState(0);
 useEffect(()=>{let active=true,game,timer,busy=false,seq=Date.now(),actions=[],input={x:0,y:0};const c=controls.current;
  c.sendInput=(next,events)=>{input=next;actions.push(...events);actions=actions.slice(-8);};
  function apply(data){if(!active)return;Object.assign(engine.current,data.state);setView({names:data.names,team:data.team,score:data.state.score,minute:data.state.minute,paused:data.state.paused,finished:data.state.finished,notice:data.state.noticeTime>0?data.state.notice:'',player:data.state.players[data.state.selected],reason:data.reason});}
  async function sync(){if(busy||!active)return;busy=true;const sent=actions.splice(0);try{const data=await accountApi('friends/match/'+matchId+'/input',{...input,seq:++seq,actions:sent});apply(data);if(active)setError('');}catch{if(active)setError('reconnecting');}finally{busy=false;}}
  accountApi('friends/match/'+matchId+'/join',{}).then(data=>{if(!active)return;engine.current={...data.state};apply(data);game=mountMatch(host.current,engine.current,controls,setCharge,()=>setError('graphicsError'));setLoading(false);timer=setInterval(sync,80);void sync();}).catch(()=>{if(active){setLoading(false);setError('connectionFailed');}});
  return()=>{active=false;clearInterval(timer);game?.destroy();delete c.sendInput;};
 },[matchId]);
 async function leave(){if(view?.finished||!engine.current){onClose();return;}if(!window.confirm(w.leaveConfirm))return;try{await accountApi('friends/match/'+matchId+'/leave',{});onClose();}catch{setError('leaveError');}}
 const action=(key,label,hold=false)=><button key={key} className="pm-control" onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);controls.current[key]=true;host.current?.focus();}} onPointerUp={()=>{if(hold)controls.current[key]=false;if(key==='shoot'){controls.current.shoot=false;controls.current.release=true;}}} onPointerCancel={()=>{controls.current[key]=false;if(key==='shoot')controls.current.release=true;}}>{label}</button>;
 return <div className="sim-player-overlay pm-overlay"><section className="pm-shell" role="dialog" aria-modal="true" aria-label={w.matchTitle}><header className="pm-top"><div><span className="pm-eyebrow">{w.liveEyebrow}</span><h2>{view?.names?.join(' vs ')||w.matchFallback}</h2></div><button className="pm-control" onClick={leave}>{view?.finished?w.close:w.leave} ×</button></header>
 <div className="pm-score"><span>{view?.names?.[0]}</span><strong>{view?.score?.[0]||0} : {view?.score?.[1]||0}</strong><span>{view?.names?.[1]}</span><b>{view?.minute||0}′</b></div>
 <div className="pm-toolbar"><span>{w.you}: {view?.names?.[view.team]} · {view?.team===0?w.home:w.away}</span><button className="pm-control" onClick={()=>controls.current.zoom=Math.max(.8,controls.current.zoom-.1)}>−</button><button className="pm-control" onClick={()=>controls.current.zoom=Math.min(1.6,controls.current.zoom+.1)}>+</button><label><input type="checkbox" onChange={e=>controls.current.ovr=e.target.checked}/> OVR</label></div>
 {loading&&<p className="pm-help">{w.connecting}</p>}{error&&<p className="pm-help" role="alert">{w[error]||w.generic}</p>}
 <div className="pm-stage"><div ref={host} className="pm-canvas" tabIndex={0} aria-label={w.canvasHelp}/>{view?.notice&&<div className="pm-notice">{onlineNotice(view.notice,language)}</div>}</div>
 <div className="pm-bottom"><div><strong>{view?.player?.name}</strong><span> OVR {view?.player?.ovr}</span><progress max={100} value={view?.player?.stamina||0}/></div><div><small>{w.power}</small><progress max={1} value={charge}/></div></div>
 <div className="pm-touch"><div className="pm-dpad">{action('up','↑',true)}{action('left','←',true)}{action('down','↓',true)}{action('right','→',true)}</div><div>{action('pass',w.pass)}{action('shoot',w.shoot,true)}{action('sprint',w.sprint,true)}{action('through',w.through)}{action('long',w.long)}{action('switch',w.switch)}{action('gk',w.gk,true)}</div></div>
 <div className="pm-skills">{action('rainbow','↑ '+w.rainbow)}{action('fakeShot','↓ '+w.fakeShot)}{action('laneChange','→ '+w.laneChange)}{action('elastico','← '+w.elastico)}</div>
 <p className="pm-help">{w.help}</p>
 {view?.finished&&<div className="friends-result"><strong>{view.names[0]} {view.score[0]} – {view.score[1]} {view.names[1]}</strong><p>{view.reason==='fullTime'?w.fullTime:view.reason==='left'?w.left:view.reason==='disconnected'?w.disconnected:w.finished}</p><button className="arcade-button" onClick={onClose}>{w.back}</button></div>}
 </section></div>;
}
