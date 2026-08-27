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
              habits: [{ id: "h1", name: "운동" }] };
t("저장본의 세 가지가 다 살아난다", asState(saved), saved);

/* 예전 저장본에는 habits 가 없다 — 빈 배열로 서야지 undefined 면 안 된다 */
t("예전 저장본도 읽힌다",
  asState({ days: {}, meds: [] }), { days: {}, meds: [], habits: [] });
t("아무것도 없어도 선다", asState(null), { days: {}, meds: [], habits: [] });

/* 망가진 값이 와도 배열로 세운다 */
t("meds 가 배열이 아니면 비운다",
  asState({ days: {}, meds: "이상함", habits: null }),
  { days: {}, meds: [], habits: [] });

/* 동기화는 합친 결과를 직접 건넨다 */
t("합친 결과를 직접 넣을 수 있다",
  asState(null, { d: 1 }, [{ id: "m" }], [{ id: "h" }]),
  { days: { d: 1 }, meds: [{ id: "m" }], habits: [{ id: "h" }] });

/* 설정 목록이 늘어나면 여기가 알려준다 */
var keys = Object.keys(asState(null)).sort();
t("state 는 days·meds·habits 로 이루어진다", keys, ["days", "habits", "meds"]);

console.log("\n통과 " + pass + " · 실패 " + fail);
process.exit(fail ? 1 : 0);
