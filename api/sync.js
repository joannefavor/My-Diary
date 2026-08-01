/* 기기 간 기록 동기화 — 저장소 중계
 *
 * 이 함수는 기록의 내용을 모릅니다.
 * 브라우저가 비밀 코드로 암호화한 덩어리(base64)를 그대로 받아 두었다가 그대로 돌려줍니다.
 * 비밀 코드도, 복호화 열쇠도 서버로 오지 않습니다.
 *
 * id 는 비밀 코드에서 PBKDF2로 뽑은 64자 hex입니다.
 * 같은 코드를 넣은 기기끼리만 같은 id를 만들어 서로의 기록을 찾습니다.
 *
 * 의존성 없음 — Upstash REST API를 fetch로 직접 부릅니다.
 *
 *   GET  /api/sync?id=<64hex>   → { blob, rev, at }   없으면 blob:null, rev:0
 *   PUT  /api/sync?id=<64hex>   { blob, rev }
 *        → 200 { rev, at }      올림 성공
 *        → 409 { rev }          그 사이 다른 기기가 올림. 다시 받아 합친 뒤 재시도.
 */

"use strict";

var MAX_BLOB = 900000;          // 약 900KB. Upstash 요청 크기 한도 안쪽으로 잡는다
var TTL = 60 * 60 * 24 * 730;   // 2년. 쓸 때마다 갱신되므로 쓰는 동안은 지워지지 않는다
var RATE_MAX = 120;             // IP당 1분에 120번
var RATE_WINDOW = 60;

/* 올리기는 "내가 알던 rev가 아직 최신일 때만" 이어야 한다.
   두 기기가 동시에 올려 한쪽이 조용히 덮어써지는 걸 막는다. */
var PUT_SCRIPT = [
  "local r = tonumber(redis.call('GET', KEYS[2]) or '0')",
  "if tonumber(ARGV[2]) ~= r then return -1 end",
  "local nr = r + 1",
  "redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[4])",
  "redis.call('SET', KEYS[2], nr, 'EX', ARGV[4])",
  "redis.call('SET', KEYS[3], ARGV[3], 'EX', ARGV[4])",
  "return nr"
].join("\n");

function creds() {
  var url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  var token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token: token } : null;
}

async function redis(c, command) {
  var r = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: "Bearer " + c.token, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  var text = await r.text();
  if (!r.ok) throw new Error("저장소 응답 " + r.status + ": " + text.slice(0, 200));
  return JSON.parse(text).result;
}

function clientIp(req) {
  var f = req.headers["x-forwarded-for"];
  return (Array.isArray(f) ? f[0] : String(f || "")).split(",")[0].trim() || "unknown";
}

async function overRate(c, req) {
  var key = "rl:" + clientIp(req);
  var n = await redis(c, ["INCR", key]);
  if (n === 1) await redis(c, ["EXPIRE", key, String(RATE_WINDOW)]);
  return n > RATE_MAX;
}

/* 본문은 프레임워크 없이 직접 읽는다 */
function readBody(req) {
  if (req.body != null) {
    if (typeof req.body === "string") { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); } }
    if (typeof req.body === "object") return Promise.resolve(req.body);
  }
  return new Promise(function (resolve) {
    var chunks = [], size = 0, tooBig = false;
    req.on("data", function (ch) {
      size += ch.length;
      if (size > MAX_BLOB + 4096) { tooBig = true; return; }
      chunks.push(ch);
    });
    req.on("end", function () {
      if (tooBig) return resolve(null);
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { resolve(null); }
    });
    req.on("error", function () { resolve(null); });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  var c = creds();
  if (!c) return res.status(503).json({ error: "저장소가 아직 연결되지 않았습니다." });

  var id = req.query && req.query.id;
  if (Array.isArray(id)) id = id[0];
  if (!/^[0-9a-f]{64}$/.test(String(id || ""))) {
    return res.status(400).json({ error: "잘못된 요청입니다." });
  }

  try {
    if (await overRate(c, req)) {
      return res.status(429).json({ error: "요청이 너무 잦습니다. 잠시 뒤 다시 시도해 주세요." });
    }

    if (req.method === "GET") {
      var got = await redis(c, ["MGET", "d:" + id, "r:" + id, "t:" + id]);
      return res.status(200).json({
        blob: got[0] || null,
        rev: Number(got[1] || 0),
        at: Number(got[2] || 0)
      });
    }

    if (req.method === "PUT") {
      var body = await readBody(req);
      if (!body || typeof body.blob !== "string") {
        return res.status(400).json({ error: "본문을 읽을 수 없습니다." });
      }
      if (body.blob.length > MAX_BLOB) {
        return res.status(413).json({ error: "기록이 너무 커서 올릴 수 없습니다." });
      }
      var base = Number(body.rev);
      if (!isFinite(base) || base < 0) base = 0;

      var at = Date.now();
      var rev = await redis(c, [
        "EVAL", PUT_SCRIPT, "3",
        "d:" + id, "r:" + id, "t:" + id,
        body.blob, String(base), String(at), String(TTL)
      ]);

      if (Number(rev) === -1) {
        var cur = await redis(c, ["GET", "r:" + id]);
        return res.status(409).json({ error: "다른 기기가 먼저 올렸습니다.", rev: Number(cur || 0) });
      }
      return res.status(200).json({ rev: Number(rev), at: at });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "지원하지 않는 요청입니다." });
  } catch (e) {
    return res.status(502).json({ error: "저장소에 닿지 못했습니다." });
  }
};
