import {useCallback,useEffect,useRef,useState,lazy,Suspense} from 'react';
import {Link} from 'react-router-dom';
import {accountApi} from '../../features/accountApi';
import {useLanguage} from '../../i18n/context';
import {careerCopy,careerTabs} from './copy';
import Tactics from './Tactics';
import Stadium from './Stadium';
import Transfers from './Transfers';
import Competitions from './Competitions';
import SkillGames from './SkillGames';
import {Missions,Weather,Highlights,CareerStats} from './Progress';
import './career.css';
import {formations,squadOVR} from '../../features/clubSimulator';
import {matchPreview} from '../../features/footballMatch';
const PlayerMatch=lazy(()=>import('../../match/PlayerMatch'));
export default function CareerHub({userId,onSetup,players}){
 const {language}=useLanguage(),w=careerCopy(language);const [data,setData]=useState(null),[tab,setTab]=useState('tactics'),[practice,setPractice]=useState(false),[loading,setLoading]=useState(()=>Boolean(userId)),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false),[now,setNow]=useState(()=>Date.now()),[filters,setFilters]=useState({search:'',position:'',sort:'rating',page:0});
 const setup=useRef(onSetup);useEffect(()=>{setup.current=onSetup;},[onSetup]);
 const pending=useRef(null),mounted=useRef(true),running=useRef(false);
 const load=useCallback(async(filter={search:'',position:'',sort:'rating',page:0})=>{if(!userId)return;setLoading(true);setError('');try{const result=await accountApi('career?'+new URLSearchParams(filter));if(mounted.current)setData(result);}catch(e){if(mounted.current)setError(e.code||'error');}finally{if(mounted.current)setLoading(false);}},[userId]);
 useEffect(()=>{mounted.current=true;let active=true;if(userId)accountApi('career').then(result=>{if(active){setData(result);setup.current?.({advancedTactics:{...result.state.tactics,familiarity:result.state.familiarity},stadium:result.state.stadium});}}).catch(e=>{if(active)setError(e.code||'error');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;mounted.current=false;};},[userId]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 async function send(type,args={}){
  if(running.current)return null;running.current=true;setBusy(true);setError('');setSuccess(false);
  const action={type,...args,viewFilters:filters},signature=JSON.stringify({type,...args});if(pending.current?.signature!==signature)pending.current={signature,packet:{...action,id:crypto.randomUUID()}};
  try{const result=await accountApi('career',pending.current.packet);if(mounted.current){setData(result);setSuccess(true);if(type==='tactics'||type==='presetLoad'||type.startsWith('stadium'))setup.current?.({advancedTactics:{...result.state.tactics,familiarity:result.state.familiarity},stadium:result.state.stadium});}pending.current=null;return result.state;}catch(e){if(mounted.current)setError(e.code||'error');if(typeof e.code==='string'&&e.code!=='unavailable'&&e.code!=='generic')pending.current=null;return null;}finally{running.current=false;if(mounted.current)setBusy(false);}
 }
 if(!userId)return <section className="arcade-panel career-hub"><h2>{w('title')}</h2><Link to="/login">{w('login')}</Link></section>;
 const state=data?.state,practiceClub=state?{...state.club,owned:state.roster,lineup:state.tactics.lineup,formation:state.tactics.formation,advancedTactics:{...state.tactics,familiarity:state.familiarity},stadium:state.stadium,matchWeather:state.forecast.type}:null,props={state,send,w,busy,onSetup,now};
 return <section className="arcade-panel career-hub"><header className="career-header"><div><span className="career-eyebrow">CLUBSIM / CAREER</span><h2>{w('title')}</h2><p>{w('intro')}</p></div>{state&&<div className="career-budget"><span>{w('budget')}</span><strong>{state.balance.toLocaleString()}</strong><small>XP {state.xp} · {w('calendar')}: {state.careerDate}</small></div>}</header><p className="career-help">{w('budgetNote')}</p><nav className="career-nav" aria-label={w('title')}>{careerTabs.map((id,i)=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setSuccess(false);}}><span>{String(i+1).padStart(2,'0')}</span>{w(id)}</button>)}</nav><div className="career-row"><button className="career-button" disabled={!state||busy} onClick={()=>setPractice(true)}>{w('practice')}</button><button className="career-button" disabled={busy||loading} onClick={()=>load(filters)}>{w('refresh')}</button>{(loading||busy)&&<p role="status">{w('loading')}</p>}{success&&<p className="career-success" role="status">✓ {w('saved')}</p>}</div>{error&&<p className="career-error" role="alert">{w(error)}</p>}{practice&&practiceClub&&<Suspense fallback={<p>{w('loading')}</p>}><PlayerMatch club={practiceClub} players={players} roles={formations[practiceClub.formation]} preview={matchPreview(practiceClub,players,formations[practiceClub.formation],squadOVR(practiceClub,players))} onClose={()=>setPractice(false)} onComplete={()=>setPractice(false)}/></Suspense>}<p className="career-help">{w('practiceNote')}</p>{state&&<div className="career-body" aria-busy={busy}>{tab==='tactics'?<Tactics key={data.revision} {...props}/>:tab==='stadium'?<Stadium key={data.revision} {...props}/>:tab==='transfers'?<Transfers {...props} load={load} filters={filters} setFilters={setFilters}/>:tab==='missions'?<Missions {...props}/>:tab==='tournaments'?<Competitions {...props}/>:tab==='highlights'?<Highlights {...props}/>:tab==='weather'?<Weather {...props}/>:tab==='skills'?<SkillGames {...props}/>:<CareerStats {...props}/>}</div>}</section>;
}
