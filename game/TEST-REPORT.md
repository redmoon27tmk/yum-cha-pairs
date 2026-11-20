# 遊戲測試報告

**日期**：2026-11-10  
**環境**：Windows、Microsoft Edge（headless Chromium）、1024×768、`file://` 直接開啟、無伺服器  
**版本**：59 張卡牌插畫＋6 張 UI＋繁中／簡中／英文三語（全部 WebP）＋總計時

---

## 1. 自動流程測試

執行 `index.html?autotest=1`，自動順序完成 **3 個主題 × 5 關 = 15 關**，每關自動翻牌配對、結算，並檢查：

- 卡牌數量 = 對數 × 2
- 每張卡都有插畫（`missingArt = 0`）
- 配對完成、進入結算
- 五關後進入完成畫面

**結果：15/15 PASS**

| 主題 | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| 茶樓 | PASS | PASS | PASS | PASS | PASS |
| 街市 | PASS | PASS | PASS | PASS | PASS |
| 公園 | PASS | PASS | PASS | PASS | PASS |

額外檢查：

- **錯誤配對＋提示**：`interaction=PASS`
- **五關完成畫面**：`finalScreen=PASS`
- 每關 `missingArt=0`

### 離線重跑

同一測試在**封鎖 DNS** 下重跑：

```text
--host-resolver-rules="MAP * ~NOTFOUND"
```

**結果相同：15/15 PASS、interaction PASS、finalScreen PASS、missingArt=0。**

---

## 2. 插畫覆蓋

- 卡牌：59 / 59
- UI：主角、茶博士、卡背、3 個主題 icon，共 6 / 6
- 自動流程中每關 `missingArt = 0`

### WebP 轉檔（2026-11-14）

- 全部 120 張圖（65 張 assets＋55 張截圖）已轉 WebP。
- 卡牌 q82、UI q88、截圖 q85，尺寸不變（卡牌/UI 仍是 1024×1024）。
- 圖片總量：**81.5 MB → 約 5.0 MB**。
- 相簿已改為文字印章，**不載入任何插畫**。
- `js/art.js`、`art-list.csv`、`README`、截圖連結全部改為 `.webp`。

---

## 3. 125% 字級＋高對比

截圖（1024×768）：

- [首頁 125%＋高對比](screenshots/test/home-125-hc.webp)
- [首頁 100%＋高對比](screenshots/test/home-100-hc.webp)
- [茶樓 L1 125%＋高對比](screenshots/test/teahouse-L1-125-hc.webp)
- [街市 L5 125%＋高對比](screenshots/test/market-L5-125-hc.webp)
- [公園 L2 125%＋高對比](screenshots/test/park-L2-125-hc.webp)
- [結算 125%＋高對比](screenshots/test/result-125-hc.webp)

### 發現並修正

- **問題**：首頁在 125%＋高對比下，最底部「第 1 關 · 3 對卡 · 約 2 分鐘」被切掉。
- **原因**：主題卡改用插畫後，圖示由 emoji 的 35px 變成 51px，令首頁高了約 16px。
- **修正**：
  - 主題 icon 由 3.2rem 收細到 2.8rem
  - 125% 時再收至 2.5rem
  - 首頁 gap 由 .7rem 收至 .6rem
- **重測**：125%＋高對比首頁已完整顯示，底部仍有約 20px 空間。

三個主題的 L1／L5／L2 與結算畫面，在 125%＋高對比下都完整落在 1024×768 內。

---

## 4. 離線與外部資源

- 執行檔案（`js`／`html`／`css`）搜尋 `http`、`fetch`、`XMLHttpRequest`、`@import`、外部 `url()`：**0 個匹配**
- 所有圖片、聲音（Web Audio 合成）、字體（系統字體）均為本地
- DNS 封鎖下完整流程仍 PASS

> 注意：語音用瀏覽器 `speechSynthesis`，是否完全離線取決於作業系統有無本地粵語聲；今次測試關閉了語音。

---

## 5. 存檔

自動流程完成後，重新載入首頁：

- 「繼續上次」按鈕正常出現
- 表示 `localStorage` 進度有寫入

---

