# 一盅兩件 — AI 插畫製作指南

這份文件是給負責生成插畫的隊友：照著做，輸出的圖可以直接放進遊戲，不需要再裁切或去背。

---

## 1. 風格定位

**一句話**：溫暖的手繪繪本風，像一本講舊香港茶樓的圖畫書。

- 媒材感：水粉／ gouache，淡淡紙紋，不是 3D、不是寫實照片。
- 線條：粗而柔和的深啡色輪廓，轉角圓潤。
- 用色：茶樓綠、棗紅、蛋黃、米白；低飽和、不刺眼。
- 構圖：**單一物件、置中、完整落在中央 70% 圓形內**，四周留米白位；卡面會裁成圓形，太貼邊會被裁走。
- 背景：**純淨暖米白 `#FBF4E6`**，不要漸變、不要花紋、不要邊框。
- 氣質：親切、懷舊、乾淨；不要可愛到幼稚，也不要老氣。

> 卡面會用「圓形碟」方式顯示，所以圖片只需要正方形＋米白底，不需要透明背景。

---

## 2. 提示詞

### 2.1 主風格（每張圖都要加在 subject 後面）

```text
, warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

### 2.2 Negative prompt

```text
text, letters, numbers, watermark, logo, signature, photorealistic, 3D render,
neon, cluttered background, multiple unrelated objects, cropped subject,
deformed hands, extra limbs, dark background, horror, busy patterns
```

### 2.3 兩個完整範例

**蝦餃**

```text
a single steamed shrimp dumpling (har gow) with translucent pleated skin,
resting on a small bamboo steamer liner,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

**茶博士（頭像）**

```text
a friendly middle-aged Hong Kong teahouse waiter, head and shoulders,
white short-sleeve shirt, white towel over one shoulder, warm smile,
warm hand-painted gouache illustration, thick soft dark-brown outlines,
muted jade-green, terracotta and cream palette, subtle paper grain,
single centered subject, plain warm cream background #FBF4E6,
soft contact shadow, no text, no letters, no border, square composition,
storybook charm, highly recognisable, elderly-friendly
```

---

## 3. 技術規格

| 項目 | 規格 |
|---|---|
| 尺寸 | 1024×1024（最少 768×768） |
| 比例 | 1:1 正方形 |
| 背景 | 暖米白 `#FBF4E6`，單色、無漸變 |
| 主體 | 單一物件，置中，完整落在中央 70% 圓形內（卡面會裁圓） |
| 文字 | **完全不要有文字**（中文名由遊戲加上去） |
| 陰影 | 只留物件下方柔和接觸陰影 |
| 格式 | 生成 PNG / JPG 均可；入庫前統一轉成 WebP |
| 風格 | 全部用同一組 prompt、同一個 model、同一個 seed／reference |

不要在圖裡加圓框、標籤、價錢牌、文字、浮水印；這些由 CSS 負責。

---

## 4. 生成流程

1. **先做一張 `th_har_gow.webp`**，確認風格、線條粗細、米白底色。
2. 把這張圖設為 reference／style reference，固定 seed，再批量生成其餘。
3. 每張生成 4 個變體，選：
   - 主體最清楚、最大
   - 沒有多餘物件
   - 沒有文字或類似文字的符號
   - 米白底乾淨
4. 生成時順手記錄：模型、prompt、seed、日期（提交要放進 `PROMPTS.md`）。
5. 全部放入 `game/assets/cards/`，檔名跟 `art-list.csv`。

> 如果某張圖出現文字、手部變形、主體被裁切，直接重生，不要用手改；風格一致性比單張完美重要。

---

## 5. 檔案與命名

```text
game/
  assets/
    cards/     ← 59 張卡牌插畫
    ui/        ← 卡背、主角、茶博士、3 個主題 icon
```

- 全部小寫、底線，例如 `th_har_gow.webp`、`mk_choy_sum.webp`、`pk_tai_chi.webp`。
- 同一個物件只生成一次：
  - 蘋果 `mk_apple.webp`：街市與公園共用
  - 報紙 `th_newspaper.webp`：茶樓與公園共用
- 檔名、中文名、英文 subject 全部在 `art-list.csv`。

---

## 6. 優先次序

| 優先 | 內容 | 張數 | 說明 |
|---|---|---|---|
| **P0** | 茶樓 21 張 ＋ 卡背 ＋ 主角 ＋ 茶博士 | 24 | 主視覺，先做這個 |
| **P1** | 街市 21 張 | 21 | 第二個主題 |
| **P2** | 公園 17 張 | 17 | 第三個主題 |
| **P3** | 3 個主題 icon | 3 | 首頁用；沒有也可先用 emoji |

**如果時間只夠做一組**：做 P0。茶樓是預設主題，評審第一眼看到的就是它。

---

## 7. 整合方式（已接好）

- `js/art.js` 已建立「中文名 → 檔案路徑」對照表。
- 把圖放進 `assets/cards/`、`assets/ui/`。
- 先執行一次自動裁切（主體偏細的圖會被放大）：

  ```text
  python art/prepare_images.py
  ```

- 再執行一次掃描：

  ```text
  python art/scan_assets.py
  ```

  它會掃描實際存在的檔案，更新 `js/art-available.js`；遊戲只會載入真正存在的圖。
- **缺圖會自動 fallback 回 emoji，不會爆版、不會 404。**
- 卡面以圓形「碟」顯示，圖片會自動裁成圓形，不需要另行去背。
- 卡背、主角、茶博士、主題 icon 也是同樣的 fallback 機制。

---

## 8. 授權與記錄

- 大會允許 AI 生成素材，但**禁止第三方素材包**；所以請用自己生成的圖，不要用網上圖庫。
- 每張圖的 prompt、model、seed 要留記錄，提交時放進 `PROMPTS.md`。
- 生成時避免直接模仿在世藝術家；用「hand-painted gouache / storybook」這類風格描述即可。

---

## 9. 一頁 checklist

- [ ] 先生成 `th_har_gow.webp`，確認風格
- [ ] 固定 reference + seed
- [ ] 59 張卡牌（茶樓 21／街市 21／公園 17，蘋果與報紙共用）
- [ ] 卡背 `ui_cardback.webp`
- [ ] 主角 `ui_hero_steamer.webp`
- [ ] 茶博士 `ui_coach.webp`
- [ ] 3 個主題 icon
- [ ] 全部 1024×1024、米白底、無文字
- [ ] 檔名跟 `art-list.csv`
- [ ] 放入 `assets/cards/`、`assets/ui/`
- [ ] 執行 `python art/prepare_images.py`（自動裁切放大）
- [ ] 執行 `python art/scan_assets.py`
- [ ] 重新載入遊戲，缺圖會 fallback emoji
- [ ] 記錄 prompt / model / seed


