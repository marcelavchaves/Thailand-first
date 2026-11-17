import {getStore} from '@netlify/blobs';
export async function offlineSnapshotSettings(){const record=await getStore({name:'offline-snapshot-settings',consistency:'strong'}).getWithMetadata('visibility',{type:'json'});return {visible:(record?.data as {visible?:boolean}|undefined)?.visible!==false,revision:record?.etag||null};}
