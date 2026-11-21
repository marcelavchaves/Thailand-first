/** @returns {string|null} */
export function announcementUrl(value){
 const input=String(value||'').trim();if(!input||/\s/.test(input))return null;
 const address=/^[a-z][a-z0-9+.-]*:/i.test(input)?input:'https://'+input;
 try{const url=new URL(address);if(!['https:','http:','mailto:','tel:'].includes(url.protocol))return null;if(['https:','http:'].includes(url.protocol)&&!url.hostname)return null;return url.href.replace(/\(/g,'%28').replace(/\)/g,'%29');}catch{return null;}
}
/** @returns {Array<{text:string,url:string|null,start:number,end:number}>} */
export function announcementParts(value){
 const text=String(value||''),parts=[],pattern=/\[((?:\\.|[^\]\\\n])+)\]\(([^)\s]+)\)/g;let cursor=0,match;
 while((match=pattern.exec(text))){if(match.index>cursor)parts.push({text:text.slice(cursor,match.index),url:null,start:cursor,end:match.index});const url=announcementUrl(match[2]);parts.push({text:url?match[1].replace(/\\([\\[\]])/g,'$1'):match[0],url,start:match.index,end:pattern.lastIndex});cursor=pattern.lastIndex;}
 if(cursor<text.length)parts.push({text:text.slice(cursor),url:null,start:cursor,end:text.length});return parts;
}
export function formatAnnouncementLink(label,address){const text=String(label||'').replace(/\s+/g,' ').trim(),url=announcementUrl(address);if(!text)throw Error('Enter the words travelers should see.');if(!url)throw Error('Enter a valid web, email or phone link.');return '['+text.replace(/[\\[\]]/g,'\\$&')+']('+url+')';}
export function announcementPlainText(value){return announcementParts(value).map(part=>part.url?part.text+' ('+part.url+')':part.text).join('');}
