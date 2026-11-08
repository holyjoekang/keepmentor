"""joyhouse 멘토링 사례(data/mentoring/mentoring.json)를 Keep Mentor 사례집 데이터로 옮긴다.

    python scripts/import_joyhouse_cases.py [joyhouse 경로]

출력: data/cases.json  (/api/cases 가 인증 후 내려준다)
미팅 기록(meetings.json)은 실명 대화 기록이라 옮기지 않는다.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOY = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/workspace/joyhouse")
src = json.loads((JOY / "data/mentoring/mentoring.json").read_text(encoding="utf-8"))
site = src["site"]

# 사례 단계(S0~S5) → Keep Mentor 단계(S0~S4)
KM_STAGE = {"S0": "S0", "S1": "S1", "S2": "S2", "S3": "S3", "S4": "S4", "S5": "S4"}
CASE_KEYS = ["id", "category", "title", "founder_says", "surface", "root", "diagnostic_questions", "session_flow",
             "prescription", "two_week_tasks", "success_signal", "mentor_pitfall", "resources", "dialogue", "applies_to"]

site_stage = {s["id"]: s for s in site["stages"]}


def norm_dialogue(items):
    out = []
    for x in items or []:
        if isinstance(x, dict):
            out.append({"who": x.get("who") or x.get("speaker") or "", "text": x.get("text", "")})
        else:
            t = str(x)
            for who in ("대표", "멘토"):
                for sep in (":", "："):
                    if t.startswith(who + sep):
                        out.append({"who": who, "text": t[len(who) + 1:].strip()})
                        break
                else:
                    continue
                break
            else:
                out.append({"who": "", "text": t})
    return out
stages, cases = [], []
for st in src["stages"]:
    meta = site_stage.get(st["stage"], {})
    stages.append({
        "code": st["stage"], "name": st["name"], "km_stage": KM_STAGE[st["stage"]],
        "question": meta.get("q", ""), "exit": meta.get("exit", ""), "focus": meta.get("focus", ""),
        "traps": meta.get("traps", []), "persona": st.get("persona_summary", ""),
        "exit_check": st.get("stage_exit_check", []), "takeaways": st.get("top_takeaways", []),
    })
    for i in st["issues"]:
        c = {k: i[k] for k in CASE_KEYS if k in i}
        c["dialogue"] = norm_dialogue(c.get("dialogue"))
        c.update({"stage": st["stage"], "km_stage": KM_STAGE[st["stage"]], "track": None})
        cases.append(c)

tracks = []
for key, tr in src["tracks"].items():
    t = {"code": key, "name": tr["name"], "summary": tr.get("summary", ""), "takeaways": tr.get("top_takeaways", [])}
    for extra in ("poc_playbook", "proposal_outline", "short_program", "report_example"):
        if extra in tr:
            t[extra] = tr[extra]
    tracks.append(t)
    for i in tr["issues"]:
        c = {k: i[k] for k in CASE_KEYS if k in i}
        c["dialogue"] = norm_dialogue(c.get("dialogue"))
        applies = i.get("applies_to") or []
        c.update({"stage": applies[0] if applies else None, "km_stage": KM_STAGE.get(applies[0]) if applies else None, "track": key})
        cases.append(c)

supplement = ROOT / "data/cases-supplement.json"
if supplement.exists():
    cases.extend(json.loads(supplement.read_text(encoding="utf-8")))
if len({c["id"] for c in cases}) != len(cases):
    raise ValueError("Duplicate case IDs")

out = {
    "source": {"name": site["title"], "edition": site.get("edition", ""), "built": src.get("built", ""),
               "url": "https://holyjoekang.github.io/joyhouse/mentoring.html",
               "origin": site.get("origin", {}).get("text", ""), "note": site.get("origin", {}).get("note", ""),
               "oneLiner": site.get("oneLiner", "")},
    "stages": stages, "tracks": tracks, "cases": cases,
}
dst = ROOT / "data/cases.json"
dst.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"cases {len(cases)} · stages {len(stages)} · tracks {len(tracks)} · {dst.stat().st_size // 1024} KB")
