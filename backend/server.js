import express from 'express';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {existsSync,readFileSync} from 'node:fs';
import {createAccountRouter} from './routes/accounts.js';
import {openRuntimeAccountStore} from './utils/runtimeAccountStore.js';
import {loadEnvFile} from 'node:process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(existsSync(resolve(root,'.env')))loadEnvFile(resolve(root,'.env'));
const {db,accountStorage,shared}=await openRuntimeAccountStore();
const app=express();
app.disable('x-powered-by');app.use(express.json({limit:'4mb'}));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'club-simulator',accountStorage,sharedAccounts:shared,features:{friends:true,onlineMatches:true}}));
const players=JSON.parse(readFileSync(resolve(root,'public/game-data/players.json'),'utf8'));
app.get('/api/players',(req,res)=>res.json({data:players,pagination:{page:1,totalPages:1,total:players.length}}));
const accounts=createAccountRouter(db);app.use('/api/auth',accounts);
app.use('/api',(req,res)=>res.status(404).json({code:'notFound'}));
if(existsSync(resolve(root,'dist/index.html'))){app.use(express.static(resolve(root,'dist')));app.get(/.*/,(req,res)=>res.sendFile(resolve(root,'dist/index.html')));}
app.use((error,req,res,next)=>{if(res.headersSent)return next(error);console.error(error.message);res.status(error.status||500).json({code:'generic'});});
const server=app.listen(Number(process.env.PORT||5050),'0.0.0.0',()=>console.log(`Club Simulator: http://localhost:${server.address().port}`));
async function close(){await accounts.onlineMatches.close();server.close(()=>{db.close();process.exit(0);});}
process.once('SIGINT',close);process.once('SIGTERM',close);
