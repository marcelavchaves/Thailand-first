import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {importedSchedule,importedReleaseEntries,TOUR_IMPORT_VERSION} from '../shared/tour-import.mjs';
const days=JSON.parse(await readFile('app/itinerary.json','utf8'));
const snapshot=JSON.parse(await readFile('netlify/data/itinerary-content.json','utf8'));
assert.deepEqual(snapshot.data.days,days);
assert.equal(days.length,16);
// Changes from the newly supplied official itinerary.
assert.equal(days[1].events.find(e=>e[1].includes('Water Puppet'))[0],'15:45');
assert(days[2].events.some(e=>e[1].includes('VN163/8:05-9:30')));
assert.deepEqual(days[3].events.find(e=>e[0]==='14:00'),['14:00','Drive to Danang.']);
assert(!days[4].events.some(e=>e[0]==='15:30'));
assert(days[5].events.some(e=>e[1].includes('VN113/9:55-11:30')));
assert(days[7].events.some(e=>e[1].includes('K6 825 13:00/14:20')));
assert.equal(days[8].events[0][0],'4:30');
assert(days[10].events.some(e=>e[1].includes('Intercontinental at the elephant sanctuary')));
assert.equal(days[15].events[0][1],'Safe travel home! See you soon, I hope!');
// A published import replaces outdated deployed edits, then respects later TD edits/hides.
const stale={importVersion:'kd103-cher-sm23-published-v2',events:[['OLD','Old schedule']],note:''};
assert.deepEqual(importedSchedule(snapshot,6,stale).events,days[1].events);
const edit={importVersion:TOUR_IMPORT_VERSION,events:[['8:00','New TD edit']],note:'Current'};
assert.deepEqual(importedSchedule(snapshot,6,edit),edit);
assert.equal(importedReleaseEntries({'schedule-6':{visible:false,deleted:true}})['schedule-6'].visible,true);
const hidden={importVersion:TOUR_IMPORT_VERSION,visible:false,deleted:false};
assert.deepEqual(importedReleaseEntries({'schedule-6':hidden})['schedule-6'],hidden);
console.log('PASS official itinerary changes, export synchronization, Day 16 retained, replacement of outdated schedules and preservation of subsequent TD edits/hides.');
