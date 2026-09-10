/* state 를 세우는 자리 시험 — node _state_qa.js
 *
 * 저장본 읽기·JSON 가져오기·동기화 합치기가 모두 state 를 통째로 갈아끼운다.
 * 거기 안 적힌 것은 그때마다 조용히 사라진다. 실제로 습관 목록이 저장은 되는데
 * 읽히지 않았다 — load() 가 days 와 meds 만 옮겨 담고 있었기 때문이다.
 *
 * asState() 한 곳만 보면 되도록 모아 두었으니, 여기서 그 함수를 지킨다.
 */
var fs = require("fs"), path = require("path");
var src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
var i = src.indexOf("  function asState("), j = src.indexOf("\n  }", i) + 4;
if (i < 0) { console.error("asState 를 찾지 못했습니다."); process.exit(1); }
var asState = new Function(src.slice(i, j) + "\nreturn asState;")();

function cut(from, until) {
  var a = src.indexOf(from), b = src.indexOf(until, a);
  if (a < 0 || b < 0) { console.error("찾지 못함: " + from); process.exit(1); }
  return src.slice(a, b + until.length);
}
var M = new Function(cut("  function stable(v) {", "\n  }") + "\nreturn { stable: stable };")();

var pass = 0, fail = 0;
function t(name, got, want) {
  var ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log("통과  " + name); }
  else { fail++; console.log("X 실패  " + name + "\n   기대=" + JSON.stringify(want) +
                             "\n   실제=" + JSON.stringify(got)); }
}

/* 저장본에 있던 것은 하나도 잃지 않아야 한다 */
var saved = { days: { "2026-08-27": { note: "ㅁ" } },
              meds: [{ id: "m1", name: "혈압약" }],
              habits: [{ id: "h1", name: "운동" }],
              symptoms: [{ id: "s1", name: "속쓰림" }] };
t("저장본의 네 가지가 다 살아난다", asState(saved), saved);

/* 예전 저장본에는 habits·symptoms 가 없다 — 빈 배열로 서야지 undefined 면 안 된다 */
t("예전 저장본도 읽힌다",
  asState({ days: {}, meds: [] }), { days: {}, meds: [], habits: [], symptoms: [] });
t("아무것도 없어도 선다", asState(null),
  { days: {}, meds: [], habits: [], symptoms: [] });

/* 망가진 값이 와도 배열로 세운다 */
t("배열이 아니면 비운다",
  asState({ days: {}, meds: "이상함", habits: null, symptoms: 7 }),
  { days: {}, meds: [], habits: [], symptoms: [] });

/* 동기화는 합친 결과를 직접 건넨다 */
t("합친 결과를 직접 넣을 수 있다",
  asState(null, { d: 1 }, [{ id: "m" }], [{ id: "h" }], [{ id: "s" }]),
  { days: { d: 1 }, meds: [{ id: "m" }], habits: [{ id: "h" }], symptoms: [{ id: "s" }] });

/* 설정 목록이 늘어나면 여기가 알려준다.
   2026-09-10 에 symptoms 를 더하며 이 줄이 울렸고, 그 덕에
   load·가져오기·mergeInto·syncPush·loadBase 를 함께 고칠 수 있었다.
   다음에 또 늘리는 사람도 여기서 걸릴 것. */
var keys = Object.keys(asState(null)).sort();
t("state 는 days·meds·habits·symptoms 로 이루어진다", keys,
  ["days", "habits", "meds", "symptoms"]);

/* ---------- 처음부터 놓아 두는 증상 갈래 ----------
   uid() 로 만들면 휴대폰과 PC 가 각자 만들어 서로 다른 id 를 갖고,
   합칠 때 겹치지 않아 D 가 둘·M 이 둘이 된다. id 가 고정이어야 한다. */
var dsLine = /var DEFAULT_SYMPTOMS = (\[[^\]]*\]);/.exec(src);
if (!dsLine) { console.error("DEFAULT_SYMPTOMS 를 찾지 못했습니다."); process.exit(1); }
var DS = new Function("return " + dsLine[1] + ";")();

t("갈래 둘을 놓는다", DS.length, 2);
t("이름은 D 와 M", DS.map(function (x) { return x.name; }), ["D", "M"]);
t("id 가 못 박혀 있다", DS.map(function (x) { return x.id; }), ["symD", "symM"]);
t("id 에 uid() 가 섞이지 않았다",
  DS.every(function (x) { return /^sym[A-Z]$/.test(x.id); }), true);

/* ---------- 이름 없는 갈래가 D·M 을 막던 일 ----------
   "D 그 다음에 M 이 안 보이네" — 예전 '갈래 추가' 로 만들었다가 이름을 안 붙인
   것이 남아 있으면 목록이 비어 있지 않아 D·M 이 들어가지 못했다. */
var seedSrc = cut("  function seedSymptoms() {", "\n  }");
function seedWith(symptoms, days) {
  var state = { days: days || {}, symptoms: symptoms };
  new Function("state", "DEFAULT_SYMPTOMS", "stable", "symptomList",
    seedSrc + "\nseedSymptoms();")(
      state, DS, M.stable, function () { return state.symptoms || (state.symptoms = []); });
  return state;
}

t("하나도 없으면 D·M 을 놓는다",
  seedWith([]).symptoms.map(function (x) { return x.name; }), ["D", "M"]);
t("이름 없는 갈래는 걷어내고 D·M 을 놓는다",
  seedWith([{ id: "a1", name: "" }, { id: "a2", name: "  " }]).symptoms
    .map(function (x) { return x.id; }), ["symD", "symM"]);
t("이름 있는 갈래는 지킨다",
  seedWith([{ id: "a9", name: "속쓰림" }]).symptoms.map(function (x) { return x.name; }),
  ["D", "M", "속쓰림"]);
t("이미 있으면 두 번 놓지 않는다",
  seedWith([{ id: "symD", name: "D" }, { id: "symM", name: "M" }]).symptoms.length, 2);

/* 걷어낸 갈래의 수치가 남으면 그 날이 '적은 것이 있는 날' 로 세어진다 */
var cleaned = seedWith([{ id: "a9", name: "속쓰림" }],
  { "2026-09-01": { symLv: { b: { a1: 4, a9: 2 } } } });
t("걷어낸 갈래의 수치도 함께 지운다",
  cleaned.days["2026-09-01"].symLv.b, { a9: 2 });

console.log("\n통과 " + pass + " · 실패 " + fail);
process.exit(fail ? 1 : 0);
