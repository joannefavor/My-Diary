/* 방명록 — Supabase 연결
 *
 * 방문자 브라우저가 아니라 이 서버가 Supabase에 접속한다.
 * 그래서 주소와 열쇠는 브라우저로 나가지 않는다.
 *
 * 열쇠는 anon 키만 쓴다. service_role(모든 문단속을 무시하는 마스터 키)은 쓰지 않는다.
 * 따라서 Supabase에 걸어 둔 RLS 정책(anon 에게 SELECT / INSERT 만 허용)이 그대로 적용된다.
 * 이 코드가 실수로 지우거나 고치려 해도 데이터베이스가 거부한다.
 *
 *   GET  /api/guestbook   → { entries: [ { name, message, created_at }, ... ] }  최신순
 *   POST /api/guestbook   { name, message }  → { ok: true }
 */

"use strict";

var { createClient } = require("@supabase/supabase-js");

var TABLE = "guestbook";
var LIMIT = 100;         // 한 번에 보여 줄 글 수
var NAME_MAX = 40;
var MESSAGE_MAX = 500;

/* 값이 없으면 조용히 죽지 않고, 무엇이 없는지 알려 준다.
   "supabaseUrl is required" 같은 영어 오류로 끝나면 원인을 찾기 어렵다. */
function connect() {
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_ANON_KEY;

  var missing = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!key) missing.push("SUPABASE_ANON_KEY");
  if (missing.length) {
    return { error: "설정값이 없습니다: " + missing.join(", ") +
      " — .env.local 에 넣은 뒤 개발 서버를 껐다 켜야 반영됩니다." };
  }
  return { db: createClient(url, key, { auth: { persistSession: false } }) };
}

function readBody(req) {
  if (req.body != null) {
    if (typeof req.body === "object") return Promise.resolve(req.body);
    if (typeof req.body === "string") {
      try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); }
    }
  }
  return new Promise(function (resolve) {
    var chunks = [], size = 0;
    req.on("data", function (c) { size += c.length; if (size <= 20000) chunks.push(c); });
    req.on("end", function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { resolve(null); }
    });
    req.on("error", function () { resolve(null); });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  var conn = connect();
  if (conn.error) return res.status(503).json({ error: conn.error });
  var db = conn.db;

  try {
    if (req.method === "GET") {
      var got = await db
        .from(TABLE)
        .select("id, name, message, created_at")
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (got.error) {
        return res.status(502).json({ error: "글을 불러오지 못했습니다: " + got.error.message });
      }
      return res.status(200).json({ entries: got.data || [] });
    }

    if (req.method === "POST") {
      var body = await readBody(req);
      if (!body) return res.status(400).json({ error: "보내주신 내용을 읽지 못했습니다." });

      var name = String(body.name == null ? "" : body.name).trim();
      var message = String(body.message == null ? "" : body.message).trim();

      /* 화면에서도 막지만, 화면을 거치지 않고 들어오는 경우가 있으므로 여기서도 막는다 */
      if (!message) return res.status(400).json({ error: "메시지를 적어주세요." });
      if (message.length > MESSAGE_MAX) {
        return res.status(400).json({ error: "메시지는 " + MESSAGE_MAX + "자까지 쓸 수 있습니다." });
      }
      if (name.length > NAME_MAX) name = name.slice(0, NAME_MAX);
      if (!name) name = "익명";

      var put = await db.from(TABLE).insert({ name: name, message: message });
      if (put.error) {
        return res.status(502).json({ error: "글을 남기지 못했습니다: " + put.error.message });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "지원하지 않는 요청입니다." });
  } catch (e) {
    return res.status(502).json({ error: "방명록 서버에 문제가 있습니다: " + (e && e.message ? e.message : "") });
  }
};
