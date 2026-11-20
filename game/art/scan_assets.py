"""掃描 assets 內實際存在的插畫，重新產生 js/art-available.js。

用法（在 game 資料夾）：
    python art/scan_assets.py

每次加入或替換插畫後跑一次，遊戲就只會載入真正存在的檔案，
未有的圖會自動 fallback 回 emoji，不會產生 404。
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART_JS = os.path.join(ROOT, "js", "art.js")
OUT_JS = os.path.join(ROOT, "js", "art-available.js")

with open(ART_JS, encoding="utf-8") as f:
    src = f.read()

cards = {}
for name, rel in re.findall(r"'([^']+)':\s*'assets/cards/([^']+)'", src):
    if os.path.exists(os.path.join(ROOT, "assets", "cards", rel)):
        cards[name] = True

themes = {}
for key, rel in re.findall(r"(teahouse|market|park):\s*'assets/ui/([^']+)'", src):
    if os.path.exists(os.path.join(ROOT, "assets", "ui", rel)):
        themes[key] = True

ui = {}
for key in ("hero", "coach", "cardback"):
    m = re.search(key + r":\s*'assets/ui/([^']+)'", src)
    ui[key] = bool(m and os.path.exists(os.path.join(ROOT, "assets", "ui", m.group(1))))

lines = []
lines.append("/* 由 art/scan_assets.py 自動產生，請勿手改。 */")
lines.append("window.YC_ART_AVAILABLE = {")
lines.append("  cards: {")
for name in cards:
    lines.append("    %s: true," % json.dumps(name, ensure_ascii=False))
lines.append("  },")
lines.append("  themes: {")
for key in themes:
    lines.append("    %s: true," % json.dumps(key))
lines.append("  },")
for key in ("hero", "coach", "cardback"):
    lines.append("  %s: %s," % (key, "true" if ui[key] else "false"))
lines.append("};")
lines.append("")

with open(OUT_JS, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))

print("cards %d / themes %d / hero %s / coach %s / cardback %s"
      % (len(cards), len(themes), ui["hero"], ui["coach"], ui["cardback"]))
print("written:", OUT_JS)
