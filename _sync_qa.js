/* 동기화 합치기·올리기 예약 시험 — node _sync_qa.js
 *
 * "핸드폰에서 적은게 PC 로 안 넘어오네" 에서 나온 시험이다.
 * 기록이 오가는 길은 화면으로 확인하기 어려워 눈에 잘 띄지 않는다.
 * 여기서는 index.html 에서 함수를 그대로 꺼내 와 길목마다 하나씩 확인한다.
 */
var fs = require("fs"), path = require("path");
var src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function cut(from, until) {
  var i = src.indexOf(from);
  var j = src.indexOf(until, i);
  if (i < 0 || j < 0) { console.error("찾지 못함: " + from); process.exit(1); }
  return src.slice(i, j + until.length);
}

var pass = 0, fail = 0;
function t(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log("통과  " + name); }
  else { fail++; console.log("X 실패  " + name + "  기대=" + JSON.stringify(want) + " 실제=" + JSON.stringify(got)); }
}

/* ---------- 합치기 ---------- */
var mergeSrc = cut("  function stable(v) {", "return { days: out, conflicts: conflicts, changed: changed };\n  }");
var M = new Function(mergeSrc + "\nreturn { stable: stable, mergeDays: mergeDays, emptyDay: emptyDay };")();

var d1 = { memo: [{ id: "m1", title: "가", notes: "" }] };
var d2 = { memo: [{ id: "m2", title: "나", notes: "" }] };

t("저쪽에만 있는 날은 '받은 것' 으로 센다",
  M.mergeDays({ days: {} }, { days: {} }, { days: { "2026-09-01": d1 } }).changed, true);
t("양쪽이 같으면 받은 것이 없다",
  M.mergeDays({ days: { "2026-09-01": d1 } }, { days: { "2026-09-01": d1 } },
              { days: { "2026-09-01": d1 } }).changed, false);
t("이쪽에만 적었으면 받은 것이 없다",
  M.mergeDays({ days: {} }, { days: { "2026-09-01": d1 } }, { days: {} }).changed, false);
t("양쪽이 다르게 적었으면 이 기기 것을 남기고 부딪힘으로 센다",
  M.mergeDays({ days: {} }, { days: { "2026-09-01": d1 } },
              { days: { "2026-09-01": d2 } }).conflicts, ["2026-09-01"]);
t("저쪽 것을 받아 넣는다",
  M.mergeDays({ days: {} }, { days: {} },
              { days: { "2026-09-02": d2 } }).days["2026-09-02"].memo[0].title, "나");

/* 빈 칸은 없는 날로 친다 — 처음 연결하는 기기가 저쪽 기록을 지우지 않도록 */
t("이쪽의 빈 칸이 저쪽 기록을 밀어내지 않는다",
  M.mergeDays({ days: {} }, { days: { "2026-09-03": {} } },
              { days: { "2026-09-03": d1 } }).days["2026-09-03"].memo[0].title, "가");

/* ---------- 올리기 예약 ---------- */
var qSrc = cut("  function queueSync() {", "syncRun(\"올리는 중…\");\n  }");
var ran = [], timers = 0;
var env = new Function("sync", "syncOnline", "syncRun", "clearTimeout", "setTimeout", "SYNC_DEBOUNCE",
  qSrc + "\nreturn { queueSync: queueSync, syncFlush: syncFlush };");

function box(over) {
  var sync = Object.assign({ code: "c", id: "i", key: {}, rev: 1,
                             busy: false, dirty: false, merging: false, timer: null }, over || {});
  ran = [];
  var api = env(sync, function () { return !!sync.key; },
    function (label) { ran.push(label); },
    function () { timers = 0; }, function (fn) { timers = 1; return 7; }, 3000);
  return { sync: sync, api: api };
}

var b = box();
b.api.queueSync();
t("적으면 올릴 것이 있다고 표를 세운다", b.sync.dirty, true);
t("바로 보내지 않고 잠시 모은다", ran.length, 0);

b = box({ busy: true });
b.api.queueSync();
t("맞추는 중에 적어도 표는 남는다 — 예전엔 여기서 흘렸다", b.sync.dirty, true);

b = box({ merging: true });
b.api.queueSync();
t("받아 합치는 중의 저장은 올리기로 세지 않는다", b.sync.dirty, false);

b = box({ key: null });
b.api.queueSync();
t("연결하지 않았으면 아무 일도 없다", b.sync.dirty, false);

b = box({ dirty: true });
b.api.syncFlush();
t("나갈 때 남은 것이 있으면 기다리지 않고 바로 올린다", ran, ["올리는 중…"]);

b = box({ dirty: false });
b.api.syncFlush();
t("올릴 것이 없으면 나갈 때 부르지 않는다", ran, []);

b = box({ dirty: true, busy: true });
b.api.syncFlush();
t("이미 맞추는 중이면 겹쳐 부르지 않는다", ran, []);

console.log((fail ? "X " : "") + "통과 " + pass + " · 실패 " + fail);
process.exit(fail ? 1 : 0);
