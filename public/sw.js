const CACHE = "vietnam-cambodia-thailand-20261116-offline-reader-v1";
const READER_CACHE = "wondercase-offline-reader-v1";
const ASSETS = ["/", "/offline-reader", "/manifest.webmanifest", "/icon-v2-192.png", "/apple-touch-icon-v2.png"];
const readerPath = path => ["/offline-reader", "/offline-reader/", "/offline-reader.html"].includes(path);
const allowedReaderAsset = url => url.origin === self.location.origin && (readerPath(url.pathname) || url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/booklet-assets/") || url.pathname === "/guest-scan/pdf.worker.min.mjs");
async function savedReader(){const cache=await caches.open(READER_CACHE);return cache.match("/offline-reader");}
self.addEventListener("message",event=>{
 if(event.data?.type!=="SAVE_OFFLINE_READER")return;
 event.waitUntil((async()=>{try{
  const urls=[...new Set(event.data.urls||[])].map(value=>new URL(value,self.location.origin));
  if(!urls.length||urls.length>250||urls.some(url=>!allowedReaderAsset(url)))throw Error("Unable to save the reader files.");
  const cache=await caches.open(READER_CACHE);
  // Store every dependency first; replace the pinned HTML only once its files are available.
  await Promise.all(urls.filter(url=>!readerPath(url.pathname)).map(async url=>{const response=await fetch(url.href,{cache:"reload"});if(!response.ok)throw Error("A required reader file could not be downloaded. Please try again.");await cache.put(url.href,response);}));
  const response=await fetch("/offline-reader",{cache:"reload"});if(!response.ok)throw Error("Unable to save the offline reader page.");
  await cache.put("/offline-reader",response.clone());await cache.put("/offline-reader/",response.clone());await cache.put("/offline-reader.html",response);
  event.ports[0]?.postMessage({ok:true});
 }catch(error){event.ports[0]?.postMessage({ok:false,error:error.message||"Unable to save the offline reader."});}})());
});
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(ASSETS.map(url=>c.add(url).catch(()=>{}))))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE && k !== READER_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/identity") || url.pathname.endsWith(".pdf"))
  )
    return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && !e.request.url.endsWith(".pdf")) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(async () => {
        const reader=await savedReader();
        if(e.request.mode === "navigate" && reader){
          if(readerPath(url.pathname))return reader;
          if(url.pathname === "/")return Response.redirect(new URL("/offline-reader",self.location.origin).href,302);
        }
        const pinned=await(await caches.open(READER_CACHE)).match(e.request);
        return pinned || await caches.match(e.request) || (e.request.mode === "navigate" ? await caches.match("/") : Response.error());
      }),
  );
});

self.addEventListener("push",event=>{
  let payload={};try{payload=event.data?.json()||{};}catch{}
  event.waitUntil(self.registration.showNotification(payload.title||"Xavier updated the journey",{body:payload.body||"Open the app to see the change.",icon:"/icon-v2-192.png",badge:"/icon-v2-192.png",tag:payload.id||"xavier-update",data:{url:payload.url||"/"}}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||"/",self.location.origin);
  if(url.origin!==self.location.origin)return;
  event.waitUntil(self.clients.openWindow(url.href));
});
