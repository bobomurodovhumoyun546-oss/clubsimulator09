import {openRemoteAccountStore} from './remoteAccountStore.js';
import {openAccountStore} from './accountStore.js';
// Shared accounts are the default. Never silently fork production into a local DB.
export async function openRuntimeAccountStore({env=process.env,openRemote=openRemoteAccountStore,openLocal=openAccountStore}={}){
 if(env.CLUB_ACCOUNT_STORAGE==='sqlite')return {db:openLocal(),accountStorage:'sqlite',shared:false};
 if(!env.TURSO_DATABASE_URL||!env.TURSO_AUTH_TOKEN)throw new Error('Shared account database is required. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to the same database used by Vercel. Isolated development only: CLUB_ACCOUNT_STORAGE=sqlite.');
 return {db:await openRemote({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN}),accountStorage:'turso',shared:true};
}
