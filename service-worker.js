const CACHE_NAME = 'teis-offline-vault-v1';

// ইনস্টল হওয়ার সময় বেসিক ফাইলগুলো ক্যাশ করবে
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// পুরনো ক্যাশ ডিলিট করে সবসময় আপডেটেড রাখবে
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// অফলাইনে চলার ম্যাজিক (Network falling back to cache)
self.addEventListener('fetch', (event) => {
    // গুগল ড্রাইভ API-এর রিকোয়েস্টগুলো ক্যাশ করবে না (এগুলো শুধু অনলাইনে চলবে)
    if (event.request.url.includes('googleapis.com') || event.request.url.includes('accounts.google.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // ক্যাশে থাকলে সাথে সাথে অফলাইনে লোড করবে
            if (cachedResponse) {
                return cachedResponse;
            }
            // ক্যাশে না থাকলে ইন্টারনেট থেকে আনবে এবং ভবিষ্যতে অফলাইনে ব্যবহারের জন্য সেভ করে রাখবে
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                console.log("Offline and resource not found in cache.");
            });
        })
    );
});