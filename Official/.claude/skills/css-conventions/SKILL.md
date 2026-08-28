---
name: css-conventions
description: 動到任何 css、顏色、module 樣式前必須先讀。四條規則 —— 顏色一律定義在色票檔(分頻道)且依規則命名與排序、components 的 template 不寫 tailwind class、module 拆資料夾與引入順序、module 變數的命名與斷點。含四層自動守門與檢查工具的用法。觸發時機 - 要加新顏色 / 改 assets/css/_common/color*.css、要拆或改 assets/css/_modules/**、要動 components/**/*.vue 的 class 或 <style>、或使用者問到「顏色要放哪 / 色票命名 / 色系排序 / 為什麼跳 CSS 警告」。
---

# CSS 規範(摘要)

**完整規則見 [.claude/rules/css-conventions.md](../../rules/css-conventions.md) —— 動手前一定要讀那份。**
這裡只列四條規則的重點與工具指令,細節、踩過的坑、違規存量都在規則檔裡。

| 規則 | 一句話 | 工具會自動抓 |
|---|---|---|
| 1 | 顏色一律定義在 `assets/css/_common/color*.css`,依 hex 型態命名、依色系與亮度排序 | ✅(排序會**自動修正**) |
| 2 | `components/` 的 `<template>` 不得使用 tailwind class,只能用 `m-xxx` 與 `--modifier` | ✅ |
| 3 | module 拆成 `_modules/<頻道>/<組件>/`,在 `<script setup>` 最上方按固定順序 JS import | ✅(引入方式與順序) |
| 4 | module 變數用 `-w` / `-h` / `-p` / `-m` / `-border`,尺寸類拆 pc / tablet / mobile 三份 | ✅ |
| 5 | `<script setup>` 的 import 順序:**css → `./.composables` → `@js` → 其他套件** | ✅ |

## module 變數的規則(最常踩的一區)

| 面向 | 規則 |
|---|---|
| **前綴** | 跟著 class / 資料夾走:`mForm/` → `--form-*`(變體再接變體名 `--form-select-*`)。**不要在變數名塞 `m-`**(`--m-autocomplete-…` ✗)。 |
| **命名** | `-w` / `-h` / `-p` / `-m` / `-border` / `-text-size`,不要 `-width` / `-height` / `-padding` / `-text`。 |
| **斷點** | `:root` 裡的尺寸值(px / rem / % / vh / vw)一律拆 `pc` / `tablet` / `mobile` 三份,即使三個值一樣。顏色不用拆。 |
| **粒度** | 建在「用到的最小單位」上(見下一節)。 |
| **base** | `px-[--x]` / `py-` / `mx-` / `my-` 沒 base 會**整條讀不到**,base 給 `0`;**高度的 base 要給 `auto`**(給 0 會塌);顏色沒有時給 `initial`。 |
| **狀態** | hover / focus / active 一律「覆寫基礎變數」,不要在 `:root` 寫 `--x-hover-color: var(--x-color)` 當 fallback —— 那在 `:root` 當下就解析完了,永遠是無效值。 |
| **撞名** | 同組 module 內不同元素撞 class 名時**不要硬合併**(`.m-label` vs `.m-form-label`),在 variables 檔頭註明原因。 |

## variables 檔只放「值」,版型檔放「行為」

判斷方式:**這行是在「給一個值」,還是在「切換成另一個變數」?**

| variables 檔 | 版型檔(`common.css` / `<變體>.css`) |
|---|---|
| `:root` 預設值 `--x-px: 0;` | 版型宣告 `@apply h-[--x-size];` |
| modifier 的具體值 `&.--px-5 { --x-px: 5px; }` | **狀態切換** `&.--checked { --x-bg: var(--x-checked-bg); }` |
| 指向**色票**也算值 `&.--text-white { --x-color: var(--white); }` | **斷點對應** `@screen p { --x-size: var(--x-pc-size); }` |

`var(--white)` 指向色票 = 給值 ✓ 留 variables;
`var(--x-checked-bg-color)` 指向自己 module 的變數 = 切換 ✗ 要搬版型檔。
工具會自動抓(`checkVariablesFile`)。

## module 的四層:共用 → 群組 → 變體

| 層 | 檔案 | 誰吃得到 |
|---|---|---|
| 共用 | `variables.css` / `common.css` | 該 module 全系列 |
| **群組** | `<群組>Variables.css` / `<群組>.css` | **兩個以上變體共用**(mForm 的 `selection.*` = checkbox + radio) |
| 變體 | `<變體>Variables.css` / `<變體>.css` | 只有那個變體 |

