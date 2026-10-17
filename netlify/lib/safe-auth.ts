import {createHash,timingSafeEqual,scrypt as deriveKey,randomBytes} from 'node:crypto';
import {promisify} from 'node:util';import {getStore} from '@netlify/blobs';
const scrypt=promisify(deriveKey);export const safeStore=(name:string)=>getStore({name:'traveler-safe-'+name,consistency:'strong'});
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export const username=(value:unknown)=>typeof value==='string'&&/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(value.trim().toLowerCase())?value.trim().toLowerCase():null;
export const validPin=(value:unknown):value is string=>typeof value==='string'&&/^\d{6}$/.test(value);
export async function pinHash(pin:string,salt:string){return (await scrypt(pin,salt,64) as Buffer).toString('hex');}
export async function pinMatches(pin:string,account:SafeAccount){return timingSafeEqual(Buffer.from(await pinHash(pin,account.salt),'hex'),Buffer.from(account.hash,'hex'));}
export type SafeAccount={id:string;username:string;safeId?:string;guestId?:string;nickname?:string;salt:string;hash:string;key:string;version:string;recoveryHash:string;failures:number;lockedUntil:number};
export async function safeSession(request:Request):Promise<SafeAccount|null>{
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-kd_safe=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;
 const session=await safeStore('sessions').get(digest(token),{type:'json'}) as {username:string;version:string;expires:number}|null;if(!session||session.expires<Date.now())return null;
 const account=await safeStore('accounts').get(session.username,{type:'json'}) as SafeAccount|null;return account?.version===session.version?account:null;
}
export async function safeCookie(request:Request,account?:SafeAccount){const old=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-kd_safe=([a-f0-9]{64})(?:;|$)/)?.[1];if(old)await safeStore('sessions').delete(digest(old));const token=account?randomBytes(32).toString('hex'):'';if(account)await safeStore('sessions').setJSON(digest(token),{username:account.username,version:account.version,expires:Date.now()+4*3600000});return `__Host-kd_safe=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${account?14400:0}`;}
