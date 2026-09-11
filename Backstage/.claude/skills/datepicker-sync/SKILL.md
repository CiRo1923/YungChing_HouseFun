---
name: datepicker-sync
description: 自製 mDatepicker 在其他 repo 有一份複本 —— .composables/ 的四支核心邏輯必須保持一致,元件層與 CSS 各自獨立。改 mDatepicker 的 composable 時必讀。
---

# mDatepicker 的跨 repo 複本

## 為什麼需要這份規則

這個日期選擇器是自製的(不依賴第三方套件),**在其他 repo 有一份複本,不會自動同步**。
日期運算與定位那幾支很容易改了這邊忘了那邊,而症狀往往是
「某個 format 少了一種行為」—— 不會報錯,只能靠人記得。

> 複本在哪個 repo、哪個路徑,**問使用者** —— 這份 skill 刻意不寫,
> 寫死了複製過去就變成錯的敘述(「對方是 X」抄到 X 那邊會變成「對方是自己」)。
> 那邊也有一份同名的 skill,講的是那邊自己的事實。

**本專案的位置**:

| | |
|---|---|
| 元件 | [components/buy/mDatepicker/](../../../components/buy/mDatepicker/) |
| CSS | [assets/css/_modules/buy/mDatepicker/](../../../assets/css/_modules/buy/mDatepicker/) |

## 核心原則

**`.composables/` 要一字不差,元件層與 CSS 各自獨立。**

| | 檔案 | 為什麼 |
|---|---|---|
| **必須完全一致** | `useDateCore.js`<br>`useTimeCore.js`<br>`useCalendar.js`<br>`usePosition.js` | 純邏輯,不碰畫面。而且**兩邊都有 auto import** —— 同名函式各有一份實作、行為卻不同,是最難查的那種 bug |
| **各自獨立** | `Single.vue` / `Range.vue` / `Time.vue` / `Calendar.vue` / 兩支 `Header*` / 兩支 `Panel*` / `TimePanel.vue` | 元件的組合方式與元件名前綴都是各專案的架構 |
| **各自獨立** | `variables.css` / `common.css` | 色票、尺寸、斷點策略都是各專案的決定 |
| **不同步** | `useConfig.js` | config 契約是各專案的對外承諾(預設值、有沒有 `toJSON`…)。**但重複的判斷邏輯要轉手給 `useDateCore`**,不要各寫一份 |

判斷方式:**這段程式碼看得到 DOM 或 class 嗎?** 看得到就是元件層,看不到就該在 composable 裡。

> 實際踩過:`onGroupPointerdown` / `onDocumentClick` 這種兩邊一字不差的東西留在元件裡,
> 結果一邊修了 bug、另一邊還是舊行為。**可以寫進核心的一律寫進核心。**

## 本專案的事實(移植時要重新確認的地方)

同步時**不要假設兩邊一樣** —— 下面每一項都要回頭看那邊實際是什麼。

| 面向 | 本專案 |
|---|---|
| **元件組合** | `Single.vue` / `Range.vue` 各自內嵌日期欄位,時間欄位(`Time.vue`)並排在旁邊 |
| **元件名前綴** | 目錄結構推出來的 `BuyMDatepicker*`;圖示是 `CommonSvgIcon icon="icon_calendar"`,錯誤訊息是 `BuyMErrorMessageElem` |
| **`Time.vue` 的 config** | 讀 `config.format`,而且那個值是**時間段**(`hh:mm`),不是完整的 format |
| **`Panel*` 的介面** | `current` / `rangeClassOf` / `disabledOf` 都是獨立 prop |
| **`HeaderPanel` 的介面** | `year` / `monthLabel` / `mode` / `prevDisabled` / `nextDisabled` 各自是 prop |
| **`Calendar` 的 emit** | `select`(日曆格子)與 **`selectYMD`**(年 / 月清單就是最終值時)兩個 |
| **精度的說法** | `calendar.precision` 回 `'day'` / `'month'` / `'year'`,`Calendar` 直接讀它,沒有另一層轉換 |
| **format 的形狀** | config 的 `format` 可以是物件(`model` / `datePicker` 兩種格式分開),所以取值一律經過 `onPickFormat`。**傳單一字串也成立** —— 那支對字串回自身 |
| **`Range` 的 v-model** | 兩個元素的字串陣列 `[起, 訖]`。不支援 `toJSON` |
| **CSS 變數層級** | 面板相關的多一層 `calendar`(`--datepicker-calendar-range-bg-color`) |
| **CSS 斷點** | `variables.css` 一律拆 `-pc-` / `-tablet-` / `-mobile-` 三份 |
| **CSS 選擇器風格** | 巢狀(`&.\-\-curr`) |
| **浮層結構** | `m-datepicker-calendar` 是 Teleport 的定位層,內層再包 `datepicker-bomb` 的 Transition |

