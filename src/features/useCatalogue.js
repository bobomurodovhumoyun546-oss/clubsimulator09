import { useEffect,useState } from 'react';
import { loadPlayers } from '../games/core/loadPlayers';
export function useCatalogue(){
 const [state,setState]=useState({players:[],loading:true,error:false});
 useEffect(()=>{let active=true;loadPlayers().then(({players})=>{if(active)setState({players,loading:false,error:false});}).catch(()=>{if(active)setState({players:[],loading:false,error:true});});return()=>{active=false;};},[]);
 return state;
}
