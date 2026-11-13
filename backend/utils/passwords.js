import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive=promisify(scrypt);
const options={N:32768,r:8,p:1,maxmem:64*1024*1024};
export async function hashPassword(password){
  const salt=randomBytes(16).toString('hex');
  const key=await derive(password,salt,64,options);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password,stored){
  if(!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored||''))return false;
  const [,salt,hash]=stored.split(':');
  const key=await derive(password,salt,64,options);
  return timingSafeEqual(key,Buffer.from(hash,'hex'));
}
