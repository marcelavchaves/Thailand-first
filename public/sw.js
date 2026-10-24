const CACHE = "vietnam-cambodia-thailand-20261116-v3",
  ASSETS = [
    "/",
    "/manifest.webmanifest",
    "/manifest-live-v028.webmanifest",
    "/icons/kingdoms-dragons-live-180.png",
    "/icons/kingdoms-dragons-live-192.png",
    "/icons/kingdoms-dragons-live-512.png",
    "/manifest-test-v011.webmanifest",
    "/icons/kd102-test-v011-192.png",
    "/icons/kd102-test-v011-180.png",
    "/icons/kd102-test-v011-512.png",
    "/brand/main-icon.png",
    "/brand/icon-board.jpeg",
    "/fonts/montserrat-400.ttf",
    "/fonts/montserrat-500.ttf",
    "/fonts/montserrat-600.ttf",
    "/fonts/montserrat-700.ttf",
    "/apple-touch-icon-v2.png",
    "/icon-v2-192.png",
    "/images/app-icon-v2-1024.png",
    "/images/agency-emblem.png",
    "/images/singapore.jpg",
    "/images/java.jpg",
    "/images/bali.jpg",
    "/images/komodo.jpg",
    "/images/journey-map.png",
    "/images/approved-home-banner.png",
    "/documents/xavier-java/IMG_8806.jpeg",
    "/documents/xavier-java/IMG_8807.jpeg",
    "/documents/xavier-java/IMG_8808.jpeg",
    "/documents/xavier-java/IMG_8809.jpeg",
  ];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
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
      .catch(() =>
        caches
          .match(e.request)
          .then(
            (r) =>
              r ||
              (e.request.mode === "navigate"
                ? caches.match("/")
                : Response.error()),
          ),
      ),
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