## 6. 未覆蓋 / 限制

- 今次只測 **Edge / Chromium、Windows、1024×768**；未測 Safari、Firefox、iPad。
- 自動流程是「完美玩家」，每關 3 星、0 提示；未模擬長者實際失誤率與難度曲線。
- 錯誤配對與提示已測，但「連續錯 2 次自動提示」未單獨斷言。
- 語音、音效只確認不會令流程失敗，未做主觀聽感測試。
- 更矮的視窗（如 1366×600）可能出現滾動，未測。

---

## 7. 手機版（2026-11-10 追加）

用 CDP 模擬以下直向手機尺寸：

- 390×844（iPhone 14 / 15 類）
- 375×667（iPhone SE 類）
- 360×740（Android 常見）

測試畫面：首頁、茶樓 L5（10 張卡）、街市 L2（8 張卡）、結算 L5、快速設定、設定、教學、相簿、完成、英文首頁／英文遊戲、390 寬 125% 字級遊戲。

### 結果

- 三個尺寸都**沒有橫向溢出**，主要按鈕都在畫面內。
- L5 10 張卡在 390／375×667／360 都完整顯示。
- 結果頁 5 格點心紙改為 3＋2，卡名不再被壓扁。
- 相簿改單欄，長回憶可讀。
- 英文卡名在 390 寬可正常換行。
- 390 寬 125% 字級：首頁與 L5 遊戲仍完整（按鈕貼近底部但仍可見）。

### 修正

- 原本結果頁 inline `grid-template-columns: repeat(5,1fr)` 在手機把 5 格壓成一行；改為 flex 3＋2。
- 360×740 原本 L5 的提示列被切；縮短卡牌高度、gap、coach 與 actionbar。
- 375×667（矮螢幕）L5 改 4 欄，10 張卡 4＋4＋2，避免要捲動才按到提示。
- 結果頁改垂直居中，不再得 top-heavy。
- 語言切換增至 45px、設定開關增至 42px，方便長者點按。
- 手機首頁隱藏空的 top-center，減少頂欄高度。

### 截圖

- [手機首頁](screenshots/mobile/home-390.webp)
- [手機 L5（390）](screenshots/mobile/game-L5-390.webp)
- [手機 L5（375×667，4 欄）](screenshots/mobile/game-L5-375x667.webp)
- [手機結果 L5](screenshots/mobile/result-L5-390.webp)
- [手機設定](screenshots/mobile/settings-390.webp)
- [手機相簿](screenshots/mobile/album-390.webp)
- [手機 L5 125%](screenshots/mobile/game-L5-390-125.webp)
- [英文手機首頁](screenshots/mobile/home-en-390.webp)

### 限制

- 只針對直向手機；橫向會沿用桌面／平板版面。
- 用 Chromium 裝置模擬，未在真實 iPhone Safari／Android Chrome 上手測。
- iPhone Safari 的網址欄與底部工具列會再食高度，實際可視高度可能比 844 少，屆時可上下捲動。

---

## 8. 多語言（2026-11-10 追加）

- 主頁右下角加入 **繁 / 简 / EN** 語言切換，選擇寫入 `localStorage`。
- 切換範圍：介面、關卡名、主題名、卡名、提示、回憶、語音語言。
- 用 CDP 實測點擊：
  - 按 EN → `html lang="en"`、`Start game`、`saved="en"`。
  - 重新載入 → 仍然英文、`active="en"`。
  - 按简 → `html lang="zh-Hans"`、`开始游戏`、`saved="zh-Hans"`。
- 三語各跑一次離線自動流程：
  - 繁中：**15/15 PASS**
  - 英文：**15/15 PASS**
  - 簡中：**15/15 PASS**
  - 三者 `interaction=PASS`、`finalScreen=PASS`。
- 排版測試：
  - 英文／簡中首頁 100%、125%＋高對比：完整顯示。
  - 英文／簡中遊戲 125%：卡牌、提示、按鈕完整。
  - 英文第五關結算（5 格、長卡名）：完整，無溢出。
  - 英文設定 125%：完整，Done 可見。
  - 英文教學、英文相簿：正常。
