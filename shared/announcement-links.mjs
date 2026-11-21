/** @returns {string|null} */
export function announcementUrl(value){
 const input=String(value||'').trim();if(!input||/\s/.test(input))return null;
 const address=/^[a-z][a-z0-9+.-]*:/i.test(input)?input:'https://'+input;
 try{const url=new URL(address);if(!['https:','http:','mailto:','tel:'].includes(url.protocol))return null;if(['https:','http:'].includes(url.protocol)&&!url.hostname)return null;return url.href.replace(/\(/g,'%28').replace(/\)/g,'%29');}catch{return null;}
}
/** @typedef {{text:string,url:string|null,start:number,end:number,automatic?:boolean}} AnnouncementPart */
/** @returns {AnnouncementPart[]} */
function automaticParts(text,offset){
 const result=[],pattern=/(?:https?:\/\/|www\.)[^\s<>"`]+|[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)+[a-z]{2,63}\b|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b(?:\/[^\s<>"`]*)?/gi;let cursor=0,match;
 while((match=pattern.exec(text))){if(match.index>0&&/[\w@/:.%-]/.test(text[match.index-1]))continue;let address=match[0].replace(/[.,;:!?]+$/,'');
  for(const [open,close]of [['(',')'],['[',']'],['{','}']])while(address.endsWith(close)&&address.split(close).length>address.split(open).length)address=address.slice(0,-1);
  const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address),url=announcementUrl(email?'mailto:'+address:address);if(!url||!address)continue;
  if(match.index>cursor)result.push({text:text.slice(cursor,match.index),url:null,start:offset+cursor,end:offset+match.index});
  const end=match.index+address.length;result.push({text:address,url,start:offset+match.index,end:offset+end,automatic:true});cursor=end;
 }
 if(cursor<text.length)result.push({text:text.slice(cursor),url:null,start:offset+cursor,end:offset+text.length});return result;
}
/** @returns {AnnouncementPart[]} */
export function announcementParts(value){
 const text=String(value||''),parts=[],pattern=/\[((?:\\.|[^\]\\\n])+)\]\(([^)\s]+)\)/g;let cursor=0,match;
 while((match=pattern.exec(text))){if(match.index>cursor)parts.push(...automaticParts(text.slice(cursor,match.index),cursor));const url=announcementUrl(match[2]);parts.push({text:url?match[1].replace(/\\([\\[\]])/g,'$1'):match[0],url,start:match.index,end:pattern.lastIndex});cursor=pattern.lastIndex;}
 if(cursor<text.length)parts.push(...automaticParts(text.slice(cursor),cursor));return parts;
}
export function formatAnnouncementLink(label,address){const text=String(label||'').replace(/\s+/g,' ').trim(),url=announcementUrl(address);if(!text)throw Error('Enter the words travelers should see.');if(!url)throw Error('Enter a valid web, email or phone link.');return '['+text.replace(/[\\[\]]/g,'\\$&')+']('+url+')';}
export function announcementPlainText(value){return announcementParts(value).map(part=>part.url&&!part.automatic?part.text+' ('+part.url+')':part.text).join('');}
