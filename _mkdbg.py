#!/usr/bin/env python3
"""index.html 사본에 씨앗 기록과 오류 잡개를 얹어 _dbgapp.html 을 만든다.

   index.html 을 고칠 때마다 다시 만들어야 한다 — 사본이 낡은 줄 모르고
   "안 고쳐졌다"고 헤맨 적이 여러 번이라 아예 도구로 묶었다.
   씨앗은 표준입력으로, 나갈 이름은 첫 인자로 준다:
       python3 _mkdbg.py _fixmemo.html < seed.js
   이름을 나눠 두는 것은, 시험들이 한 사본을 함께 쓰면 뒤에 만든 씨앗이
   앞 시험을 깨뜨리기 때문이다 — 실제로 그렇게 깨진 적이 있다.
"""
import sys, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, "index.html"), encoding="utf-8").read()
out = sys.argv[1] if len(sys.argv) > 1 else "_dbgapp.html"
seed = sys.stdin.read()
trap = ('<script>\n'
        'window.addEventListener("error",function(e){'
        'document.title="오류: "+e.message+" ("+e.lineno+")";});\n'
        'try{\n' + seed + '\n}catch(e){document.title="씨앗 오류: "+e.message;}\n'
        '</script>\n')
i = src.index("<body>") + len("<body>")
open(os.path.join(here, out), "w", encoding="utf-8").write(src[:i] + "\n" + trap + src[i:])
print(out + " 새로 만듦")
