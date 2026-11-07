import type {Config} from '@netlify/functions';
export default async function handler(){return Response.json({error:'Invitations are no longer needed. Sign in to Traveler Safe with email/password or Google.'},{status:410,headers:{'Cache-Control':'no-store'}});}
export const config:Config={path:'/api/safe-invitations'};
