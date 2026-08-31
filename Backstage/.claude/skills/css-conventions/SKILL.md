---
name: css-conventions
description: 動到任何 css、顏色、module 樣式前必須先讀。六條規則 —— 顏色一律定義在 color.css 且依規則命名與排序、components 的 template 不寫 tailwind class、module 拆資料夾與引入順序、module 變數的命名與斷點、.vue 的 import 順序、不要用被 theme 整組覆寫掉而不存在的 tailwind class(text-sm / 任何 shadow-* / md: 都產不出 CSS)。含四層自動守門與檢查工具的用法。觸發時機 - 要加新顏色 / 改 assets/css/_common/color.css、要拆或改 assets/css/_modules/**、要動 components/**/*.vue 的 class 或 <style>、要寫任何 tailwind class(先確認它在本專案存不存在)、或使用者問到「顏色要放哪 / 色票命名 / 色系排序 / 為什麼跳 CSS 警告 / 這個 class 為什麼沒效果」。
---

# CSS 規範(摘要)

**完整規則見 [.claude/rules/css-conventions.md](../../rules/css-conventions.md) —— 動手前一定要讀那份。**
這裡只列六條規則的重點與工具指令,細節、踩過的坑、違規存量都在規則檔裡。

| 規則 | 一句話                                                                                                                                                      | 工具會自動抓           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1    | 顏色一律定義在 `assets/css/_common/color.css`,依 hex 型態命名、依色系與亮度排序                                                                             | ✅(排序會**自動修正**) |
| 2    | `components/` 的 `<template>` 不得使用 tailwind class,只能用 `m-xxx` 與 `--modifier`                                                                        | ✅                     |
| 3    | module 拆成 `_modules/<頻道>/<組件>/`,在 `<script setup>` 最上方按固定順序 JS import                                                                        | ✅(引入方式與順序)     |
| 4    | module 變數用 `-w` / `-h` / `-p` / `-m` / `-border`,尺寸類拆 pc / tablet / mobile 三份                                                                      | ✅                     |
| 5    | `<script setup>` 的 import 順序:**css → `./.composables` → `@js` → 其他套件**                                                                               | ✅                     |
| 6    | 不要用被 `theme` 整組覆寫掉而不存在的 class:`text-sm` / **任何** `shadow-*` / `font-sans` / `md:` / `transition-width`(單數)。`*-hexa` **已淘汰**(改用 8 碼 hex 色票) | ✅                     |

## ⚠️ 判斷不出來就問 —— 不要猜

「有違規要不要修」要問,「**這件事該怎麼做**」判斷不出來時**也要問**。
猜錯的代價不對稱:猜對省一次提問,猜錯要回頭改 module + template + 每一個使用端。

一律問、不要自己決定:

| 岔路                                                    | 看程式碼判斷不出來的原因            |
| ------------------------------------------------------- | ----------------------------------- |
| 屬性**要不要開 modifier**                               | 取決於將來各頁面會不會想各自指定    |
| 字級歸 module 還是**父系 `setClass`**                   | 取決於是不是「固定位置」組件        |
| 語意標籤**要不要給 class**                              | 取決於使用端想不想改它的字級 / 顏色 |
| 某斷點沒設定是**例外還是漏寫**                          | 兩者長得一模一樣                    |
| 非 px 值(`duration-*` / `rounded-full`)**要不要變數化** | 規則只明確要求 px,這是灰色地帶      |
| 死檔**要重寫還是刪**                                    | 可能還沒接上,也可能是廢棄品         |
| modifier 沒人用**要留還是刪**                           | 可能預留給還沒做的頁面              |
| template 綁了 class **但沒有 CSS**                      | 刻意不做 vs 漏掉,兩種都實際遇過     |

**問法**:直說「這個我判斷不出來」,列出選項與各自後果 ——
不要假裝有把握然後埋一句「暫時這樣」。

## module 變數的規則(最常踩的一區)

