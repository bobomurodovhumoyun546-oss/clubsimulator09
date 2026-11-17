import {useEffect,useRef,useState} from 'react';
import {initialClub} from '../features/clubSimulator';
import {readLocal,writeLocal} from '../games/core/storage';
import {accountApi} from '../features/accountApi';
import {restoreClub} from './saveGame';
export function useClubState(players,storageKey,userId){
 const [club,setClub]=useState(()=>{try{return restoreClub(readLocal(storageKey,null)||(!userId?readLocal('club-simulator-guest',null):null),players);}catch{return restoreClub(initialClub(players),players);}});
 const [ready,setReady]=useState(!userId),[status,setStatus]=useState(userId?'loading':'local');
 const lastSaved=useRef(''),version=useRef(undefined),queue=useRef(Promise.resolve()),connected=useRef(!userId),latest=useRef(club),saving=useRef(false);
 useEffect(()=>{latest.current=club;},[club]);
 useEffect(()=>{
  if(!userId)return;let active=true;
  accountApi('club-save').then(({club:remote,updated})=>{
   if(!active)return;
   // Validate before permitting writes. A restore failure must never replace cloud data.
   const restored=remote?restoreClub(remote,players):null;
   if(restored){lastSaved.current=JSON.stringify(restored);setClub(restored);writeLocal(storageKey,restored);}
   version.current=updated??null;connected.current=true;setStatus(remote?'saved':'saving');
  }).catch(()=>{connected.current=false;if(active)setStatus('offline');}).finally(()=>{if(active)setReady(true);});
  return()=>{active=false;};
 },[userId,storageKey,players]);
 useEffect(()=>{
  if(!userId||!ready)return;
  const serialized=JSON.stringify(club);if(serialized===lastSaved.current)return;let active=true;
  const timer=setTimeout(()=>{
   if(active)setStatus('saving');
   queue.current=queue.current.catch(()=>{}).then(async()=>{
    saving.current=true;
    try{
     if(!connected.current){
      const {club:remote,updated}=await accountApi('club-save');
      if(remote){const restored=restoreClub(remote,players);version.current=updated??null;lastSaved.current=JSON.stringify(restored);connected.current=true;if(active){setClub(restored);writeLocal(storageKey,restored);setStatus('saved');}return;}
      version.current=null;connected.current=true;
     }
     const result=await accountApi('club-save',{club:JSON.parse(serialized),expectedUpdated:version.current});version.current=result.updated;lastSaved.current=serialized;if(active)setStatus('saved');
    }catch(error){
     connected.current=false;
     if(error.code==='saveConflict'){
      try{const {club:remote,updated}=await accountApi('club-save');if(remote){const restored=restoreClub(remote,players);version.current=updated??null;lastSaved.current=JSON.stringify(restored);connected.current=true;if(active){setClub(restored);writeLocal(storageKey,restored);setStatus('saved');}return;}}catch{/* Remain offline until the shared save can be read. */}
     }
     if(active)setStatus('offline');
    }finally{saving.current=false;}
   });
  },650);
  return()=>{active=false;clearTimeout(timer);};
 },[club,userId,ready,players,storageKey]);
 useEffect(()=>{
  if(!userId||!ready)return;let active=true,pulling=false;
  async function refresh(){
   if(document.hidden||saving.current||pulling)return;
   const before=JSON.stringify(latest.current),beforeVersion=version.current;
   if(connected.current&&before!==lastSaved.current)return;
   pulling=true;
   try{const {club:remote,updated}=await accountApi('club-save');if(connected.current&&updated===beforeVersion)return;if(!active||saving.current||JSON.stringify(latest.current)!==before||version.current!==beforeVersion)return;
    if(remote){const restored=restoreClub(remote,players);version.current=updated??null;lastSaved.current=JSON.stringify(restored);connected.current=true;setClub(restored);writeLocal(storageKey,restored);setStatus('saved');}
    else if(!connected.current){version.current=null;connected.current=true;setClub(current=>({...current}));}
   }catch{/* Keep the cached squad; never use a different account database. */}finally{pulling=false;}
  }
  const onVisible=()=>{if(!document.hidden)void refresh();};window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',onVisible);const timer=setInterval(refresh,15000);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',onVisible);};
 },[userId,ready,players,storageKey]);
 return {club,setClub,ready,status};
}
