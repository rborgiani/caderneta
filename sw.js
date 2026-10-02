/* Service worker da Caderneta Dendrométrica — v18 (02/10/2026).
   index.html: rede primeiro (com internet, sempre pega a versão nova;
   sem internet, abre a cópia guardada). Demais arquivos e fontes: cache primeiro. */
const CACHE = 'caderneta-v18';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ARQUIVOS.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const guarda = (req, resp) => {
  if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
    const copia = resp.clone();
    caches.open(CACHE).then(c => c.put(req, copia));
  }
  return resp;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ehPagina = req.mode === 'navigate' ||
    (url.origin === location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')));
  if (ehPagina) {
    e.respondWith(
      fetch(req, {cache: 'no-store'}).then(r => guarda(req, r))
        .catch(() => caches.match(req).then(h => h || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => guarda(req, r))
      .catch(() => caches.match('./index.html')))
  );
});