- 相簿改為文字印章，不顯示任何插畫。

截圖：[英文首頁](screenshots/i18n/home-en.webp)・[簡中首頁](screenshots/i18n/home-zh-Hans.webp)・[英文遊戲](screenshots/i18n/game-en.webp)・[英文結算](screenshots/i18n/result-en.webp)・[英文相簿](screenshots/i18n/album-en.webp)・[英文設定 125%](screenshots/i18n/settings-en-125.webp)・[英文教學](screenshots/i18n/tutorial-en.webp)・[英文 125% 高對比](screenshots/i18n/home-en-125-hc.webp)

### 今次修正

- 英文 `Tea Master:` 後補空格。
- 英文介面取消中文字距。
- 英文教學「Next」按鈕壓住圓點。
- 英文第五關點心紙 5 格因 `white-space:nowrap` 衝出紙邊。
- 英文設定 125% 的 Done 被 cut，已壓縮 modal。
- 相簿不再顯示插畫，改用文字印章。

### 限制

- 簡體版由 OpenCC 由繁體轉換，保留香港粵語口語（「嚟」「唔」「咗」），不是普通話改寫。
- 英文卡名、提示、回憶由作者翻譯，未經母語者校對。
- 語音仍用瀏覽器 `speechSynthesis`；英文／簡中聲取決於系統。

---

## 9. 總計時器（2026-11-19）

### 設計

- **正計時**（count-up），不是倒數。
- 遊戲右上角一直顯示「總時間 mm:ss」；超過一小時顯示 `h:mm:ss`。
- 每個主題分開累計；由該主題第 1 關開始時歸零，「繼續上次」會接住之前總時間。
- 暫停、設定、結算畫面不計時；只計實際玩卡牌的時間。
- 結算頁加「總時間」一行；完成頁顯示該主題 5 關的總時間。
- 總時間寫入 `localStorage` 的 `totals`，逐主題保存。
- 原本的「完成時間」改名為「本關時間」，避免和總時間混淆。

### 實測

- 第 2 關玩 2.6 秒 → 開設定暫停：
  - 右上角：`00:03`
  - 儲存：`teahouse: 3.233`
- 重新載入完成畫面：
  - 右上角：`00:03`
  - 完成頁總時間：`00:03`
- 自動流程 15/15 關仍 **PASS**（`interaction=PASS`、`finalScreen=PASS`）。

### 版面

- 桌面 1024×768：右上角計時器、結算總時間行、完成頁總時間都完整。
- 手機 390×844：頂欄品牌＋計時器＋設定同一行；結算與完成頁完整。
- 手機 390×844＋125% 英文：計時器標籤自動隱藏，只顯示 `⏱ 00:01`；結算頁經壓縮後「Finish」與底部連結都可見。

### 截圖

- [桌面遊戲＋總計時](screenshots/timer/game-1024.webp)
- [桌面結算＋總時間](screenshots/timer/result-1024.webp)
- [桌面完成＋總時間](screenshots/timer/final-1024.webp)
- [手機遊戲＋總計時](screenshots/timer/mobile-game-390.webp)
- [手機結算＋總時間](screenshots/timer/mobile-result-390.webp)
- [桌面 125% 結算](screenshots/timer/result-125.webp)
- [手機 125% 結算](screenshots/timer/mobile-result-125.webp)
- [手機 125% 英文遊戲](screenshots/timer/mobile-game-125-en.webp)

### 限制

- 只計遊戲畫面時間；停留在結算、相簿、主頁不計。
- 瀏覽器分頁在背景時仍會繼續計；長者休息時可先按「暫停」。
- 每個主題分開計；不是三個主題合共一個總數。

---

## 10. 結論

- 三個主題 × 五關、125% 字級、高對比、離線：**全部通過**
- 繁中／英文／簡中三語各自 15/15 關 PASS
- 59 張卡牌插畫全部載入，無缺失
- 語言切換、重新載入後保留、三語排版：**通過**
- 手機 390×844、375×667、360×740 直向版面：**通過**
- 總計時（正計時、暫停不計、逐主題儲存、結算／完成顯示）：**通過**
- 可以重新打包 zip 交付


