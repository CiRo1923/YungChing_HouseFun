---
name: popup-system
description: 修改 popup(alert / confirm / custom / apiPromise)的顯示狀態機、Promise 結算、進出場動畫前必須先讀。記錄兩條不可違反的不變式,以及它們各自防住的三個 bug(死鎖打不開、Promise 永久 pending、TypeError 連鎖)。觸發時機 - 要改 components/common/mPopup/Index.vue、stores/.composables/usePopupActions.js、containers/common/{CustomPopup,AlertSystem,ConfirmSystem,ApiPromiseSystem}.vue、components/common/mPopup/.css/*.css、assets/css/_common/vueTransition.css 的 popup 段落;或使用者回報 popup「打不開 / 只剩遮罩 / 關不掉 / 動畫沒播 / 流程卡住不往下走」。
---

<!-- lint-project-name-exempt: 這支只有本專案有,不會複製到別的專案;內容是 popup 涉及哪幾支檔案,路徑是要記錄的資料本身 -->

# Popup 系統

全站只有一個 popup 顯示層。**同一時間只會有一個 popup 可見**,由 `keyID` 的優先序決定:
`alertData.id || confirmData.id || customData.id || apiPromiseData.id`。

popup 的機制與並排的另一個專案是同一套:相同的檔案位置、相同的開啟函式、
相同的兩條不變式。**樣式與每一次開啟時傳入的設定各自獨立**,不必一致。

## 檔案分工

| 檔案                                            | 負責                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stores/popup.js`                               | 狀態:`alertData` / `confirmData` / `customData` / `apiPromiseData`(各含 `id`)、`alertCheck` / `confirmCheck` / `customCheck`(Promise 的 resolver)、`buttons`(alert / confirm 的基準按鈕) |
| `stores/.composables/usePopupActions.js`        | 開啟 / 關閉 / 結算。**是唯一能碰 `xxxCheck` 的地方**                                                                                                                                       |
| `components/common/mPopup/Index.vue`            | 顯示狀態機與兩層 Transition。每個 popup 實例比對 `props.id === keyID`                                                                                                                      |
| `containers/common/*.vue`                       | 各型別的外框(AlertSystem / ConfirmSystem / CustomPopup / ApiPromiseSystem)                                                                                                                 |
| `components/common/mPopup/.css/variables.css`   | 尺寸 / 色彩變數與 `--w-1200` ~ `--w-300` 寬度修飾符。改樣式優先動這裡                                                                                                                      |
| `components/common/mPopup/.css/common.css`      | `.m-popup*` 的版面規則(由 `Index.vue` import)                                                                                                                                              |
| `assets/css/_common/vueTransition.css`          | 全站共用的轉場動畫,依效果命名(`anim-fade-out-late` / `anim-bounce` / `anim-zoom` / `anim-slide-up-late` 等)。**不得出現 `.m-xxx` 選擇器**                                                |

## 三種進出場模式

`config.mode` 接受 `'bomb'` / `'zoom'` / `'bottomSheet'`,也可以用物件依裝置各給一種
(`{ p: 'zoom', m: 'bottomSheet' }`,鍵是 `p` / `pt` / `tm` / `t` / `m`)。

模式名不直接當成動畫名 —— 轉場的名字講的是「什麼效果」,不綁哪一支元件在用,
所以 `Index.vue` 裡明寫一份對照:

```js
const MODE_ANIMATIONS = {
  zoom: 'anim-zoom',
  bomb: 'anim-bounce',
  bottomSheet: 'anim-slide-up-late',
}
```

模式這個值同時決定兩件事,所以**新增一種模式時三個地方都要有,少一個不會報錯**:

| 用途             | 產生的東西                     | 定義在                                       |
| ---------------- | ------------------------------ | -------------------------------------------- |
| 進出場動畫       | 對照表指到的 `anim-*`          | `assets/css/_common/vueTransition.css`       |
| 模式與動畫的對應 | `MODE_ANIMATIONS` 的一筆       | `components/common/mPopup/Index.vue`         |
| 容器在畫面上的位置 | `.--<模式>` 修飾符            | `components/common/mPopup/.css/common.css`   |

對照表漏了那一筆會落回 `anim-zoom`(播錯動畫);修飾符漏了則是容器少掉定位規則、
貼在左上角。兩種都不會有錯誤訊息。

`bomb` 與 `zoom` 的版面相同,差別只在動畫曲線(bomb 會過衝再回彈),
所以 `.--bomb` 與 `.--zoom` 共用同一段定位規則,不是各寫一份。

**兩組 keyframes 的名字必須不同。** 同名的後者會蓋掉前者,而 CSS 不會有任何警告 ——
症狀是某一種模式播出了另一種的動畫。

---

## 不變式 1:顯示狀態由 `watch(isOpen)` 驅動,禁止依賴 transition 事件

`Index.vue` 有兩個 flag,對應兩層 Transition:

```js
const isShowOverlay = ref(false) // 外層 .m-popup(遮罩)
const isShowPopup = ref(false) // 內層 .m-popup-container(內容)

watch(
  isOpen,
  async (open) => {
    if (!open) {
      isShowPopup.value = false // container 先退場,遮罩等它的 @afterLeave
      return
    }

    isShowOverlay.value = true
    await nextTick() // 等遮罩掛上,內層 Transition 才存在
    if (isOpen.value) isShowPopup.value = true
  },
  { immediate: true }
)

// 只在「確實已關閉」時才收遮罩
const onAfterLeave = () => {
  if (!isOpen.value) isShowOverlay.value = false
}
```

**三個細節都是必要的,不可簡化:**

1. **`await nextTick()`** — 內層 Transition 必須先掛載,之後的 `isShowPopup` 切換才算「`v-if` 由 false→true」而會播 enter。若兩層同時切換,內層對 Vue 而言是「初次渲染」,**不加 `appear` 就不播動畫**。
2. **`if (isOpen.value)`(nextTick 後)** — 快速開關時 `nextTick` 之間可能已被關閉。
3. **`if (!isOpen.value)`(onAfterLeave 內)** — A → B → 上一步 → A 時,返回 A 的退場可能還沒走完,此時 `isOpen` 已回 `true`,遮罩不能收。

另外兩層都必須維持 `v-if`,**不要改成 `v-show`**(會讓每個 popup 常駐一個 `.m-popup`
在 DOM,污染 `querySelector`)。

### 這種寫法會死鎖,不要改成這樣

```js
// 不可採用
const onOverlayEnter = () => {
  if (isOpen.value) isShowPopup.value = true
}
// 外層 v-if="isOpen || isShowOverlay"
```

`isShowPopup` 只能靠 `@enter` 點亮,而重開時外層 `v-if` 是 `true → true`(遮罩還沒退場完),
**元素沒有從無到有 → `@enter` 不觸發** → `isShowPopup` 停在 `false` → 沒有內層 leave →
`@afterLeave` 永遠不來 → `isShowOverlay` 永遠 `true` → 永遠不會再有 `@enter`。
**該 popup 從此開不起來,只能重整頁面。**

這個死鎖不一定測得出來:重開之前只要有一段 `await`(例如 AutoRefresh 流程開頭那支 API,
加上 `onApiPromise('open')` 會佔用 `keyID`),前一個 popup 就有時間走完退場,症狀被蓋掉。
**「純前端的上一步」(不打 API)會立刻踩中。**

---

## 不變式 2:Promise 只能經由 `onSettle` 結算

`onCustom()` / `onAlert()` / `onConfirm()` 回傳 Promise,resolver 存在單一插槽 `xxxCheck`。

```js
// usePopupActions.js — 唯一的結算出口
const onSettle = (checkRef, isSure = false, item = null) => {
  const resolve = checkRef.value

  checkRef.value = null // 先清空
  resolve?.(isSure, item) // 再呼叫,且 null 安全
}
```

**順序是刻意的**:先清空再呼叫。`resolve` 的續行若立刻再開一個 popup,新的 resolver
才不會被這裡的清空蓋掉。

### 三條規則

1. **關閉即結算** — `onAlertClose` / `onConfirmClose` / `onCustomClose` 簽章都是 `(isSure = false, item = null)`,內部一律呼叫 `onSettle`。X 鈕與 `onReset()` 走預設值,語意是「使用者沒有確認」。
2. **開啟前先結算** — `onAlert` / `onConfirm` / `onCustom` 開頭都要 `onSettle(xxxCheck)`,把上一個沒關就被蓋掉的 resolver 收乾淨,否則它的 `await` 永久 pending。
3. **元件不得直接呼叫 `xxxCheck.value(...)`** — 一律走 `onXxxClose(isSure, item)`;需要「回報結果但不關閉」(`isClose: false` 的按鈕自行驗證後回報)時用 `onCustomSettle(isSure, item)`。

---

## 三個 bug(症狀 → 根因)

| 症狀                                                             | 根因                                                                                                                                 | 防線                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| popup **再也打不開**,只剩半透明遮罩,console 無錯誤               | 不變式 1:`isShowPopup` 依賴 `@enter`,錯過一次就死鎖                                                                                  | `watch(isOpen)` 無條件設定          |
| `await onCustom(...)` **之後的程式碼永不執行**(流程卡住)         | 不變式 2:close 只清空 resolver、不呼叫                                                                                               | `onSettle` 統一結算                 |
| `alertCheck.value is not a function`,之後**所有** popup 都打不開 | 元件直接呼叫已是 `null` 的 resolver,拋錯中斷了後面的 `onAlertClose()`,`alertData.id` 卡住 → `keyID` 永遠是 `alertSystem`(優先序最高) | `onSettle` 用 `?.`,元件不再直接呼叫 |

**除錯對照**:症狀是「只剩遮罩」→ 看不變式 1;「流程不往下走」→ 看不變式 2;
console 有 `is not a function` → 第三條。

---

## 動到 popup 後的驗證

`npm run build` 通過只代表沒語法錯,**動畫與死鎖一定要在瀏覽器實測**:

1. **A → B → 上一步 → A** — 用 AutoRefresh 流程,但**把中間的 API 等待拿掉**再測一次(那個延遲會掩蓋死鎖)
2. **連續開關同一個 popup**(退場動畫還在跑時就重開)
3. **zoom 進出場**動畫是否正常
4. `grep "Check\.value"` 應該**只剩** `stores/.composables/usePopupActions.js` 內設定 resolver 的三處

判斷「死鎖」:DOM 裡找得到 `.m-popup` 但**沒有** `.m-popup-container`,且 console 無錯誤。

---

## CSS 動畫編排

進出場的先後**全部靠 CSS delay**,JS 不參與時序:

外層遮罩用「淡出慢半拍」那一組,內層內容用帶進場 delay 的那一組,兩邊的 delay 互相搭配:

```css
/* 外層遮罩:離場等 container 先收完 */
.anim-fade-out-late-enter-active,
.anim-fade-out-late-leave-active {
  @apply transition-opacitys duration-200;
}
.anim-fade-out-late-leave-active {
  transition-delay: 0.15s;
}