> **prettier 造成的換行差異不是實質差異** —— 兩邊的 printWidth 未必相同,
> 同一段程式碼可能一邊一行、一邊拆三行。**不要為它改程式碼**,跑各自的 prettier 就好。

### `usePosition` 的 `isPopup` 有兩種成立方式

```js
config.value.position === 'popup' || (isDeviceM.value && !!config.value.mobileSupport)
```

**兩個條件都要留著** —— 有的複本靠 `position`、有的靠裝置判斷,少一個就會少一種行為。
沒有那個 config 鍵的專案讀到 `undefined`,那一半自然不成立。

## 同步流程

1. 在其中一邊改完
2. `diff` 四支 composable,把差異搬過去(**整份覆蓋是安全的**,那幾支沒有專案特有的東西)
3. 對方的元件層若少了新 prop / 新 emit,**在對方現有架構上補**,不要整包覆蓋元件
4. CSS 照對方的變數命名與選擇器風格重寫,不要複製
5. 兩邊各自驗證:

```powershell
npm run lint:css        # 或 node .tools/lint/lint.mjs <範圍>
npx eslint <範圍>
npm run build
```

> ⚠️ **元件層補完 prop 之後一定要實際點開面板確認**。少傳一個 prop 不會報錯 ——
> 它會靜靜地吃 `default`,而 `default: () => false` 的意思正好是「什麼都不停用」。
> 實際踩過:同步了 `useCalendar`(年月清單一律列出完整範圍)卻沒同步兩支 `Panel`,
> 結果**點得到超出 min / max 的年月**。

> ⚠️ **沒有使用端的元件,build 不會驗它的 template**。auto import 的元件名打錯、
> 綁了對方沒宣告的 emit,都要等第一次接上呼叫端才會發現。
> eslint 會驗語法,但驗不到元件名解析。

### 驗證用的 demo 頁

[pages/demo/datepicker.vue](../../../pages/demo/datepicker.vue) 把每一種 format
與區間都排在同一頁,並印出 v-model 的真值。**改完 composable 一定要點過它** ——
lint 與 build 都驗不到「某個 format 的行為變了」。

新增案例時把「要驗什麼」寫進那一筆的 `note`,不要只放一個 format 上去 ——
下一個人才知道那筆存在的理由。實際救過一次:年 / 月的停用判斷曾經寫成
「頭尾兩天各自 disabled 再 `&&`」,min 落在 3 月、max 落在 10 月時整年會被停掉
(中間 8 個月本來可選),就是加了那個案例才發現。

## 對照紀錄

> 只留「最後一次對照」與尚未收斂的項目 —— 歷史看 git log。

**最後一次對照:2026-09-07。** 本專案側當次是來源(對方跟上這邊),
內容為 `format` 決定精度與有無時間欄、`Range` 變體、年 / 月的區間標色、
`usePosition` 接手 refs 與 listener。本專案沒有因為那次對照而改動。
