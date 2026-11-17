import type {Config} from '@netlify/functions';
import {getStore} from '@netlify/blobs';
import {hasTDSession,sameOrigin} from '../lib/td-auth';
import {offlineSnapshotSettings} from '../lib/offline-snapshot-settings';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export default async function handler(request:Request){try{
 if(request.method==='GET')return reply(await offlineSnapshotSettings());
 if(request.method!=='PUT')return reply({error:'Method not allowed.'},405);
 if(!sameOrigin(request))return reply({error:'Open this action from Wondercase.'},403);
 if(!await hasTDSession(request))return reply({error:'Sign in to TD Suitcase.'},401);
 const body=await request.json();if(typeof body.visible!=='boolean'||!(body.revision===null||typeof body.revision==='string'))return reply({error:'Choose shown or hidden.'},400);
 const saved=await getStore({name:'offline-snapshot-settings',consistency:'strong'}).setJSON('visibility',{visible:body.visible},body.revision===null?{onlyIfNew:true}:{onlyIfMatch:body.revision});
 if(!saved.modified)return reply({error:'This setting changed. Refresh before saving.'},409);
 return reply(await offlineSnapshotSettings());
}catch{return reply({error:'Unable to load or save snapshot visibility.'},503);}}
export const config:Config={path:'/api/offline-snapshot-settings'};
