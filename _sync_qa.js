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
var M = new Function(mergeSrc + "\nreturn { stable: stable, mergeDays: mergeDays, emptyDay: emptyDay," +
  " realVal: realVal, hasRecords: hasRecords };")();

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

/* ---------- 한 날 안에서 칸끼리 ----------
   "어제 공복혈당 기록이 핸드폰에는 있는데 PC 에서는 안 보이네" 에서 나온 자리다.
   예전에는 하루를 통째로 하나로 골라서, 같은 날을 양쪽에서 건드리면
   한쪽 하루가 통째로 버려졌다. */

/* PC 에서는 할 일을, 휴대폰에서는 혈당을 적었다. 둘 다 남아야 한다. */
var was = { "2026-09-08": { glucose: null, todos: [{ text: "QT", done: false }] } };
var pc  = { "2026-09-08": { glucose: null, todos: [{ text: "QT", done: true }] } };
var ph  = { "2026-09-08": { glucose: 96,   todos: [{ text: "QT", done: false }] } };
var got = M.mergeDays({ days: was }, { days: pc }, { days: ph });

t("휴대폰에서 적은 혈당이 PC 의 할 일에 밀려나지 않는다",
  got.days["2026-09-08"].glucose, 96);
t("PC 에서 한 할 일 표시도 그대로 남는다",
  got.days["2026-09-08"].todos[0].done, true);
t("서로 다른 칸이면 부딪힘이 아니다", got.conflicts, []);
t("저쪽에서 받은 것이 있다고 센다", got.changed, true);

/* 같은 칸을 양쪽이 다르게 적었을 때만 이 기기 것을 남기고 알린다 */
var c = M.mergeDays({ days: { "2026-09-08": { glucose: 90 } } },
                    { days: { "2026-09-08": { glucose: 91 } } },
                    { days: { "2026-09-08": { glucose: 96 } } });
t("같은 칸이 다르면 이 기기 것을 남긴다", c.days["2026-09-08"].glucose, 91);
t("그때만 부딪힘으로 알린다", c.conflicts, ["2026-09-08"]);

/* base 를 모르는 기기에서 이쪽 빈 칸이 저쪽 값을 이기면 안 된다 */
var f = M.mergeDays({ days: {} },
                    { days: { "2026-09-08": { glucose: null, memo: [] } } },
                    { days: { "2026-09-08": { glucose: 96, memo: [] } } });
t("처음 연결한 기기의 빈 칸이 저쪽 값을 밀어내지 않는다",
  f.days["2026-09-08"].glucose, 96);

/* 지우기는 그대로 전해져야 한다 */
var del = M.mergeDays({ days: { "2026-09-08": { glucose: 96 } } },
                      { days: { "2026-09-08": { glucose: null } } },
                      { days: { "2026-09-08": { glucose: 96 } } });
t("이쪽에서 지운 것은 저쪽에도 전해진다", del.days["2026-09-08"], undefined);

t("0 은 비운 것이 아니라 적은 값이다", M.realVal(0), 0);
t("빈 목록은 적지 않은 것", M.realVal([]), undefined);
t("빈 칸만 든 덩이도 적지 않은 것", M.realVal({ b: "", l: "" }), undefined);
t("하나라도 적혔으면 적은 것", M.realVal({ b: "", l: "국수" }).l, "국수");

/* ---------- 텅 빈 방에 들어섰는가 ----------
   "비밀코드가 다르네?" — 두 기기가 서로 다른 코드로 며칠을 지냈다.
   양쪽 다 '동기화 중' 으로 보이면서 영영 만나지 못한다.
   적어 둔 것이 있는 기기가 빈 방에 처음 들어서면 코드를 의심해야 한다. */
t("적은 것이 하나라도 있으면 그렇다고 한다",
  M.hasRecords({ "2026-09-08": { glucose: 96 } }), true);
t("화면만 열어 생긴 빈 자리는 세지 않는다",
  M.hasRecords({ "2026-09-08": {}, "2026-09-09": {} }), false);
t("날짜가 아예 없어도 세지 않는다", M.hasRecords({}), false);
t("없는 것을 넘겨도 견딘다", M.hasRecords(null), false);

/* ---------- 설정 목록도 합쳐진다 ----------
   증상 갈래는 날짜 밑에 있지 않아 mergeDays 가 못 다룬다. 따로 합쳐야 한다. */
/* mergeNamedList 는 pick3·stable 을 쓰므로 합치기 뭉치와 함께 세운다 */
var nlSrc = cut("  function mergeNamedList(", "return out;\n  }");
var mergeNamedList = new Function(mergeSrc + "\n" + nlSrc + "\nreturn mergeNamedList;")();
var B = { symptoms: [] }, Lc = { symptoms: [{ id: "s1", name: "속쓰림" }] },
    R = { symptoms: [{ id: "s2", name: "두통" }] };
var got2 = mergeNamedList(B, Lc, R, "symptoms").map(function (x) { return x.name; });
t("양쪽에서 만든 증상 갈래가 둘 다 남는다", got2, ["속쓰림", "두통"]);
t("이 기기 순서가 앞선다", got2[0], "속쓰림");

/* ---------- 어느 쪽이 예전 판인가 ----------
   PC 만 예전 판인 채로 화요일 혈당을 계속 버렸다. 브라우저가 화면을 사본으로
   갖고 있어서, 고친 줄 모르고 며칠 지날 수 있다. */
var bs = new Function("APP_BUILD",
  cut("  function buildSide(theirs) {", "\n  }") + "\nreturn buildSide;")(20260909);
t("판이 같으면 아무 말도 하지 않는다", bs(20260909), "");
t("저쪽이 낮으면 저쪽이 예전 판", bs(20260901), "저쪽");
t("판이 아예 없으면 저쪽이 예전 판 — 표를 넣기 전 판이다", bs(undefined), "저쪽");
t("저쪽이 높으면 이쪽이 예전 판", bs(20261001), "이쪽");

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
