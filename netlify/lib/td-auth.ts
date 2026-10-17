import {hasMasterAdmin} from './master-auth';
import {createHash,timingSafeEqual,scrypt as deriveKey,randomBytes} from 'node:crypto';
import {promisify} from 'node:util';
import {getStore} from '@netlify/blobs';
const scrypt=promisify(deriveKey);
type Credential={salt:string;hash:string;version:string};
const credentials=()=>getStore({name:'td-credentials',consistency:'strong'});
async function currentCredential(){return await credentials().get('password',{type:'json'}) as Credential|null;}
export async function tdPasswordConfigured(){return !!(await currentCredential())||!!Netlify.env.get('CHERVIL_NOTES_PASSWORD');}
export async function passwordVersion(){const saved=await currentCredential();return saved?.version||createHash('sha256').update(Netlify.env.get('CHERVIL_NOTES_PASSWORD')||'').digest('hex');}
export async function changeStoredPassword(current:string,next:string){
 const record=await credentials().getWithMetadata('password',{type:'json'});
 if(!await legacyPasswordMatches(current))return false;
 const salt=randomBytes(32).toString('hex');
 const hash=(await scrypt(next,salt,64) as Buffer).toString('hex');
 const saved=await credentials().setJSON('password',{salt,hash,version:randomBytes(32).toString('hex')},record?{onlyIfMatch:record.etag}:{onlyIfNew:true});
 return saved.modified;
}
import {getIdentityConfig,getUser} from '@netlify/identity';
export const TD_EMAIL=Netlify.env.get('TOUR_DIRECTOR_EMAIL')||'';
export const TD_ROLE='tour-director';
export function identityReady(){return !!getIdentityConfig()?.token;}
export async function legacyPasswordMatches(provided:unknown){
 if(typeof provided!=='string'||!provided||provided.length>200)return false;
 const saved=await currentCredential();
 if(saved)return timingSafeEqual(await scrypt(provided,saved.salt,64) as Buffer,Buffer.from(saved.hash,'hex'));
 const expected=Netlify.env.get('CHERVIL_NOTES_PASSWORD')||'';
 if(typeof provided!=='string'||!provided||!expected)return false;
 return timingSafeEqual(createHash('sha256').update(provided).digest(),createHash('sha256').update(expected).digest());
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export function isTourDirector(user:{email?:string;roles?:string[]}|null){return user?.email?.toLowerCase()===TD_EMAIL && user.roles?.includes(TD_ROLE)===true;}
export async function canEditAnnouncements(password?:unknown){
 if(await hasMasterAdmin())return true;
 // Preserve the existing notes workflow until Identity is activated.
 return legacyPasswordMatches(password);
}

// Keep the existing password workflow usable while Identity awaits activation.
// Opaque tokens are stored only as hashes, expire after eight hours and are
// invalidated by password changes or sign-out. Identity remains the primary path.
export async function hasTDSession(request:Request){
 if(await hasMasterAdmin())return true;
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-kd_td=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!token)return false;
 const {getStore}=await import('@netlify/blobs');
 const value:any=await getStore({name:'td-sessions',consistency:'strong'}).get(createHash('sha256').update(token).digest('hex'),{type:'json'});
 return value?.expires>Date.now()&&await tdPasswordConfigured()&&value?.version===await passwordVersion();
}
export async function passwordSessionCookie(request:Request,create=false){
 const {getStore}=await import('@netlify/blobs');const {randomBytes}=await import('node:crypto');
 const store=getStore({name:'td-sessions',consistency:'strong'});
 const old=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-kd_td=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(old)await store.delete(createHash('sha256').update(old).digest('hex'));
 const token=create?randomBytes(32).toString('hex'):'';
 if(create)await store.setJSON(createHash('sha256').update(token).digest('hex'),{expires:Date.now()+8*3600000,version:await passwordVersion()});
 return `__Host-kd_td=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${create?28800:0}`;
}

// Master reset replaces only the TD credential and revokes existing password sessions.
export async function resetTDPassword(next:string){
 const record=await credentials().getMetadata('password');
 const salt=randomBytes(32).toString('hex');
 const hash=(await scrypt(next,salt,64) as Buffer).toString('hex');
 const saved=await credentials().setJSON('password',{salt,hash,version:randomBytes(32).toString('hex')},record?{onlyIfMatch:record.etag}:{onlyIfNew:true});
 return saved.modified;
}
