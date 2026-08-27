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
python3 _mkdbg.py _fix_diary.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
var st={days:{},meds:[],habits:[]};
st.days[iso(t)]={diary:[{id:"d1",title:"비가 왔고 오래 걸었다",
  notes:"오후에 도서관까지 걸어감",feel:"젖었지만 개운했다"}]};
localStorage.setItem("weekly-health-ledger-v3",JSON.stringify(st));
SEED
python3 _mkdbg.py _fix_band.html <<'SEED'
var t=new Date(), iso=function(x){return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function on(n){var d=new Date(t);d.setDate(d.getDate()+n);return iso(d);}
var st={days:{},meds:[],habits:[]};
st.days[on(-9)]={trip:[{id:"t1",place:"속초",to:on(-5),who:"가족",notes:"바다가 좋았다"}]};
st.days[on(-20)]={trip:[{id:"t2",place:"제주",to:on(-18),who:"친구",notes:""}]};
st.days[on(-2)]={trip:[{id:"t3",place:"당일 나들이",to:"",who:"혼자",notes:""}]};
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
for f in _emptyday_qa.js _state_qa.js; do
  printf "%-18s " "$f"
  node "$f" | tail -1 || fail=1
done

echo
echo "— 화면 시험"
for f in _qa.html _qa3.html _qa4.html _qa5.html _qa6.html _qa7.html _qa8.html _qa9.html _qa10.html _qa11.html _qa12.html _qa13.html _qa14.html; do
  printf "%-12s " "$f"
  out=$("$CHROME" --headless --disable-gpu --window-size=1240,900 \
        --virtual-time-budget=20000 --dump-dom "http://localhost:$PORT/$f" 2>/dev/null \
        | sed 's/<br>/\n/g' | sed 's/<[^>]*>//g' | grep -oE "통과 [0-9]+ · 실패 [0-9]+" | tail -1)
  echo "${out:-못 돌았음}"
  case "$out" in *"실패 0"*) ;; *) fail=1 ;; esac
done

echo
[ $fail -eq 0 ] && echo "전부 통과" || { echo "실패 있음"; exit 1; }
