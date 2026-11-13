import { useEffect, useState } from 'react';
import { AuthContext } from './context';
import { accountApi } from '../features/accountApi';
import { readLocal,writeLocal } from '../games/core/storage';
async function request(path,body){return (await accountApi(path,body)).user;}
export default function AuthProvider({children}){
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
  const [syncError,setSyncError]=useState(false);
  useEffect(()=>{let active=true;request('me').then(user=>{if(active)setUser(user);}).catch(()=>{}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  async function authenticate(path,body){const user=await request(path,body);setUser(user);return user;}
  useEffect(()=>{
    if(!user?.id)return;
    const key=`pending-results-${user.id}`;let active=true,syncing=false;
    let pending=readLocal(key,[]);if(!Array.isArray(pending))pending=[];
    async function flush(){
      if(syncing)return;syncing=true;
      try{while(active&&pending.length){const item=pending[0],result=await accountApi('results',item);if(active)setUser(result.user);pending=pending.filter(r=>r.id!==item.id);writeLocal(key,pending);}if(active)setSyncError(false);}
      catch{if(active)setSyncError(true);}finally{syncing=false;}
    }
    const onResult=event=>{pending=[...pending,event.detail].slice(-100);writeLocal(key,pending);void flush();};
    window.addEventListener('balliq-result',onResult);window.addEventListener('online',flush);void flush();
    return()=>{active=false;window.removeEventListener('balliq-result',onResult);window.removeEventListener('online',flush);};
  },[user?.id]);
  return <AuthContext.Provider value={{user,loading,syncError,login:body=>authenticate('login',body),signup:body=>authenticate('signup',body),logout:()=>authenticate('logout',{}),updateProfile:body=>authenticate('profile',body),refresh:()=>authenticate('me')}}>{children}</AuthContext.Provider>;
}
