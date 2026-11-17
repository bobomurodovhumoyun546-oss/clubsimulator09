import {useEffect,useReducer,useRef,useState} from 'react';
import {useLanguage} from '../i18n/context';
import {startLiveMatch,advanceLiveMatch,liveScore,canSubstitute} from '../features/liveMatch';
import {ensureOpponentSquads} from '../features/opponentSquads';
import {seasonForMatch} from '../features/clubSeason';
import PlayerPhoto from './PlayerPhoto';
import {benchSlots} from '../features/squadBench';
import {playFeatures} from '../data/playFeaturesCopy';
import './manager-review.css';
const copy={
 uz:{live:'Jonli match',attack:'Hujum — zarba joyini tanlang',defence:'Himoya — seyv joyini tanlang',waiting:'Jamoalar keyingi hujumni tayyorlamoqda…',hint:'1 soniya = 1 daqiqa. Vaziyatga javob berish uchun 5 soniya. Soat to‘xtamaydi.',subs:'Almashtirish',out:'Chiqadigan futbolchi',incoming:'Zahiradagi futbolchi',change:'Almashtirish',injury:'Jarohat — futbolchini almashtiring',goal:'GOL',save:'Seyv / gol bo‘lmadi',finish:'Yakuniy natija',chances:'Urinishlar',injuryNote:'Jarohat ehtimoli: har matchda 1%. Futbolchi keyingi matchga tiklanadi.'},
 en:{live:'Live match',attack:'Attack — choose where to shoot',defence:'Defence — choose where to save',waiting:'The teams are building their next attack…',hint:'1 second = 1 minute. You have 5 seconds to react. The clock keeps running.',subs:'Substitutions',out:'Player off',incoming:'Substitute',change:'Substitute',injury:'Injury — replace this player',goal:'GOAL',save:'Saved / no goal',finish:'Full time',chances:'Attempts',injuryNote:'Injury chance: 1% per match. Players recover for the next match.'},
 ru:{live:'Матч в прямом эфире',attack:'Атака — выберите направление удара',defence:'Защита — выберите направление сейва',waiting:'Команды готовят следующую атаку…',hint:'1 секунда = 1 минута. На выбор даётся 5 секунд. Часы не останавливаются.',subs:'Замены',out:'Кто уходит',incoming:'Запасной',change:'Заменить',injury:'Травма — замените игрока',goal:'ГОЛ',save:'Сейв / без гола',finish:'Финальный свисток',chances:'Удары',injuryNote:'Вероятность травмы: 1% за матч. Игрок восстановится к следующему матчу.'},
};
export default function LiveMatch({club,players,roles,preview,onComplete}){
 const {language}=useLanguage(),w=copy[language]||copy.en,f=playFeatures(language);
 const [match,dispatch]=useReducer((state,action)=>advanceLiveMatch(state,action,players),null,()=>{
  const season=ensureOpponentSquads(seasonForMatch(club),players,club.difficulty);
  return startLiveMatch({...club,roles,bench:benchSlots(club,players)},preview.opponent,season.squads?.[preview.opponent.id]?.lineup||[],preview.chances.win);
 });
 const done=useRef(false),[outId,setOutId]=useState(''),[inId,setInId]=useState('');
 useEffect(()=>{const timer=setInterval(()=>dispatch({type:'tick'}),1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(match.finished&&!done.current){done.current=true;onComplete(match);}},[match,onComplete]);
 const score=liveScore(match),lookup=new Map(players.map(p=>[p.id,p]));
 const review=match.review,pending=review||match.pending,injured=lookup.get(match.injured[0]);
 const selectedOut=outId||injured?.id||match.lineup[0];
 const substitutes=players.filter(p=>canSubstitute(match,selectedOut,p)&&!match.lineup.some(id=>(lookup.get(id)?.basePlayerId||id)===(p.basePlayerId||p.id)));
 return <div className="sim-player-overlay"><section className="arcade-panel live-match" role="dialog" aria-modal="true" aria-label={w.live}>
  <div className="live-match__score"><span>{club.name}</span><strong>{score.home} – {score.away}</strong><span>{preview.opponent.name}</span></div>
  <div className="live-match__clock"><strong>{match.minute}′ / 90′</strong><span>{w.live} · {Math.round(match.winChance*100)}%</span></div><progress value={match.minute} max={90} className="w-full"/>
  <p className="arcade-muted my-3 text-xs">{f.hint}</p>
  {injured&&match.lineup.includes(injured.id)&&<p className="arcade-card mb-3 text-rose-400">🚑 {injured.fullName} · {w.injury}</p>}
  {pending?<><h2 className="my-3 text-xl font-black">{pending.minute}′ · {review?f.review:pending.home?w.attack:w.defence} · {review?review.remaining:Math.max(0,5-(match.minute-pending.minute))} {f.seconds}</h2>
   <div className="live-match__duel">{[lookup.get(pending.attackerId),lookup.get(pending.keeperId)].map((p,i)=><div key={i}>{p&&<PlayerPhoto player={p}/>}<strong>{p?.fullName}</strong><small>{i===0?'⚽':'🧤'}</small></div>)}</div>
   {review&&<div className="manager-review-legend" role="status"><strong>{review.goal?'⚽ '+w.goal:'🧤 '+w.save}</strong><p>{f.reviewHint}</p><span className="zone-success">✓ {review.home?f.goalZone:f.saveZone}</span><span className="zone-blocked">× {review.home?f.savedZone:f.concedeZone}</span></div>}
   <div className="match-goal" data-review={Boolean(review)}>{Array.from({length:20},(_,cell)=>{const success=review?.cells.includes(cell),label=review?(success?(review.home?f.goalZone:f.saveZone):(review.home?f.savedZone:f.concedeZone)):'';return <button className="arcade-button arcade-secondary" key={cell} disabled={Boolean(review)} data-result={review?(success?'success':'blocked'):undefined} aria-pressed={review?review.choice===cell:undefined} aria-label={`${Math.floor(cell/5)+1}/${cell%5+1}${label?' '+label:''}`} onClick={()=>dispatch({type:'choose',cell})}>{cell+1}{review&&<span aria-hidden="true">{success?' ✓':' ×'}</span>}</button>;})}</div>
  </>:<p className="live-match__waiting">{w.waiting}</p>}
  <details className="my-4" open={Boolean(injured&&match.lineup.includes(injured.id))}><summary className="font-bold cursor-pointer">{w.subs} · {match.substitutions.length}/5</summary><div className="live-match__subs mt-3"><label>{w.out}<select className="arcade-input mt-1" value={selectedOut} onChange={e=>{setOutId(e.target.value);setInId('');}}>{match.lineup.map(id=><option key={id} value={id}>{lookup.get(id)?.fullName}{match.injured.includes(id)?' 🚑':''}</option>)}</select></label><label>{w.incoming}<select className="arcade-input mt-1" value={inId} onChange={e=>setInId(e.target.value)}><option value="">—</option>{substitutes.map(p=><option key={p.id} value={p.id}>{p.fullName} · {p.positions.join('/')}</option>)}</select></label><button className="arcade-button" disabled={!inId||!canSubstitute(match,selectedOut,lookup.get(inId))} onClick={()=>{dispatch({type:'substitute',outId:selectedOut,inId});setOutId('');setInId('');}}>{w.change}</button></div></details>
  <p className="arcade-muted text-xs">{w.injuryNote}</p><h3 className="font-bold mt-4">{w.chances} · {match.log.length}</h3>
  <ol className="live-match__log" aria-live="polite">{[...match.log].reverse().map((event,i)=><li key={i} className="arcade-card py-2 text-sm">{event.minute}′ {event.home?club.name:preview.opponent.name} · {event.attackerName} vs {event.keeperName} · {event.goal?`⚽ ${w.goal}`:w.save}</li>)}</ol>
 </section></div>;
}