| 面向                  | 規則                                                                                                                                                                                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **前綴**              | 跟著 class / 資料夾走:`mForm/` → `--form-*`(變體再接變體名 `--form-select-*`)。**不要在變數名塞 `m-`**(`--m-autocomplete-…` ✗)。                                                                                                                                                                                                                         |
| **命名**              | `-w` / `-h` / `-p` / `-m` / `-border` / `-text-size`,不要 `-width` / `-height` / `-padding` / `-text`。                                                                                                                                                                                                                                                  |
| **寬高**              | **相同用 `-size`,不同才拆 `-w` / `-h`**。icon 多半是正方形 → `--x-icon-size` 一個就好。`-w` 的變數被套到 `h-[]` 上是命名錯誤(工具會抓),之後想單獨調高度會連寬度一起動到。                                                                                                                                                                                |
| **斷點**              | `:root` 裡的尺寸值(px / rem / % / vh / vw)一律拆 `pc` / `tablet` / `mobile` 三份,即使三個值一樣。顏色不用拆。                                                                                                                                                                                                                                            |
| **斷點成套**          | 有 `-pc-X` 就**必須**有 `-tablet-X` / `-mobile-X`(漏一個那斷點會靜靜讀不到值);版型檔**不可直接吃** `--x-pc-y`,要吃中性變數、由 `@screen` 各段對應。**但已經包在 `@screen p` 裡面的直接吃 `-pc-` 是合理的**,工具只抓「斷點對不上」與「沒包在斷點區塊裡」;複合斷點(`pt` / `tm`)裡一律不能直接吃單一斷點的值。例外寫 `/* lint-breakpoint-exempt: 理由 */`。 |
| **`@screen` 別拆散**  | 同一支檔案的 `@screen p` / `t` / `m` **各自只寫一組** —— **頂層與巢狀都算**(`.m-x { @screen p }` 在多個選擇器內各寫一次同樣違規)。散在好幾處時,要調某個斷點得逐一確認有沒有漏。例外寫 `/* lint-screen-group-exempt: 理由 */`。                                                                                                                                                                                                                                                                     |
| **粒度**              | 建在「用到的最小單位」上(見下一節)。                                                                                                                                                                                                                                                                                                                     |
| **px 就開變數**       | **帶 px 的值一律開變數拆三斷點**,`1px` 線寬、`2px` 內距也算 —— 「感覺是造型」不是豁免理由,判斷看單位。`duration-*` / `rounded-full` / `w-full` / `-1/2` 目前是存量,碰到時問使用者。                                                                                                                                                                      |
| **不開變數的**        | **`z-index`**(`z-[3]` 直接寫,lint 會擋變數版)、`0` / `auto` / `none`、**`font-weight`**(不是父系帶入就是寫死,值域小又固定)、**`letter-spacing`**(`tracking-[0.06em]` 直接寫)。                                                                                                                                                                           |
| **`100%` 用 `-full`** | 三個斷點沒差別時直接寫 tailwind 的 `w-full` / `h-full` / `max-w-full` / `min-w-full` / `min-h-full` —— 不要 `w-[100%]`,更不要繞變數。只有**真的分斷點不同**(pc `50%` / mobile `100%`)才開變數。                                                                                                                                                          |
| **中性變數**          | 一支檔案有**多個**變數要分斷點 → 版型吃中性變數、`@screen` 各段集中對應;**只有一個** → 版型直接寫在 `@screen` 內吃 `-pc-` / `-tablet-` / `-mobile-`,不用多繞一層。                                                                                                                                                                                       |
| **字級寫法**          | `text-[length:--x-text-size]`,**不要原生 `font-size: var(…)`**;`length:` 省略會被當成 color(靜默失效)。                                                                                                                                                                                                                                                  |
| **base**              | `px-[--x]` / `py-` / `mx-` / `my-` 沒 base 會**整條讀不到**,base 給 `0`;**高度的 base 要給 `auto`**(給 0 會塌);**顏色沒有時給 `inherit`**(不是 `initial` —— `color` 的 initial 是**黑色**,會讓所有沒帶顏色 modifier 的元素從繼承父層變成黑字)。                                                                                                          |
| **狀態**              | hover / focus / active 一律「覆寫基礎變數」,不要在 `:root` 寫 `--x-hover-color: var(--x-color)` 當 fallback —— 那在 `:root` 當下就解析完了,永遠是無效值。                                                                                                                                                                                                |
| **hover**             | modifier 帶 `hover:` 前綴、包在 variables.css 的 `&:hover` 裡(見下節),**不要建 `--x-hover-bg-color` 專用變數**,也**不要在版型檔寫 `&:hover`**。                                                                                                                                                                                                          |
| **撞名**              | 同組 module 內不同元素撞 class 名時**不要硬合併**(`.m-label` vs `.m-form-label`),在 variables 檔頭註明原因。                                                                                                                                                                                                                                             |

