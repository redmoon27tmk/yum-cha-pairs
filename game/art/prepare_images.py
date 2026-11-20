"""把卡牌插畫自動裁切、放大，令主體填滿圓形碟。

用法（在 game 資料夾）：
    python art/prepare_images.py
    python art/prepare_images.py --force

流程：
1. 偵測米白背景，找出主體邊界
2. 加 7% 留白，補成正方形
3. 縮放到 1024×1024

已經夠滿的圖（主體 ≥ 80%）會自動跳過，所以可以重複執行。
"""
import os
import sys

from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD_DIR = os.path.join(ROOT, "assets", "cards")
THRESHOLD = 26
MARGIN = 0.07


def bg_color(img):
    w, h = img.size
    pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    cols = [img.getpixel(p) for p in pts]
    return tuple(sum(c[i] for c in cols) // len(cols) for i in range(3))


def prepare(path, force=False):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    bg = bg_color(img)
    diff = ImageChops.difference(img, Image.new("RGB", (w, h), bg)).convert("L")
    bbox = diff.point(lambda x: 255 if x > THRESHOLD else 0).getbbox()
    if not bbox:
        return "blank"

    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if not force and max(bw / w, bh / h) >= 0.80:
        return "skip"

    x0, y0, x1, y1 = bbox
    mx = int(bw * MARGIN)
    my = int(bh * MARGIN)
    box = (max(0, x0 - mx), max(0, y0 - my), min(w, x1 + mx), min(h, y1 + my))
    crop = img.crop(box)
    cw, ch = crop.size
    side = max(cw, ch)
    canvas = Image.new("RGB", (side, side), bg)
    canvas.paste(crop, ((side - cw) // 2, (side - ch) // 2))
    canvas.resize((1024, 1024), Image.Resampling.LANCZOS).save(
        path,
        "WEBP" if path.lower().endswith(".webp") else "PNG",
        **({"quality": 82, "method": 6} if path.lower().endswith(".webp") else {"optimize": True})
    )
    return "cropped"


def main():
    force = "--force" in sys.argv
    if not os.path.isdir(CARD_DIR):
        print("no assets/cards folder")
        return
    counts = {"cropped": 0, "skip": 0, "blank": 0}
    for name in sorted(os.listdir(CARD_DIR)):
        if not name.lower().endswith((".png", ".webp")):
            continue
        result = prepare(os.path.join(CARD_DIR, name), force)
        counts[result] += 1
        print("%-9s %s" % (result, name))
    print("cropped %(cropped)d / skipped %(skip)d / blank %(blank)d" % counts)


if __name__ == "__main__":
    main()
