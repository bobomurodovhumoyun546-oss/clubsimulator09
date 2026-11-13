import ScoringLeaders from './ScoringLeaders';
import {currentSeason} from '../features/clubSeason';
import {ensureOpponentSquads} from '../features/opponentSquads';
import {playerOVR} from '../features/playerRatings';
import {useEffect,useState} from 'react';
import {useLanguage} from '../i18n/context';
import {useAuth} from '../auth/context';
import {accountApi} from '../features/accountApi';
import {clubRecord,leagueStandings} from '../features/clubLeague';
export default function ClubLeague({club,active,onMembers,players=[]}){
 const {t}=useLanguage(),{user}=useAuth();
 const [clubs,setClubs]=useState([]),[error,setError]=useState(false),[syncError,setSyncError]=useState(false),[retry,setRetry]=useState(0);
 const record=JSON.stringify(clubRecord(club));
 useEffect(()=>{
  if(!user?.id)return;
  let live=true;const timer=setTimeout(()=>{accountApi('club',JSON.parse(record)).then(()=>{if(live)setSyncError(false);}).catch(()=>{if(live)setSyncError(true);});},400);
  return()=>{live=false;clearTimeout(timer);};
 },[user?.id,record,retry]);
 useEffect(()=>{
  let live=true;
  const refresh=()=>accountApi('clubs').then(data=>{if(live){setClubs(data.clubs||[]);onMembers?.((data.clubs||[]).filter(c=>c.id!==user?.id).map(({id,name,owner})=>({id,name,owner})));setError(false);}}).catch(()=>{if(live)setError(true);});
  void refresh();const interval=setInterval(refresh,30000);
  return()=>{live=false;clearInterval(interval);};
 },[retry,onMembers,user?.id]);
 if(!active)return null;
 const season=ensureOpponentSquads(currentSeason(club),players,club.difficulty);
 const lookup=new Map(players.map(p=>[p.id,p]));
 const rows=leagueStandings(clubs,club,user?.id);
 return <section className="arcade-panel"><h2 className="text-2xl font-black">{t('standings')} · {rows.length} · {t('leagueSeason')} {club.season?.number||1}</h2><p className="arcade-muted my-3 text-sm">{t('leagueIntro')}</p>{(error||syncError)&&<p role="status" className="my-3">{t('leagueSyncError')} <button className="underline" onClick={()=>setRetry(n=>n+1)}>{t('retryLeague')}</button></p>}<div className="league-scroll"><table className="league-table"><thead><tr>{['#','clubName','matchesPlayed','wins','draws','losses','goalsFor','goalsAgainst','goalDifference','points'].map(key=><th key={key} scope="col">{key==='#'?'#':t(key)}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id} data-own={row.id===(user?.id||'guest')}><td>{i+1}</td><th scope="row">{row.name} <small className="arcade-muted">{row.ai?'AI':row.id===(user?.id||'guest')?t('yourClub'):row.owner}</small></th>{[row.played,row.wins,row.draws,row.losses,row.goalsFor,row.goalsAgainst,row.goalDifference,row.points].map((n,j)=><td key={j}>{n}</td>)}</tr>)}</tbody></table></div><ScoringLeaders season={season}/><section className="mt-6"><h3 className="mb-4 text-lg font-black">{t('opponentSquads')}</h3><div className="opponent-squads">{season.opponents.map(opponent=>{const squad=season.squads?.[opponent.id];return squad&&<details className="arcade-card" key={opponent.id}><summary>{opponent.name} · OVR {squad.overall}</summary><ul className="mt-3 space-y-2">{squad.lineup.map(item=>{const p=lookup.get(item.id);return p&&<li className="flex justify-between gap-3 text-sm" key={item.id}><span>{p.fullName}<small className="arcade-muted block">{item.role} · {playerOVR(p)} + {item.training}</small></span><strong>{playerOVR(p,item.training)}</strong></li>;})}</ul></details>;})}</div></section></section>;
}