## 狀態一律 `--` 開頭,沒有 `is-*`

`--readonly` / `--error` / `--disabled` / `--active` / `--curr` / `--checked` / `--open` / `--has-label`。
**不要用 `is-active`、`has-label` 這種裸前綴** —— 專案只有 `--` 一種寫法。
(`jFormValid` 那類純給 JS 抓、不帶樣式的 hook class 不在此限。)

## modifier 命名 = tailwind utility + `--` 前綴

`--border-b`(不是 `--has-border-b`)、`--rounded-20`、`--px-15`、`--text-white` ——
對得上 tailwind utility 的一律照它的名字,只多 `--` 前綴。
`--oval` / `--checked` / `--align-top` / `--no-label` 這種狀態或語意開關 tailwind 沒有對應,
維持專案自己的說法。

## variables 檔只放「值」,版型檔放「行為」

判斷方式:**這行是在「給一個值」,還是在「切換成另一個變數」?**

| variables 檔                                                     | 版型檔(`common.css` / `<變體>.css`)                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `:root` 預設值 `--x-px: 0;`                                      | 版型宣告 `@apply h-[--x-size];`                             |
| modifier 的具體值 `&.--px-5 { --x-px: 5px; }`                    | **狀態切換** `&.--checked { --x-bg: var(--x-checked-bg); }` |
| 指向**色票**也算值 `&.--text-white { --x-color: var(--white); }` | **斷點對應** `@screen p { --x-size: var(--x-pc-size); }`    |

`var(--white)` 指向色票 = 給值 ✓ 留 variables;
`var(--x-checked-bg-color)` 指向自己 module 的變數 = 切換 ✗ 要搬版型檔。
工具會自動抓(`checkVariablesFile`)。

**反過來也成立**:`variables.css` / `*Variables.css` **以外的檔案,
變數宣告右邊一定是 `var(…)`** —— 看到 `--tag-px: 0` 這種常值就是放錯地方,
base 值屬於 variables 的 `:root`。值散在兩個檔案時,調預設值得先猜它在哪。

> `--tag-h: ''` 這種**空字串是無效 CSS 值**,整條宣告會被丟棄 ——
> 行為剛好等同「沒設定」所以看不出問題,但讀不出意圖。
> 高度寫 `auto`、圓角寫 `0`、陰影寫 `none`。

## 資料夾 / 檔名 / class 三者要對齊

資料夾名**跟著 class 前綴走,不是組件檔名**(`ImgSrc.vue` 的 class 是 `m-figure` → `mFigure/`)。

組件放在**某個 module 的子資料夾**底下時,它就是那個 module 的變體,三者都要收斂:

|        | ✗                           | ✓                                            |
| ------ | --------------------------- | -------------------------------------------- |
| 資料夾 | `_modules/buy/mSwitchItem/` | `_modules/buy/mItem/`                        |
| 檔名   | `common.css`                | `switchItem.css` / `switchItemVariables.css` |
| class  | `m-switch-item-header`      | `m-item-switch-header`                       |

只搬資料夾而 class 不動,「看到 class 就能找到檔案」就失效了。
判斷:檔案在 `components/<頻道>/<母體>/` 底下 → 它是 `<母體>` 的變體。

## module 的四層:共用 → 群組 → 變體

| 層       | 檔案                                 | 誰吃得到                                                        |
| -------- | ------------------------------------ | --------------------------------------------------------------- |
| 共用     | `variables.css` / `common.css`       | 該 module 全系列                                                |
| **群組** | `<群組>Variables.css` / `<群組>.css` | **兩個以上變體共用**(mForm 的 `selection.*` = checkbox + radio) |
| 變體     | `<變體>Variables.css` / `<變體>.css` | 只有那個變體                                                    |

