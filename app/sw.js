const CACHE_NAME = "renren-100-roots-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./roots-data.js",
  "./manifest.webmanifest",
  "./assets/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
