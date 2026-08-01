/* 인터넷이 없을 때도 앱이 열리도록 사본을 챙겨두는 도우미.
 *
 * 여기서 조심할 것은 "사본을 너무 잘 챙겨서 고친 내용이 영영 안 보이는" 상황이다.
 * 그래서 화면(HTML)은 늘 인터넷에서 먼저 받아오고, 못 받을 때만 사본을 쓴다.
 * 아이콘처럼 바뀌지 않는 것만 사본을 먼저 쓴다.
 *
 * 기록을 주고받는 /api/ 는 사본을 쓰면 안 된다. 늘 진짜 창고에 물어봐야 한다.
 */

var CACHE = "diary-2026-08-01";

/* 처음 설치할 때 미리 챙겨둘 것들 */
var SHELL = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      /* 하나라도 못 받으면 설치가 통째로 실패한다. 사본은 없어도 앱은 돌아가므로 넘어간다. */
      .catch(function () {})
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);   // 지난 판 사본은 지운다
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // 남의 주소는 건드리지 않는다
  if (url.pathname.indexOf("/api/") === 0) return;       // 기록은 늘 진짜 창고에서

  /* 화면 — 인터넷 먼저, 안 되면 사본 */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put("/", copy); });
          return res;
        })
        .catch(function () {
          return caches.match("/").then(function (hit) {
            return hit || new Response(
              "<!doctype html><meta charset=utf-8><p style=\"font:16px system-ui;padding:24px\">" +
              "인터넷에 연결되지 않았고 저장해 둔 화면도 없습니다. 연결한 뒤 다시 열어주세요.",
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          });
        })
    );
    return;
  }

  /* 아이콘·안내문 — 사본 먼저, 없으면 받아서 챙겨둔다 */
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
