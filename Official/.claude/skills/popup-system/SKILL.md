---
name: popup-system
description: 修改 popup(alert / confirm / custom / apiPromise)的顯示狀態機、Promise 結算、進出場動畫前必須先讀。記錄兩條不可違反的不變式與三個已修過的 bug(死鎖打不開、Promise 永久 pending、TypeError 連鎖)。觸發時機 - 要改 components/common/mPopup/Main.vue、stores/.composables/usePopupActions.js、containers/common/{CustomPopup,AlertSystem,ConfirmSystem,LoginSyetem}.vue、assets/css/_common/vueTransition.css 的 popup 段落;或使用者回報 popup「打不開 / 只剩遮罩 / 關不掉 / 動畫沒播 / 流程卡住不往下走」。
---

# Popup 系統

全站只有一個 popup 顯示層。**同一時間只會有一個 popup 可見**,由 `keyID` 的優先序決定:
`alertData.id || confirmData.id || customData.id || apiPromiseData.id`。

## 檔案分工

| 檔案 | 負責 |
|---|---|
| `stores/popup.js` | 狀態:`alertData` / `confirmData` / `customData` / `apiPromiseData`(各含 `id`)、`alertCheck` / `confirmCheck` / `customCheck`(Promise 的 resolver) |
| `stores/.composables/usePopupActions.js` | 開啟 / 關閉 / 結算。**唯一能碰 `xxxCheck` 的地方** |
| `components/common/mPopup/Main.vue` | 顯示狀態機與兩層 Transition。每個 popup 實例比對 `props.id === keyID` |
| `containers/common/*.vue` | 各型別的外框(AlertSystem / ConfirmSystem / CustomPopup / LoginSyetem) |
| `assets/css/_common/vueTransition.css` | `popup-overlay-*` / `popup-zoom-*` / `popup-bottomSheet-*`。**不得出現 `.m-xxx` 選擇器** |
| `assets/css/_modules/common/mPopup/*.css` | 元件外觀,由 `Main.vue` 於 script 頂部 import(variables 先、common 後) |

---

## 不變式 1:顯示狀態由 `watch(isOpen)` 驅動,禁止依賴 transition 事件

`Main.vue` 有兩個 flag,對應兩層 Transition:

```js
const isShowOverlay = ref(false)  // 外層 .m-popup(遮罩,由 :before 畫)
const isShowPopup = ref(false)    // 內層 .m-popup-container(內容)

watch(isOpen, async (open) => {
  if (!open) {
    isShowPopup.value = false   // container 先退場,遮罩等它的 @afterLeave
    return
  }

  isShowOverlay.value = true
  await nextTick()              // 等遮罩掛上,內層 Transition 才存在
  if (isOpen.value) isShowPopup.value = true
}, { immediate: true })

// 只在「確實已關閉」時才收遮罩
const onAfterLeave = () => {
  if (!isOpen.value) isShowOverlay.value = false
}
```

**三個細節都是必要的,不可簡化:**

1. **`await nextTick()`** — 內層 Transition 必須先掛載,之後的 `isShowPopup` 切換才算「`v-if` 由 false→true」而會播 enter。若兩層同時切換,內層對 Vue 而言是「初次渲染」,**不加 `appear` 就不播動畫**。
2. **`if (isOpen.value)`(nextTick 後)** — 快速開關時 `nextTick` 之間可能已被關閉。
3. **`if (!isOpen.value)`(onAfterLeave 內)** — A → B → 上一步 → A 時,返回 A 的退場可能還沒走完,此時 `isOpen` 已回 `true`,遮罩不能收。

### 絕對不要這樣寫

```js
// ✗ 這是原始版本,會死鎖
const onOverlayEnter = () => { if (isOpen.value) isShowPopup.value = true }
// 外層 v-if="isOpen || isShowOverlay"
```

