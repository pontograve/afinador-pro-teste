// Service worker do Afinador Pro. O build (vite.config.ts) preenche a versão e a lista de arquivos.
// Estratégia: tudo pré-carregado na instalação; página = rede primeiro (cai no cache offline);
// arquivos com hash = cache primeiro. Nada de áudio passa por aqui.
const CACHE = "afinador-pro-0.7.0-de9d34cf";
const FILES = ["./","assets/analysis.worker-COxmr73A.js","assets/capture.worklet-Ch6mIsi-.js","assets/index-B_fmPNM-.css","assets/index-hZg1zRBX.js","icons/apple-touch-icon.png","icons/favicon-64.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","manifest.webmanifest"];
const MATCH = { ignoreSearch: true, ignoreVary: true };

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("afinador-pro-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// o app pede para ativar a versão nova quando o usuário toca em "Atualizar"
self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./", MATCH)),
    );
    return;
  }
  // pela URL e com ignoreVary: scripts de módulo vêm com Origin e o servidor responde "Vary: Origin";
  // sem isso o cache pré-carregado não casa e o app abre em branco offline
  e.respondWith(caches.match(req.url, MATCH).then((hit) => hit || fetch(req)));
});