import 順序**變數全部先定義完,版型才取用**:

```js
import '…/mForm/variables.css' // 共用變數
import '…/mForm/selectionVariables.css' // 群組變數
import '…/mForm/checkboxVariables.css' // 變體變數
import '…/mForm/common.css' // 共用版型
import '…/mForm/selection.css' // 群組版型
import '…/mForm/checkbox.css' // 變體樣式
```

兩個以上變體共用的結構 → 進群組層,不要在各變體檔各寫一份,更不要留在 template。

## hover 的固定寫法

參考實作是參考專案的 `mAnchor/variables.css`(連結見規則檔的「本專案現況」章):

```css
/* variables.css —— hover 是獨立 modifier,包在 &:hover 裡 */
.m-tooltip {
  &.\-\-bg-gray-33bf {
    --tooltip-bg-color: var(--gray-33bf);
  }

  &:hover {
    &.hover\:\-\-bg-gray-333 {
      --tooltip-bg-color: var(--gray-333);
    }
  }
}

/* common.css —— 無條件取一次,不要再寫 &:hover */
.m-tooltip {
  @apply bg-[--tooltip-bg-color];
}
```

1. modifier 帶 **`hover:` 前綴**,由使用端顯式指定
2. **不要建 `--x-hover-bg-color`** —— hover modifier 直接覆寫 `--x-bg-color` 本身
3. **版型檔不要寫 `&:hover`** —— 否則使用端沒帶 modifier 也會觸發

## ⚠️ 語意標籤要不要給 class —— 一律先問使用者

`<strong>` / `<em>` / `<small>` 這種「一個父容器內只有一個」的,技術上後代選擇器就選得到:
`.m-title-text > strong { @apply font-medium; }`——不必湊一個 `m-title-strong`。

**但這個選擇有不對稱的後果**:`.m-x > strong` 是 **(0,1,1)**,
使用端 `setClass` 傳的 utility 只有 **(0,1,0)** —— **module 永遠贏,使用端再也改不動**。

| 情況               | 做法                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| module 全權決定    | 後代選擇器 + 變數 ✓                                                           |
| **使用端要能決定** | 補 `setClass` key,`<strong :class="setClass.strong">`,module **不設**那個屬性 |
| 預設值 + 可覆蓋    | 後代選擇器**做不到**,改用 modifier 由 module 提供選項                         |

「使用端將來會不會想改」**看程式碼判斷不出來**,猜錯要回頭改 module 加 template。
所以**拆到語意標籤就停下來問使用者**:這個 `<strong>` 的字級 / 顏色要不要能傳?

不必問的只有:JS 要抓、同層有多個同名標籤要分別上樣式、或那是 `<div>` / `<span>`(一律給 class)。

## ⚠️ 這幾個屬性不能用 tailwind 寫,而且都不會報錯

| 屬性           | 寫法                                 | 用 tailwind 會怎樣                                             |
| -------------- | ------------------------------------ | -------------------------------------------------------------- |
| `border-width` | 原生 `border-width: var(--x-border)` | production 壓成 `border` shorthand,`var()` 讓整條失效          |
| `box-shadow`   | 原生 `box-shadow: var(--x-shadow)`   | `shadow-[--x]` 被當成 shadow **color**,`box-shadow` 根本不出現 |
| `font-size`    | `text-[length:--x-text-size]`        | 少了 `length:` 會變成 `color: var(…)`                          |
| `border-color` | `border-[--x-border-color]` ✓        | 沒問題,正常產出                                                |
| `column-gap`   | `gap-x-[var(--x-gap,0px)]` ✓         | 沒問題,`var()` fallback 可用                                   |

共通原因:**tailwind 推斷不出 arbitrary value 的型別時一律當成顏色**。

✅ 但**字級與文字顏色可以放在同一個 `@apply`** —— `text-[length:--a] text-[--b]` 兩個都會出現。
規範舊版說「只會保留一個、顏色要退回原生 `color:`」是**錯的**,已依實際產物更正。
寫這類「tailwind 會靜默吃掉某宣告」的斷言前,先跑一次 `npx tailwindcss` 看產物再下結論。

