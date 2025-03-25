const CACHE_NAME = "weather-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/main.js",
  "/hotel.js",
  "/styles.css",
  "/styles1.css", // Ensure this matches your actual CSS file name
  // Add other assets you want to cache
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache:", CACHE_NAME);
        // Attempt to cache all resources, but handle failures gracefully
        return Promise.all(
          urlsToCache.map((url) => {
            return fetch(url, { mode: "no-cors" }) // Use 'no-cors' for third-party or opaque responses
              .then((response) => {
                if (!response.ok) {
                  console.warn(`Failed to fetch ${url}: ${response.status}`);
                  return null; // Skip this resource
                }
                return cache.put(url, response.clone()); // Cache successful responses
              })
              .catch((error) => {
                console.warn(`Failed to cache ${url}:`, error);
                return null; // Skip this resource
              });
          })
        ).then(() => {
          console.log("Caching completed with available resources");
        });
      })
      .catch((error) => {
        console.error("Service Worker install failed:", error);
      })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, otherwise fetch from network
      return (
        response ||
        fetch(event.request).catch((error) => {
          console.error(`Fetch failed for ${event.request.url}:`, error);
          // Optionally return a fallback response (e.g., offline page)
          return caches.match("/index.html"); // Fallback to index.html if network fails
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log(`Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Activation completed, old caches cleared");
      })
      .catch((error) => {
        console.error("Activation failed:", error);
      })
  );
});
