import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
const temp=await mkdtemp(join(process.cwd(),'.share-tests-'));
try{
 await build({entryPoints:['app/MealChoicesShare.tsx'],outfile:join(temp,'share.mjs'),bundle:true,platform:'node',format:'esm',external:['react']});
 const {mealShareText}=await import(join(temp,'share.mjs'));
 const submission={selections:{vedana:{main:'main-1'}},dietary:'New global note',status:'draft',updatedAt:'2026-11-01',submittedAt:null,mealStates:{vedana:{status:'submitted',dietary:'Saved peanut allergy',updatedAt:'2026-11-01',submittedAt:'2026-11-01'}},audit:[{actor:{label:'private secret history'}}],pin:'0123',accessToken:'private-token'};
 const one=mealShareText('Poppy Petal',submission,'vedana');
 assert(one.includes('Poppy Petal'));assert(one.includes('Grilled Fish'));assert(one.includes('Status: Submitted'));assert(one.includes('Saved peanut allergy'));assert(!one.includes('New global note'));assert(!one.includes('Lakorn'));assert(!one.includes('0123'));assert(!one.includes('private-token'));assert(!one.includes('private secret history'));
 assert(!mealShareText('Poppy',submission,'all',false).includes('Saved peanut allergy'));
 const all=mealShareText('Poppy',submission);assert(all.includes('Lakorn'));assert(all.includes('No choice saved'));assert(all.includes('Not submitted'));assert(all.includes('Sharing does not submit'));
 assert(mealShareText('Poppy',null).includes('No choice saved'));
 console.log('PASS meal sharing: saved per-meal choices/status/dietary snapshots, single/all menus, optional dietary exclusion, no credentials/history, missing choices labeled.');
}finally{await rm(temp,{recursive:true,force:true});}
