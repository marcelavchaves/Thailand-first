import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
const dir=await mkdtemp(join(process.cwd(),'.manifest-grouping-'));
try{
 await build({entryPoints:['lib/hotel-manifest.ts'],outfile:join(dir,'lib.mjs'),bundle:true,platform:'node',format:'esm'});
 const {manifestDefaults,assignRoomGroup,removeRoomGroup,assignTravelGroup,removeTravelGroup,applyManifestToAllHotels,checkExport}=await import(join(dir,'lib.mjs'));
 const guests=['a','b','c','d'].map(id=>({id,name:'Guest '+id}));let data=manifestDefaults(guests);
 data.hotels['hotel-0'].entries.a.notes='Keep guest note';data.hotels['hotel-0'].entries.a.important='Important guest note';data.guests.a.preferredName='Preferred';
 data=assignRoomGroup(data,'hotel-0',null,'Duncans',['a','b'],'King/Queen');
 data=assignRoomGroup(data,'hotel-0',null,'Chaves',['c','d'],'Two beds');
 assert.equal(data.hotels['hotel-0'].entries.b.room,'Duncans');assert.equal(data.hotels['hotel-0'].entries.c.bed,'Two beds');assert.equal(data.hotels['hotel-1'].entries.a.room,'');
 assert.equal(data.hotels['hotel-0'].entries.a.notes,'Keep guest note');assert.equal(data.hotels['hotel-0'].entries.a.important,'Important guest note');
 assert.throws(()=>assignRoomGroup(data,'hotel-0',null,'Other',['a'],''),/current room/);
 assert.throws(()=>assignRoomGroup(data,'hotel-0',null,'Duncans',['c'],''),/already exists/);
 assert.throws(()=>assignRoomGroup(data,'hotel-0',null,'Other',['unknown'],''),/current guest list/);
 assert.throws(()=>assignRoomGroup(data,'hotel-0',null,'Other',['a','a'],''),/one to four/);
 data=assignTravelGroup(data,'hotel-0',null,'Duncans and Chaves',['Duncans','Chaves']);
 assert(guests.every(g=>data.guests[g.id].travelGroup==='Duncans and Chaves'));
 data=assignTravelGroup(data,'hotel-0','Duncans and Chaves','Duncan companions',['Duncans']);
 assert.equal(data.guests.a.travelGroup,'Duncan companions');assert.equal(data.guests.c.travelGroup,'');assert.equal(data.hotels['hotel-0'].entries.d.room,'Chaves');
 assert.throws(()=>assignTravelGroup(data,'hotel-0',null,'Other',['Missing']),/Choose room groups/);
 data=assignRoomGroup(data,'hotel-0','Duncans','Duncan room',['a','b'],'Two beds');assert.equal(data.guests.a.travelGroup,'Duncan companions');assert.equal(data.hotels['hotel-0'].entries.b.room,'Duncan room');
 data.hotels['hotel-0'].notes='Copy hotel notes';data.hotels['hotel-0'].important='Copy hotel important note';
 const dates=Object.fromEntries(Object.entries(data.hotels).map(([id,h])=>[id,[h.arrival,h.departure]]));
 const before=structuredClone(data);data=applyManifestToAllHotels(data,'hotel-0');
 for(const [id,h] of Object.entries(data.hotels)){assert.deepEqual([h.arrival,h.departure],dates[id]);assert.deepEqual(h.entries,data.hotels['hotel-0'].entries);assert.equal(h.notes,'Copy hotel notes');assert.equal(h.important,'Copy hotel important note');checkExport(data,id,guests);}
 assert.equal(data.guests.a.preferredName,'Preferred');assert.equal(data.guests.a.travelGroup,'Duncan companions');
 data.hotels['hotel-1'].entries.a.notes='Independent later edit';assert.equal(data.hotels['hotel-0'].entries.a.notes,'Keep guest note');assert.equal(before.hotels['hotel-1'].entries.a.room,'');
 const removed=removeRoomGroup(data,'hotel-0','Duncan room');assert.equal(removed.hotels['hotel-0'].entries.a.room,'');assert.equal(removed.hotels['hotel-0'].entries.a.notes,'Keep guest note');assert.equal(removed.guests.a.travelGroup,'Duncan companions');
 assert.equal(removeTravelGroup(data,'Duncan companions').guests.a.travelGroup,'');assert.equal(data.hotels['hotel-0'].entries.a.room,'Duncan room');
 console.log('PASS manifest grouping: guest selection, unique room membership, group renaming, whole-room travel links, independent notes, and apply-to-all with stay dates preserved.');
}finally{await rm(dir,{recursive:true,force:true});}