`isShowPopup` 只能靠 `@enter` 點亮,而重開時外層 `v-if` 是 `true → true`(遮罩還沒退場完),**元素沒有從無到有 → `@enter` 不觸發** → `isShowPopup` 停在 `false` → 沒有內層 leave → `@afterLeave` 永遠不來 → `isShowOverlay` 永遠 `true` → 永遠不會再有 `@enter`。**該 popup 從此開不起來,只能重整頁面。**

---

## 不變式 2:Promise 只能經由 `onSettle` 結算

`onCustom()` / `onAlert()` / `onConfirm()` 回傳 Promise,resolver 存在單一插槽 `xxxCheck`。

```js
// usePopupActions.js — 唯一的結算出口
const onSettle = (checkRef, isSure = false, item = null) => {
  const resolve = checkRef.value

  checkRef.value = null      // 先清空
  resolve?.(isSure, item)    // 再呼叫,且 null 安全
}
```

**順序是刻意的**:先清空再呼叫。`resolve` 的續行若立刻再開一個 popup,新的 resolver 才不會被這裡的清空蓋掉。

### 三條規則

1. **關閉即結算** — `onAlertClose` / `onConfirmClose` / `onCustomClose` 簽章都是 `(isSure = false, item = null)`,內部一律呼叫 `onSettle`。X 鈕與 `onReset()` 走預設值,語意是「使用者沒有確認」。
2. **開啟前先結算** — `onAlert` / `onConfirm` / `onCustom` 開頭都要 `onSettle(xxxCheck)`,把上一個沒關就被蓋掉的 resolver 收乾淨,否則它的 `await` 永久 pending。
3. **元件不得直接呼叫 `xxxCheck.value(...)`** — 一律走 `onXxxClose(isSure, item)`;需要「回報結果但不關閉」(`isClose: false` 的按鈕自行驗證後回報)時用 `onCustomSettle(isSure, item)`。

`grep "Check\.value"` 的結果應該**只有** `usePopupActions.js` 內設定 resolver 的三處。

---

## 不變式 3:關閉只清 `id`,開啟必須覆寫全欄位

```js
const onAlertClose = (isSure = false, item = null) => {
  alertData.value.id = null      // 只清這個 —— 它是「關閉」的訊號

  onSettle(alertCheck, isSure, item)
  onBodyOverflowHiddenToggle(false)
}
```

**為什麼不清其他欄位**:清掉 `id` 的同時退場動畫才剛開始(0.1 ～ 0.25s),
若把 `title` / `content` / `btns` / `setClass` 一起清掉,**退場期間 popup 會瞬間變空** ——
內容消失、按鈕跳回預設組,而 `setClass` 被清會讓
`setClass.main || 'p:--w-600 t:--w-460'` 走 fallback,**寬度在退場途中跳一下**。

**代價是一條隱性契約**:`onAlert` / `onConfirm` / `onCustom` 必須對**每個欄位無條件賦值**
(沒傳就寫入 `undefined`,不可寫成「有傳才蓋」),否則會沿用上一次的值。
**日後在 `stores/popup.js` 新增欄位時,三個開啟函式一定要一併補上賦值。**

`apiPromiseData` 從以前就是這個模式(`onApiPromiseClose` 只有 `id = null`),可作為對照。

---

## 已修過的三個 bug(症狀 → 根因)

| 症狀 | 根因 | 現在的防線 |
|---|---|---|
| popup **再也打不開**,只剩半透明遮罩,console 無錯誤 | 不變式 1:`isShowPopup` 依賴 `@enter`,錯過一次就死鎖 | `watch(isOpen)` 無條件設定 |
| `await onCustom(...)` **之後的程式碼永不執行**(流程卡住) | 不變式 2:close 只清空 resolver、不呼叫 | `onSettle` 統一結算 |
| `alertCheck.value is not a function`,之後**所有** popup 都打不開 | 元件直接呼叫已是 `null` 的 resolver,拋錯中斷了後面的 `onAlertClose()`,`alertData.id` 卡住 → `keyID` 永遠是 `alertSystem`(優先序最高) | `onSettle` 用 `?.`,元件不再直接呼叫 |

