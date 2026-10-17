import type {Config} from '@netlify/functions';
import {readFile} from 'node:fs/promises';
export default async function handler(){const bytes=await readFile(process.cwd()+'/public/documents/vietnam-cambodia-thailand-itinerary.pdf');return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="Vietnam-Cambodia-Thailand-Itinerary.pdf"','Cache-Control':'no-cache'}});}
export const config:Config={path:['/api/current-itinerary','/kingdoms-and-dragons-itinerary.pdf','/kingdoms-and-dragons-itinerary-repaired.pdf'],preferStatic:false};
