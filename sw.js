const CACHE_NAME = 'controlagro-v11';
const ASSETS = [
    './',
    './index.html',
    './logo.png',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

const OFFLINE_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ControlAGRO - Offline</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4;text-align:center;padding:20px;box-sizing:border-box}h2{color:#166534;margin-bottom:8px}p{color:#555;font-size:.95rem}button{margin-top:20px;padding:12px 24px;background:#16a34a;color:#fff;border:none;border-radius:12px;font-size:1rem;cursor:pointer}</style></head><body><div><h2>ControlAGRO</h2><p>Você está sem conexão e o app ainda não foi carregado neste dispositivo.<br><br>Abra o app <strong>uma vez com internet</strong> para ativar o modo offline.</p><button onclick="location.reload()">Tentar novamente</button></div></body></html>`;

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .catch(err => console.warn('Cache install parcial:', err))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Ignorar requests não-HTTP (chrome-extension, etc.)
    if (!url.startsWith('http')) return;

    // Nunca cachear requests da API do Supabase
    if (url.includes('supabase.co')) return;

    // JS e CSS: network-first (sempre busca versão nova, cache como fallback)
    if (url.endsWith('.js') || url.endsWith('.css')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => caches.match(event.request).then(cached =>
                    cached || new Response('', { status: 503, statusText: 'Offline' })
                ))
        );
        return;
    }

    // HTML pages: network-first, cache fallback, offline page como último recurso
    if (event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then(cached => {
                        if (cached) return cached;
                        return new Response(OFFLINE_HTML, {
                            status: 200,
                            headers: { 'Content-Type': 'text/html; charset=utf-8' }
                        });
                    })
                )
        );
        return;
    }

    // Imagens, fontes e outros assets estáticos: cache-first (raramente mudam)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;

                return fetch(event.request.clone())
                    .then(response => {
                        if (!response || response.status !== 200) return response;
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                        return response;
                    })
                    .catch(() => new Response('', {
                        status: 503,
                        statusText: 'Offline',
                        headers: { 'Content-Type': 'text/plain' }
                    }));
            })
    );
});
