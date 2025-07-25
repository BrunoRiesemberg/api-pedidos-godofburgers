// Define um nome e versão para o cache do seu app
const CACHE_NAME = 'god-of-burgers-v1';

// Lista de arquivos essenciais para o app funcionar offline (o "App Shell")
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'https://i.imgur.com/5GGXizh.png',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Roboto:wght@400;500;700&display=swap'
];

// Evento de Instalação: Salva os arquivos essenciais em cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Fetch: Intercepta as requisições
// Ele primeiro tenta buscar do cache. Se não encontrar, busca na rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o arquivo existir no cache, retorna ele
        if (response) {
          return response;
        }
        // Se não, busca na rede
        return fetch(event.request);
      }
    )
  );
});

// Evento de Ativação: Limpa caches antigos se a versão do app mudar
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
