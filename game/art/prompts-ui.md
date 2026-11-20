# 首頁主角 + 3 個主題 icon — 生成 Prompt

- 4 張都是 1024×1024、1:1、每張 4 個變體
- 不要文字、不要邊框
- 主角會放在首頁的大圓（直徑約 138px）；3 個 icon 會放在主題卡的小圓（約 51px）
- Icon 用「彩色圓底 + 米白圖案」，在 51px 仍然清楚

---

## 1. 首頁主角 `ui_hero_steamer.webp`

```text
a round bamboo steamer filled with assorted dim sum, top-down view,
har gow, siu mai, a white bun and a small egg tart arranged neatly,
warm and inviting, a soft hint of steam at the edges,
warm hand-painted gouache illustration, thick soft dark-brown outlines, muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6, soft contact shadow, no text, no letters, no border, square composition, storybook charm, highly recognisable, elderly-friendly
```

## 2. 茶樓 icon `ui_theme_teahouse.webp`

```text
a simple circular badge icon, warm terracotta background filling the frame,
a cream-coloured bamboo steamer with a single white bao bun in the centre,
flat hand-painted gouache illustration, thick soft dark-brown outlines,
muted terracotta, cream and antique gold palette, subtle paper grain,
single centered subject, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

## 3. 街市 icon `ui_theme_market.webp`

```text
a simple circular badge icon, muted jade-green background filling the frame,
a cream-coloured woven basket filled with leafy greens and one small tomato,
flat hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, cream and terracotta palette, subtle paper grain,
single centered subject, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

## 4. 公園 icon `ui_theme_park.webp`

```text
a simple circular badge icon, deep jade-green background filling the frame,
a cream-coloured leafy tree with a simple park bench underneath,
flat hand-painted gouache illustration, thick soft dark-brown outlines,
muted deep green, cream and antique gold palette, subtle paper grain,
single centered subject, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

---

## 檢查

- [ ] 圓底顏色填滿整個正方形，四角都是同一顏色（CSS 會裁成圓形）
- [ ] 圖案是米白色，和圓底有足夠對比
- [ ] 51px 縮細後仍然認得
- [ ] 沒有文字、沒有白邊、沒有陰影以外的裝飾
- [ ] 3 個 icon 的線條粗細一致

> 如果某個 icon 縮到 51px 後太複雜，可以把主體再簡化：茶樓留蒸籠＋包、街市留籃＋菜、公園留樹＋長椅，其他細節全部刪。

