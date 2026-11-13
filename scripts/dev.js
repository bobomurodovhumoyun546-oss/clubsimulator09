import {spawn} from 'node:child_process';
import process from 'node:process';
import {createServer} from 'vite';
const backend=spawn(process.execPath,['backend/server.js'],{stdio:'inherit',windowsHide:true,env:{...process.env,PORT:'5050'}});
const frontend=await createServer();await frontend.listen();frontend.printUrls();
backend.on('exit',code=>{if(code){console.error('Account server stopped:',code);void close(code);}});
async function close(code=0){await frontend.close();backend.kill();process.exit(code);}
process.once('SIGINT',()=>void close());process.once('SIGTERM',()=>void close());
