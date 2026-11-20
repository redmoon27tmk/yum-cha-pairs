"""把所有遊戲圖片轉成 WebP。

用法（在 game 資料夾）：
    python art/convert_webp.py
    python art/convert_webp.py --keep   # 保留原 PNG

- assets/cards：quality 82
- assets/ui：quality 88
- screenshots：quality 85
轉檔成功後會刪除原 PNG；失敗會保留原檔。
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGETS = [
    (os.path.join(ROOT, "assets", "cards"), 82),
    (os.path.join(ROOT, "assets", "ui"), 88),
    (os.path.join(ROOT, "screenshots"), 85),
]


def convert(path, quality):
    img = Image.open(path)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    out = os.path.splitext(path)[0] + ".webp"
    img.save(out, "WEBP", quality=quality, method=6)
    return out


def main():
    keep = "--keep" in sys.argv
    total_before = 0
    total_after = 0
    count = 0
    for folder, quality in TARGETS:
        if not os.path.isdir(folder):
            continue
        for dirpath, _, files in os.walk(folder):
            for name in sorted(files):
                if not name.lower().endswith(".png"):
                    continue
                path = os.path.join(dirpath, name)
                try:
                    before = os.path.getsize(path)
                    out = convert(path, quality)
                    after = os.path.getsize(out)
                except Exception as exc:
                    print("FAIL    %s  (%s)" % (path, exc))
                    continue
                total_before += before
                total_after += after
                count += 1
                if not keep:
                    os.remove(path)
                print("%-7s %6.1fKB -> %6.1fKB  %s" % (
                    "ok", before / 1024, after / 1024, os.path.relpath(out, ROOT)))
    print("converted %d files" % count)
    if count:
        print("total %.1f MB -> %.1f MB" % (total_before / 1048576, total_after / 1048576))


if __name__ == "__main__":
    main()