import 順序**變數全部先定義完,版型才取用**:

```js
import '…/mForm/variables.css'           // 共用變數
import '…/mForm/selectionVariables.css'  // 群組變數
import '…/mForm/checkboxVariables.css'   // 變體變數
import '…/mForm/common.css'              // 共用版型
import '…/mForm/selection.css'           // 群組版型
import '…/mForm/checkbox.css'            // 變體樣式
```

兩個以上變體共用的結構 → 進群組層,不要在各變體檔各寫一份,更不要留在 template。

## 顏色是組件的職責,使用端不得自訂

module 的 `common.css` **無條件**套 `text-[--x-color]` / `bg-[--x-bg-color]`,值由 modifier 決定。
使用端在 `setClass.main` 寫 `text-[--gray-999]` **本身就是錯的**,會被蓋掉也應該被蓋掉 ——
**module 補一個顏色 modifier**(`--text-gray-999`),使用端改用它。

**不要**用 `:is(…)` 把 module 的顏色宣告條件化來「讓使用端能自訂」,
那樣組件定義顏色就沒意義了,顏色也會散落在各頁面。
(尺寸 / 圓角相反 —— 那些可以由使用端傳,module 要留意別無條件蓋掉。)

## 字級定在哪:看組件是不是「固定位置」

| 組件性質 | 字級放哪 | 例子 |
|---|---|---|
| **固定位置、全站長一樣** | module 自己定,走 `:root` 變數(`--x-text-size`,分三斷點) | 麵包屑、分頁器、mNav、mFooter |
| **到處複用、每處都不同** | **父系 `setClass` 傳 tailwind class**,module 不定 `text-*` | 按鈕、mForm 全系列、mTag |

第二類沒有對應 `setClass` key 就**補一個**,並把原本的值**補回每一個使用端**(否則字級會變成繼承)。
使用端根本沒管道可傳(後台編輯器存的 class)才留在 module。分不出來就問使用者。

## 變數建在「用到的最小單位」上

padding / margin / border-radius 的 modifier 有層級(整體 → 軸向 → 單邊 → 單角)。
**同一個組件只要用到一個以上的層級,變數就建在最細的那一層**,
較粗的 modifier 同時設它涵蓋的每個細變數,`common.css` 用最細的 utility 分開取。

| 用到的 modifier | 建立的變數 |
|---|---|
| 只有 `--p-*` | `--x-p` |
| `--p-*` + `--px-*` / `--py-*` / `--pb-*` … | `--x-pt` / `-pr` / `-pb` / `-pl` |
| 只有 `--rounded-*` | `--x-rounded` |
| `--rounded-*` + `--rounded-t/-b-*` | `--x-rounded-t` / `-rounded-b` |
| `--rounded-*` + `--rounded-x/-y-*` | `--x-rounded-x` / `-rounded-y` |
| 出現任何單角 `--rounded-tl/-tr/-bl/-br-*` | 四個角各一個 |

不這樣做的話,覆寫關係會取決於 tailwind 的輸出順序而不是你寫的順序。
另外**使用端若已經在用 tailwind 傳某個細粒度**(例如 `m:rounded-b-[20px]`),
表示 module 缺那一層 modifier —— 要**補 modifier** 給它用,不要讓兩邊在同一個優先權上打架。

## 顏色要放哪支色票檔

1. 先查色票檔有沒有了,同色值不要重複建。
2. 只有一個頻道用 → 該頻道的 `color<Channel>.css`;**兩個以上頻道用到 → 共用的 `color.css`**。
3. 頻道檔與 `color.css` 撞到同一個色值 → 頻道檔那份多餘,刪掉改用共用變數。

第 2、3 點工具會比對後警告,但**不自動搬**(牽動使用端)。

## 四層守門都只警告不阻擋

編輯器存檔(dev server 或 RunOnSave 擴充)/ Claude 寫檔 / 使用者送出訊息 / `git commit`
四層都會檢查,色票檔排序一律自動修正。
**偵測到違規時,除了警告,還要用 AskUserQuestion 問使用者要不要現在協助調整**,
並附上具體修正方案;若是既有存量要講清楚是存量,使用者說不用就別再問。

## 指令

```powershell
npm run lint:css                              # 全專案掃描(四條規則)
node .tools/css/lint-css.mjs <檔案或目錄>      # 只檢查指定範圍
npm run sort:color                            # 色票檔自動排序
node .tools/css/sort-color-css.mjs            # 色票檔:只檢查排序 / 命名 / 頻道歸屬
```