/* 內層內容:進場等遮罩先浮現 */
.anim-zoom-enter-active {
  animation: anim-zoom 0.1s 0.15s both;
}
.anim-zoom-leave-active {
  animation: anim-zoom 0.1s reverse both;
}
```

**`vueTransition.css` 內不得出現 `.m-xxx` 選擇器**(只有註解可提及元件名)。需要綁元件 class
的規則放到該元件自己的 CSS 模組。

那一支是全站共用的,裡面的動畫**依效果命名、不綁使用它的元件** —— 同一組
`anim-fade-out-late` 同時給彈窗的遮罩與等待提示的遮罩用。改秒數之前先確認還有誰在用。

---

## 改動前的檢查清單

- [ ] 沒有讓 `isShowPopup` 的點亮依賴任何 transition 事件(`@enter` / `@after-enter`)
- [ ] `onAfterLeave` 內保留 `if (!isOpen.value)`
- [ ] `watch` 內保留 `await nextTick()` 與後續的 `if (isOpen.value)`
- [ ] 所有關閉路徑最終都會呼叫 `onSettle`(含 X 鈕的 `onReset()`)
- [ ] `grep "Check\.value"` 只在 `stores/.composables/usePopupActions.js` 有結果
- [ ] `vueTransition.css` 的 popup 段落沒有 `.m-xxx` 選擇器
- [ ] 兩層都是 `v-if`
- [ ] 尺寸 / 色彩改在 `components/common/mPopup/.css/variables.css`,沒有把數值寫死回 `Index.vue` 的 template
- [ ] 新增進出場模式時,`MODE_ANIMATIONS` 的一筆、對應的 `anim-*` 動畫、`.--<模式>` 的定位規則三者都有
- [ ] 每一組 keyframes 的名字都不重複(同名會安靜地互相覆蓋)

## 多步流程的寫法

「上一步」的慣例是 `type: 'cancel'` + `isClose: true`,再用 `item.id === 'back'` 區分是取消還是返回
(見 `pages/buy/_components/AutoRefreshAddTimeAnchor.vue`)。

流程控制用 `while (true)` + `continue` 或遞迴皆可 —— 效能差異在此場景可忽略
(10000 次往返只差 1.1 µs)。`while` 的堆疊固定、流程集中在一個函式;遞迴的語意較貼近
「回到上一步」但每往返一層堆疊 +1。步驟多於 3 個時改用 `step` 狀態機較好讀。
