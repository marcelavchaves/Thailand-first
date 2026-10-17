import {readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('config/manifest-production.json','utf8'));
if(process.env.NEXT_PUBLIC_APP_ENV==='test'){
 Object.assign(manifest,JSON.parse(await readFile('public/manifest-test-v011.webmanifest','utf8')));
}
if(process.env.NEXT_PUBLIC_APP_ENV==='pretour'){
 manifest.name='Wondercase Pre-Tour Review · K&D102 Edition';
 manifest.short_name='Wondercase Review';
 manifest.description='Review copy for selecting pre-tour content.';
 manifest.theme_color='#315C4F';
}
await writeFile('public/manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
