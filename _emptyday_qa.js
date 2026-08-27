/* emptyDay 시험 — node _emptyday_qa.js
 *
 * emptyDay 가 "빈 날"이라고 하면 동기화는 그 날을 없는 날로 다룬다. 올리지도 않고,
 * 합칠 때는 저쪽에 없으니 이쪽 것을 버린다. 그래서 여기에 자리 하나가 빠지면
 * 그 갈래에만 적은 날이 통째로 사라진다 — 실제로 묵상일기가 그렇게 사라졌다.
 *
 * index.html 에서 함수를 그대로 꺼내 와 자리마다 하나씩 넣어 본다.
 * 새 자리를 만들면 아래 목록에도 더할 것.
 */
var fs = require("fs"), path = require("path");
var src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
var i = src.indexOf("  var DAY_LISTS ="), j = src.indexOf("\n  }", src.indexOf("function emptyDay")) + 4;
if (i < 0 || j < 4) { console.error("emptyDay 를 찾지 못했습니다."); process.exit(1); }
var emptyDay = new Function(src.slice(i, j) + "\nreturn emptyDay;")();

var pass = 0, fail = 0;
function t(name, d, want) {
  var got = emptyDay(d);
  if (got === want) { pass++; console.log("통과  " + name); }
  else { fail++; console.log("X 실패  " + name + "  기대=" + want + " 실제=" + got); }
}

t("아무것도 없으면 빈 날", {}, true);
t("없는 날도 빈 날", null, true);

["schedule", "meetings", "visits", "money", "faith", "prayer",
 "worklog", "history", "knowledge", "memo", "seen",
 "trip", "movie", "show", "lecture", "book"].forEach(function (k) {
  var d = {}; d[k] = [{ id: "x" }];
  t(k + " 하나만 있어도 빈 날이 아니다", d, false);
});

["b", "l", "d", "s"].forEach(function (k) {
  var a = { meals: {} }; a.meals[k] = true;    t("meals." + k, a, false);
  var b = { menu: {} };  b.menu[k] = "현미밥";  t("menu." + k, b, false);
  var c = { pill: {} };  c.pill[k] = "혈압약";  t("pill." + k, c, false);
  var e = { sym: {} };   e.sym[k] = "속쓰림";   t("sym." + k, e, false);
});

/* 체크로만 남는 것들 — 목록이 아니라 표시라서 따로 본다 */
t("습관 하나만 해내도 빈 날이 아니다", { habitDone: { h1: true } }, false);
t("약 하나만 먹어도 빈 날이 아니다", { medTaken: { m1: true } }, false);
t("체크가 다 꺼져 있으면 빈 날", { habitDone: { h1: false }, medTaken: {} }, true);

t("빈 할 일만 있으면 빈 날", { todos: [{ text: "", done: false }] }, true);
t("빈 목록만 있으면 빈 날", { faith: [], prayer: [], seen: [] }, true);
t("메모", { note: "ㅁ" }, false);
t("일 메모만 있어도 빈 날이 아니다", { workNote: "이어서 할 것" }, false);
t("빈 일 메모는 빈 날", { workNote: "" }, true);
t("혈압", { bp: "120/80" }, false);

console.log("\n통과 " + pass + " · 실패 " + fail);
process.exit(fail ? 1 : 0);