## ⚠️ 動 CSS 前先讀 tailwind.config.js

本專案把 `screens` / `fontSize` / `boxShadow` 直接寫在 `theme`(**不是** `extend`),
tailwind 的預設整組被換掉:

- **沒有** `text-sm` / `text-base` / `text-lg` —— 字級一律 arbitrary value
- **沒有** `sm` / `md` / `lg` / `xl` —— 斷點是 `m` / `t` / `p` / `tm` / `pt` / `pMin` / `pMax` / `mLandscape`,全是 raw media query
- **沒有** `shadow-sm` / `shadow-md` —— 只有 `tailwind.extend.js` 定義的那幾個
- plugin 另外給了 `text-hexa` / `bg-hexa` / `border-hexa` / `divide-hexa`,語法是 `bg-hexa-[--black,0.7]`

細節見規範的「動手前先讀 tailwind.config.js」。

`transition-property: transform` 也**不要**換成 `transition-transform` ——
會連帶塞 `duration-150` 與 `cubic-bezier(.4,0,.2,1)`,timing-function 蓋不掉、手感會變,
原本沒 duration 的元素還會憑空多出動畫。`transform: translate3d(0,0,0)` 同理維持原生。

## 顏色是組件的職責,使用端不得自訂

module 的 `common.css` **無條件**套 `text-[--x-color]` / `bg-[--x-bg-color]`,值由 modifier 決定。
使用端在 `setClass.main` 寫 `text-[--gray-999]` **本身就是錯的**,會被蓋掉也應該被蓋掉 ——
**module 補一個顏色 modifier**(`--text-gray-999`),使用端改用它。

**不要**用 `:is(…)` 把 module 的顏色宣告條件化來「讓使用端能自訂」,
那樣組件定義顏色就沒意義了,顏色也會散落在各頁面。
(尺寸 / 圓角相反 —— 那些可以由使用端傳,module 要留意別無條件蓋掉。)

## 字級定在哪:看組件是不是「固定位置」

| 組件性質                 | 字級放哪                                                   | 例子                          |
| ------------------------ | ---------------------------------------------------------- | ----------------------------- |
| **固定位置、全站長一樣** | module 自己定,走 `:root` 變數(`--x-text-size`,分三斷點)    | 麵包屑、分頁器、mNav、mFooter |
| **到處複用、每處都不同** | **父系 `setClass` 傳 tailwind class**,module 不定 `text-*` | 按鈕、mForm 全系列、mTag      |

第二類沒有對應 `setClass` key 就**補一個**,並把原本的值**補回每一個使用端**(否則字級會變成繼承)。
使用端根本沒管道可傳(後台編輯器存的 class)才留在 module。分不出來就問使用者。

### ⚠️ 非固定組件連 `--x-text-size` 變數都不要建

最容易做半套的地方:知道字級要交給父系,卻順手建了變數。
**建了 module 就會 `@apply` 它,一輸出就蓋掉使用端傳的 `text-*`** —— 交給父系等於白做。
**沒有變數,才真的沒有輸出。**

字級變數只能出現在**固定位置**的組件。全案目前只有六支有:
mTitle / mFooter / mNav / mLoading / mPopup + mChart 的 tooltip(它沒有 `setClass` key,
使用端沒管道可傳)。複用型的 mTag / mAnchor **一個都沒有**,那是對的。

**mForm 有一個特例**:輸入框的字級照規則交給使用端(63 個實例都帶 `type: 'text-[16px]'`),
但 `.m-form-error` 的 `--form-error-text-size` 留在 module ——
錯誤訊息全系列統一,而且它是 module 自己渲染的節點,使用端不見得碰得到。
判準跟 mChart tooltip 同一條:**使用端有沒有管道傳**。

## 變數建在「用到的最小單位」上

padding / margin / border-radius 的 modifier 有層級(整體 → 軸向 → 單邊 → 單角)。
**同一個組件只要用到一個以上的層級,變數就建在最細的那一層**,
較粗的 modifier 同時設它涵蓋的每個細變數,`common.css` 用最細的 utility 分開取。