**除錯對照**:症狀是「只剩遮罩」→ 看不變式 1;「流程不往下走」→ 看不變式 2;console 有 `is not a function` → 第三條。

---

## CSS 動畫編排

進出場的先後**全部靠 CSS delay**,JS 不參與時序:

```css
/* 遮罩:.m-popup 的 opacity(連帶整個子樹) */
.popup-overlay-enter-active,
.popup-overlay-leave-active { transition: opacity 0.15s ease; }
.popup-overlay-leave-active { transition-delay: 0.1s; }   /* 等 container 收完 */

/* zoom:delay 讓遮罩先浮現一半再彈出 */
.popup-zoom-enter-active { animation: popup-bomb 0.1s 0.075s both; }
.popup-zoom-leave-active { animation: popup-bomb 0.1s reverse both; }

/* bottomSheet:等遮罩完整淡入(0.15s)後才滑上來 */
.popup-bottomSheet-enter-active { transition-delay: 0.15s; }
```

- **`vueTransition.css` 內不得出現 `.m-xxx` 選擇器**(只有註解可提及元件名)。需要綁元件 class 的規則放 `_modules/common/mPopup/`。
- `mode` 由 `config.mode` 決定,可為字串或依裝置的物件(`{ m: 'bottomSheet' }`),解析後掛成 `.m-popup` 上的 `--zoom` / `--bottomSheet`,並決定 Transition 的 `name`(`popup-zoom` / `popup-bottomSheet`)。

---

## 改動前的檢查清單

- [ ] 沒有讓 `isShowPopup` 的點亮依賴任何 transition 事件(`@enter` / `@after-enter`)
- [ ] `onAfterLeave` 內保留 `if (!isOpen.value)`
- [ ] `watch` 內保留 `await nextTick()` 與後續的 `if (isOpen.value)`
- [ ] 所有關閉路徑最終都會呼叫 `onSettle`(含 X 鈕的 `onReset()`)
- [ ] 三個 `onXxxClose` 只清 `id`,沒有順手清其他欄位
- [ ] 若在 `stores/popup.js` 加了欄位,三個開啟函式都補上無條件賦值
- [ ] `grep "Check\.value"` 只在 `usePopupActions.js` 有結果
- [ ] `vueTransition.css` 的 popup 段落沒有 `.m-xxx` 選擇器
- [ ] 兩層都是 `v-if`(不要改成 `v-show`,會讓每個 popup 都常駐一個 `.m-popup` 在 DOM,污染 `querySelector`)

## 驗證方式

**build 過不代表動畫或死鎖修好了,一定要在瀏覽器實測。** 必測四項:

1. **A → B → 上一步 → A**(關鍵:返回時中間沒有 API 延遲)
2. **連續開關同一個 popup**(退場動畫還在跑時就重開)
3. **bottomSheet 進出場**(手機模式):遮罩先淡入 → 內容滑上;關閉時內容先滑下 → 遮罩才淡出
4. **zoom 進出場**

判斷「死鎖」:DOM 裡找得到 `.m-popup` 但**沒有** `.m-popup-container`,且 console 無錯誤。

寫測試頁時注意:`await nextTick()` **不足以**讓 popup 完整開啟(`watch` 內部自己還有一個 `nextTick`),要用 `setTimeout` 等約 300～400ms 才算「完整出現」,否則測不到死鎖窗口。

多步流程用 `while (true)` + `continue` 或遞迴皆可(效能差異在此場景可忽略,實測 10000 次往返差 1.1 µs);「上一步」的慣例是 `type: 'cancel'` + `isClose: true`,再用 `item.id === 'back'` 區分是取消還是返回。
