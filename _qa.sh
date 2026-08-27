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
for f in _qa.html _qa3.html _qa4.html _qa5.html _qa6.html _qa7.html; do
  printf "%-12s " "$f"
  out=$("$CHROME" --headless --disable-gpu --window-size=1240,900 \
        --virtual-time-budget=20000 --dump-dom "http://localhost:$PORT/$f" 2>/dev/null \
        | sed 's/<br>/\n/g' | sed 's/<[^>]*>//g' | grep -oE "통과 [0-9]+ · 실패 [0-9]+" | tail -1)
  echo "${out:-못 돌았음}"
  case "$out" in *"실패 0"*) ;; *) fail=1 ;; esac
done

echo
[ $fail -eq 0 ] && echo "전부 통과" || { echo "실패 있음"; exit 1; }