| 用到的 modifier                            | 建立的變數                       |
| ------------------------------------------ | -------------------------------- |
| 只有 `--p-*`                               | `--x-p`                          |
| `--p-*` + `--px-*` / `--py-*` / `--pb-*` … | `--x-pt` / `-pr` / `-pb` / `-pl` |
| 只有 `--rounded-*`                         | `--x-rounded`                    |
| `--rounded-*` + `--rounded-t/-b-*`         | `--x-rounded-t` / `-rounded-b`   |
| `--rounded-*` + `--rounded-x/-y-*`         | `--x-rounded-x` / `-rounded-y`   |
| 出現任何單角 `--rounded-tl/-tr/-bl/-br-*`  | 四個角各一個                     |

不這樣做的話,覆寫關係會取決於 tailwind 的輸出順序而不是你寫的順序。
另外**使用端若已經在用 tailwind 傳某個細粒度**(例如 `m:rounded-b-[20px]`),
表示 module 缺那一層 modifier —— 要**補 modifier** 給它用,不要讓兩邊在同一個優先權上打架。

## 顏色要放哪支色票檔

1. 先查色票檔有沒有了,同色值不要重複建。
2. 只有一個頻道用 → 該頻道的 `color<Channel>.css`;**兩個以上頻道用到 → 共用的 `color.css`**。
3. 頻道檔與 `color.css` 撞到同一個色值 → 頻道檔那份多餘,刪掉改用共用變數。

第 2、3 點工具會比對後警告,但**不自動搬**(牽動使用端)。

## ⚠️ 違規每一輪都要列出來 —— 但不要主動問「要不要修」

**不沉默,也不打斷** —— 這兩件事要同時成立:

|                  | 做法                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **每一輪都列**   | 只要違規還在,清單每一輪都會出現。不去重、上一輪列過不算數、使用者上次說「先不用」也不算數。**要它安靜的唯一方式是把違規修掉。**                         |
| **不主動彈問句** | **不要呼叫 AskUserQuestion 問「要不要現在修」** —— 同一份警告使用者存檔時已經在終端機 / 輸出面板看過了,那裡就寫著「要修就打『修正』」。主動權在他手上。 |

使用者說「修正」「好」「幫我改」時**直接動手**,不用再問一次是哪個檔案 —— 清單就在上下文裡。
他沒開口就不要修、也不要催。修的時候要說清楚**哪些是這次改出來的、哪些是碰到的舊檔案存量**。

> **為什麼是這個形狀**:早期的規則要求「有違規一定要彈 AskUserQuestion」,
> 那是為了解決「明明有紅字卻靜靜放著、讓人以為處理完了」。但每一輪都彈問句太吵,
> 而且終端機那層本來就看得到。所以拆成兩半 —— **可見性由「每輪都列」保證,
> 決定權留給使用者**。沉默才是要避免的事,彈窗不是。

**這條不適用於「判斷不出來」的情況** —— 那是「該怎麼做」不是「要不要修」,見下面那節,
遇到岔路一律要問。

## 存檔那兩層:通過也要出聲

沒違規時一樣印 `✔ 通過`,而且**通過與違規都帶 `HH:MM:SS` 時間戳** ——
終端機與輸出面板不會自己清空,靜默的話上一次的紅字會被誤讀成「這次還是沒過」。
對話那兩層(`cssGuard.js` / `cssGuardPrompt.js`)相反,**有事才說**,免得洗版。

## 四層守門都只警告不阻擋

編輯器存檔(dev server 或 RunOnSave 擴充)/ Claude 寫檔 / 使用者送出訊息 / `git commit`
四層都會檢查,色票檔排序一律自動修正。
**偵測到違規時清單每一輪都會列出,但不要主動彈 AskUserQuestion 問「要不要修」** ——
等使用者說「修正」再動手,修完要講清楚哪些是存量。**修掉才會停。**

## 指令

```powershell
npm run lint:css                              # 全專案掃描(六條規則)
node .tools/css/lint-css.mjs <檔案或目錄>      # 只檢查指定範圍
npm run sort:color                            # 色票檔自動排序
node .tools/css/sort-color-css.mjs            # 色票檔:只檢查排序 / 命名 / 頻道歸屬
```
