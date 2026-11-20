# 試風格 5 張 — 可直接複製的 Prompt

先做這 5 張，確認風格後再批量生成其餘 60 張。

**共用設定**

- 1024×1024，1:1
- 每張生成 4 個變體
- 選：無文字、主體完整落在中央 70% 圓形內、米白底乾淨
- 卡面會裁成圓形，主體太貼邊會被裁走

---

## 1. 蝦餃 `th_har_gow.webp`

```text
a single steamed shrimp dumpling (har gow) with translucent pleated skin,
resting on a small round bamboo steamer liner, a faint wisp of steam,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

## 2. 燒賣 `th_siu_mai.webp`

```text
a single steamed pork-and-shrimp siu mai with a thin yellow wonton wrapper,
small orange crab roe on top, resting on a small round bamboo steamer liner,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

## 3. 茶壺 `th_teapot.webp`

```text
a small round brown clay teapot (Yixing style) with a short spout and a lid,
a faint wisp of tea steam, simple ceramic texture,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

## 4. 茶博士 `ui_coach.webp`

```text
a kindly middle-aged Hong Kong teahouse waiter, head and shoulders portrait,
short grey-black hair, warm gentle smile, looking at the viewer,
wearing a white short-sleeve shirt with a white towel over one shoulder,
simple friendly face, storybook character,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, elderly-friendly
```

## 5. 卡背 `ui_cardback.webp`

```text
a seamless repeating pattern of bamboo steamer lattice, tea leaves and tiny gold dots,
deep jade green background, thin antique gold lines,
flat decorative illustration, evenly distributed, no central focal point,
hand-painted gouache texture, subtle paper grain,
muted jade-green and antique gold palette,
no text, no letters, no border, square composition
```

> 卡背會整張鋪滿卡面，不需要真正的無縫；但圖案要平均分佈，不要有正中大圖案。

---

## Negative prompt（5 張共用）

```text
text, letters, numbers, Chinese characters, watermark, logo, signature,
photorealistic, 3D render, plastic, neon, cluttered background,
multiple unrelated objects, cropped subject, deformed hands, extra limbs,
dark background, horror, busy gradient, vignette
```

Midjourney 可加：

```text
--no text, letters, watermark, logo, photorealistic, 3D
```

---

## 生成後檢查

- [ ] 完全沒有文字、印章、價錢牌
- [ ] 米白底是單色，沒有漸變或花紋
- [ ] 主體完整，沒有被裁切
- [ ] 主體在中央 70% 圓形內
- [ ] 線條粗細與其他圖一致
- [ ] 食物看起來是長者一眼認得的樣子
- [ ] 茶博士友善、不誇張、不像漫畫反派

## 小技巧

1. 先生成蝦餃，選一張最滿意的。
2. 把該圖設為 style reference／image prompt，固定 seed，再生成其餘 4 張。
3. 如果某張出現文字或手部變形，直接重生，不要用手改。
4. 生成時記錄 model、prompt、seed，之後放進 `PROMPTS.md`。

