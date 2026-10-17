import {admin,getIdentityConfig,type User} from '@netlify/identity';
export const MASTER_EMAIL=()=>Netlify.env.get('MASTER_ADMIN_EMAIL')?.trim().toLowerCase()||'';
export const MASTER_ROLE='master-admin';
export const masterIdentityReady=()=>!!getIdentityConfig()?.url;
export function isMasterAdmin(user:{email?:string;roles?:string[];confirmedAt?:string}|null){return !!MASTER_EMAIL()&&user?.email?.toLowerCase()===MASTER_EMAIL()&&!!user.confirmedAt&&user.roles?.includes(MASTER_ROLE)===true;}
// Identity's server getUser() prefers the operator token over the session cookie.
// Verify the visitor's cookie with Identity instead; never use the operator as a visitor.
export async function masterSessionUser():Promise<User|null>{
 const config=getIdentityConfig();
 const token=Netlify.context?.cookies?.get('nf_jwt');
 if(!config?.url||!token)return null;
 const response=await fetch(`${config.url.replace(/\/$/,'')}/user`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(5000)});
 if(response.status===401||response.status===403)return null;
 if(!response.ok)throw new Error('Identity session verification unavailable.');
 const user=await response.json();
 return {id:user.id,email:user.email,confirmedAt:user.confirmed_at,roles:user.app_metadata?.roles||[],appMetadata:user.app_metadata||{},userMetadata:user.user_metadata||{}} as User;
}
export async function hasMasterAdmin(){const user=await masterSessionUser();if(!user?.id||user.email?.toLowerCase()!==MASTER_EMAIL())return false;return isMasterAdmin(getIdentityConfig()?.token?await admin.getUser(user.id):user);}
