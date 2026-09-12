#!/bin/bash
# 시험을 전부 돌린다 —  ./_qa.sh
#
# 사본(_fix_*.html)을 늘 먼저 다시 만든다. index.html 을 고치고 사본을 그대로 둔 채
# 시험을 돌려 "안 고쳐졌다"고 헤맨 적이 여러 번이라, 순서를 손에 맡기지 않는다.
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765

lsof -ti:$PORT >/dev/null 2>&1 || { python3 -m http.server $PORT >/dev/null 2>&1 & sleep 1; }

echo "— 사본 다시 만들기"
python3 _mkdbg.py _fix_cal.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_today.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_seen.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
var b=new Date(t); b.setDate(b.getDate()-40);
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={seen:[
 {id:"s1",kind:"영화",title:"오펜하이머",place:"메가박스",who:"동생",notes:"길지만 좋았다",star:4},
 {id:"s2",kind:"강의",title:"파이썬 기초 3강",place:"",who:"",notes:"",star:3}]};
st.days[iso(b)]={seen:[
 {id:"s3",kind:"여행",title:"속초 2박3일",place:"",who:"가족",notes:"바다가 좋았다",star:5}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_trio.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={
 seen:[{id:"s1",kind:"영화",title:"오펜하이머",place:"메가박스",who:"동생",notes:"길지만 좋았다",star:4},
       {id:"s2",kind:"강의",title:"파이썬 기초 3강",place:"세미나실",who:"",notes:"",star:3}],
 movie:[{id:"m2",title:"듄",notes:"사막 이야기\n어디서 CGV · 함께 친구",feel:"",star:0},
        {id:"m3",title:"기생충",place:"롯데시네마",who:"혼자",notes:"계단",feel:"",star:5}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_voice.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_look.html <<'SEED'
var t=new Date();
function dayOf(off){var d=new Date(t);d.setDate(d.getDate()+off);
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
var st={days:{},meds:[],habits:[{id:"h1",name:"운동"},{id:"h2",name:"일기쓰기"}]};
function put(off,o){var k=dayOf(off);st.days[k]=Object.assign(st.days[k]||{},o);}
[0,-1,-2,-3].forEach(function(o,i){
 put(o,{worklog:[{id:"w"+i,title:"일지"+i,notes:""}],
  todos:[{text:"QT",done:false},{text:"할일"+i,done:i<3},{text:"또"+i,done:false}],
  diary:[{id:"d"+i,title:"",notes:"오늘"+i}],
  sleep:{from:"23:00",to:"05:30"}, overall:4,
  money:[{id:"m"+i,kind:"out",amount:40000,note:"밥"}],
  habitDone:{h1:true}});
});
put(0,{movie:[{id:"mv",title:"오펜하이머",notes:"",feel:""}],
       visits:[{id:"v1",place:"연세내과",cost:12690,drug:"",notes:""}]});
[-7,-8,-9,-10].forEach(function(o,i){
 put(o,{sleep:{from:"22:00",to:"06:30"}, overall:3,
  money:[{id:"pm"+i,kind:"out",amount:10000,note:"밥"}],
  habitDone:{h1:true}});
});
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_dup.html <<'SEED'
var st={days:{},meds:[],habits:[]};
st.days["2026-09-03"]={
 worklog:[{id:"w1",title:"오전 일지",notes:""},{id:"w2",title:"오후 일지",notes:""}],
 todos:[{text:"QT",done:false},{text:"계약서 초안",done:true,doneAt:"2026-09-03"}]};
st.days["2026-09-04"]={memo:[{id:"m1",title:"메모 하나",notes:""}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_card.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_rc.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_rx.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_rep.html <<'SEED'
/* 되풀이 찾기 — 날마다 같은 것, 가끔 같은 것, 날마다 다른 것을 섞어 둔다 */
var st={days:{},meds:[],habits:[{id:"h1",name:"운동"}]};
function isoOf(y,m,d){return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");}
for(var i=1;i<=20;i++){
  var k=isoOf(2026,8,i), o={};
  o.todos=[{text:"QT",done:true},{text:"약 먹기",done:i%2===0},{text:"장보기"+(i>18?"":i),done:false}];
  o.water=5; o.sleep={from:"23:00",to:"06:00"};
  o.menu={b:"현미밥",l:"국수",d:"현미밥",s:""};
  if(i%3===0) o.exercise={min:30,kind:"걷기"};
  if(i<=4) o.memo=[{id:"m"+i,title:"성경 읽기",notes:""}];
  st.days[k]=o;
}
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_sym.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({
 days:{}, meds:[], habits:[],
 symptoms:[{id:"s1",name:"속쓰림"},{id:"s2",name:"두통"}]}));
SEED
python3 _mkdbg.py _fix_symt.html <<'SEED'
var st={days:{},meds:[],habits:[],symptoms:[{id:"symD",name:"D"},{id:"symM",name:"M"}]};
var t=new Date();
function wkd(off){var d=new Date(t);d.setDate(d.getDate()-d.getDay()+off);
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
/* 이번 주. 하루에 여러 번 매긴 날을 둔다 — 가장 심했던 것을 그날 값으로 삼는지 본다 */
st.days[wkd(0)]={symLv:{b:{symD:0},l:{symD:0}}};
st.days[wkd(1)]={symLv:{b:{symD:2},l:{symD:7},d:{symD:1},s:{symM:3}}};
st.days[wkd(2)]={symLv:{b:{symD:4}}};
st.days[wkd(4)]={symLv:{d:{symM:6}}};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_ics.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_wxq.html <<'SEED'
/* 비 22.4/18.5 로 적힌 지난 날짜. 지난 날짜는 받아오지 않으므로 손으로 고르는 길만 본다 */
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({
  days:{"2026-09-11":{note:"ㅁ",weather:{kind:"rain",hi:22.4,lo:18.5,now:19.5,place:"서울",auto:true}}},
  meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_symq.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({
 days:{}, meds:[], habits:[],
 symptoms:[{id:"s1",name:"속쓰림"},{id:"s2",name:"두통"}]}));
SEED
python3 _mkdbg.py _fix_hide.html <<'SEED'
var st={days:{},meds:[],habits:[]};
for(var i=1;i<=12;i++){var k="2026-07-"+String(i).padStart(2,"0");
 st.days[k]={faith:[{id:"fa"+i,title:"묵상"+i,notes:""}],
             memo:[{id:"me"+i,title:"메모"+i,notes:""}]};}
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_sel.html <<'SEED'
var t=new Date();
function dayOf(n){return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");}
var st={days:{},meds:[],habits:[]};
/* 오늘도 함께 넣는다 — 오늘 것이 없으면 "고른 날이 펼쳐진다" 를 볼 수가 없다.
   달이 지나 오늘이 5일을 넘어가면서 시험이 깨진 적이 있다. */
var days=[1,2,3,4,5]; if(days.indexOf(t.getDate())===-1) days.push(t.getDate());
days.forEach(function(n){
 st.days[dayOf(n)]={
  worklog:[{id:"w"+n,title:n+"일 일지",notes:n+"일에 한 일"}],
  todos:[{text:"QT",done:false},{text:n+"일 할일",done:false}]};
});
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_wl.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_w2.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_gift.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_find.html <<'SEED'
var st={days:{},meds:[],habits:[]};
function put(k,todo,memo){st.days[k]=st.days[k]||{};
 if(todo){st.days[k].todos=[{text:"QT",done:false},{text:todo,done:false}];}
 if(memo){st.days[k].memo=[{id:"m"+k,title:memo,notes:""}];}}
put("2026-08-10","팔월 할일","팔월 메모");
put("2026-07-05","칠월 할일","칠월 메모");
put("2025-08-20","작년팔월 할일","작년팔월 메모");
put("2025-03-11","작년삼월 할일","작년삼월 메모");
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_work.html <<'SEED'
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify({days:{},meds:[],habits:[]}));
SEED
python3 _mkdbg.py _fix_diary.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={diary:[{id:"d1",title:"비가 왔고 오래 걸었다",
  notes:"오후에 도서관까지 걸어감",feel:"젖었지만 개운했다"}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_band.html <<'SEED'
/* 이번 달 며칟날로 못 박는다 — 달을 넘는 날짜는 이번 달 달력에 칸이 없다 */
var t=new Date();
function dayOf(n){return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(n).padStart(2,"0");}
var st={days:{},meds:[],habits:[]};
st.days[dayOf(3)]={trip:[{id:"t1",place:"속초",to:dayOf(7),who:"가족",notes:"바다가 좋았다"}]};
st.days[dayOf(12)]={trip:[{id:"t2",place:"제주",to:dayOf(14),who:"친구",notes:""}]};
st.days[dayOf(20)]={trip:[{id:"t3",place:"당일 나들이",to:"",who:"혼자",notes:""}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_recent.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function back(n){var d=new Date(t);d.setDate(d.getDate()-n);return iso(d);}
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={movie:[
 {id:"a1",title:"오펜하이머",place:"메가박스",who:"동생",notes:"3시간짜리",feel:"길지만 좋았다",star:4},
 {id:"a2",title:"듄",place:"CGV",who:"친구",notes:"사막",feel:"좋았다",star:3}],
 show:[{id:"s9",title:"김광석 다시부르기",place:"세종문화회관",who:"엄마",notes:"2부",feel:"오래 남을 밤",star:5}]};
["기생충","인터스텔라","라라랜드","코코"].forEach(function(nm,i){
 var k=back(i+2); st.days[k]=st.days[k]||{};
 st.days[k].movie=[{id:"p"+i,title:nm,notes:nm+" 봄",feel:"",star:i+1}];
});
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_past.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function back(n){var d=new Date(t);d.setDate(d.getDate()-n);return iso(d);}
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={movie:[{id:"m0",title:"오펜하이머",place:"메가박스",who:"동생",notes:"3시간짜리",feel:"길지만 좋았다",star:4}]};
["듄","기생충","인터스텔라","라라랜드","코코"].forEach(function(nm,i){
 var k=back(i+2); st.days[k]=st.days[k]||{};
 st.days[k].movie=[{id:"p"+i,title:nm,place:"CGV",who:"친구",notes:nm+" 봄",feel:"좋았다",star:(i%5)+1}];
});
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_memo.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
var b=new Date(t); b.setDate(b.getDate()-5);
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={workNote:"이번 주는 계약 건이 몰려 있다.\n월요일에 법무팀 회신 확인할 것."};
st.days[iso(b)]={workNote:"서버 이전 일정 조율"};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED

echo
echo "— node 시험"
fail=0
for f in _emptyday_qa.js _state_qa.js _sync_qa.js; do
  printf "%-18s " "$f"
  node "$f" | tail -1 || fail=1
done

echo
echo "— 화면 시험"
for f in _qa.html _qa3.html _qa4.html _qa5.html _qa6.html _qa7.html _qa8.html _qa9.html _qa10.html _qa11.html _qa12.html _qa13.html _qa14.html _qa15.html _qa16.html _qa17.html _qa18.html _qa19.html _qa20.html _qa21.html _qa22.html _qa23.html _qa24.html _qa25.html _qa26.html _qa27.html _qa28.html _qa29.html _qa30.html _qa31.html _qa32.html; do
  printf "%-12s " "$f"
  out=$("$CHROME" --headless --disable-gpu --window-size=1240,900 \
        --virtual-time-budget=20000 --dump-dom "http://localhost:$PORT/$f" 2>/dev/null \
        | sed 's/<br>/\n/g' | sed 's/<[^>]*>//g' | grep -oE "통과 [0-9]+ · 실패 [0-9]+" | tail -1)
  echo "${out:-못 돌았음}"
  case "$out" in *"실패 0"*) ;; *) fail=1 ;; esac
done

echo
[ $fail -eq 0 ] && echo "전부 통과" || { echo "실패 있음"; exit 1; }
