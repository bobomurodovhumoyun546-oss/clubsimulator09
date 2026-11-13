import {useEffect,useRef,useState} from 'react';
import {initialClub} from '../features/clubSimulator';
import {readLocal,writeLocal} from '../games/core/storage';
import {accountApi} from '../features/accountApi';
import {restoreClub} from './saveGame';
export function useClubState(players,storageKey,userId){
 const [club,setClub]=useState(()=>{try{return restoreClub(readLocal(storageKey,null)||readLocal('club-simulator-guest',null),players);}catch{return restoreClub(initialClub(players),players);}});
 const [ready,setReady]=useState(!userId),[status,setStatus]=useState(userId?'loading':'local');
 const lastSaved=useRef(''),queue=useRef(Promise.resolve()),connected=useRef(!userId);
 useEffect(()=>{
  if(!userId)return;
  let active=true;
  accountApi('club-save').then(({club:remote})=>{
   if(!active)return;
   connected.current=true;
   if(remote){const restored=restoreClub(remote,players);lastSaved.current=JSON.stringify(restored);setClub(restored);writeLocal(storageKey,restored);}
   setStatus(remote?'saved':'saving');
  }).catch(()=>{if(active)setStatus('offline');}).finally(()=>{if(active)setReady(true);});
  return()=>{active=false;};
 },[userId,storageKey,players]);
 useEffect(()=>{
  if(!userId||!ready)return;
  const serialized=JSON.stringify(club);if(serialized===lastSaved.current)return;
  let active=true;
  const timer=setTimeout(()=>{
   if(active)setStatus('saving');
   queue.current=queue.current.catch(()=>{}).then(async()=>{
    // Do not overwrite an existing remote club following a failed initial load.
    if(!connected.current){const {club:remote}=await accountApi('club-save');if(remote)throw new Error('Reconnect before saving');connected.current=true;}
    await accountApi('club-save',{club:JSON.parse(serialized)});lastSaved.current=serialized;
    if(active)setStatus('saved');
   }).catch(()=>{if(active)setStatus('offline');});
  },650);
  return()=>{active=false;clearTimeout(timer);};
 },[club,userId,ready]);
 return {club,setClub,ready,status};
}
