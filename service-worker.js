const CACHE_NAME = 'takenote-cache-v1';
// IMPORTANT: This list includes the app shell and all critical CDN dependencies.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0',
  'https://aistudiocdn.com/uuid@^13.0.0',
  'https://aistudiocdn.com/dexie@^4.2.0',
  'https://aistudiocdn.com/remark-gfm@^4.0.1',
  'https://aistudiocdn.com/react-markdown@^10.1.0',
  'https://aistudiocdn.com/dexie-react-hooks@^1.1.7',
  'https://aistudiocdn.com/jszip@^3.10.1',
  'https://aistudiocdn.com/zustand@^4.5.4'
];

// Install event: cache all critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll for atomic caching of essential assets
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache during install:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, cache it, and return response
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Check if the request is for a CDN resource we want to cache
            const isCdnResource = event.request.url.startsWith('https://aistudiocdn.com/') || event.request.url.startsWith('https://cdn.tailwindcss.com');

            // Only cache our own assets or whitelisted CDN assets
            if(response.type === 'basic' || isCdnResource) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        );
      })
  );
});
