(()=>{
const style=document.createElement('style');style.textContent='html,body{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}.xavier-profile-portrait{visibility:hidden!important}.director-photo-access{background:#e8ede4!important;position:relative}.director-photo-access:after{content:"TD";position:absolute;inset:0;display:grid;place-items:center;color:#4F6B5D;font:20px Montserrat}.director-about{display:none!important}';document.head.appendChild(style);
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
while(node=walker.nextNode()){if(['SCRIPT','STYLE'].includes(node.parentElement?.tagName))continue;let s=node.textContent;
s=s.replace(/Xavier Brunelle|Xav(?:ier)?(?:’s|'s)?|Brunelle/gi,m=>m.endsWith('s')?'TD’s':'TD');
s=s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'TD contact email').replace(/\+?\d[\d ()-]{8,}\d/g,'TD contact details');
s=s.replace(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:[–-]\d{1,2})?(?:,\s*\d{4})?/g,'Your journey day');
s=s.replace(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:[–-](?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+)?\d{1,2})?(?:,\s*\d{4})?/g,'Your journey dates');
s=s.replace(/\b20\d{2}\b/g,'').replace(/Your journey starts in \d+ days/g,'Your journey at a glance');
if(s!==node.textContent)node.textContent=s;
}
document.querySelectorAll('.director-contact-links a span').forEach(x=>x.textContent='Your TD’s contact details');
})()
