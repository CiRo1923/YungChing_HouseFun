# CSS 撰寫規範

本規則為 Official 專案專用,每次對話都必須遵守。
摘要與觸發時機見 skill [css-conventions](../skills/css-conventions/SKILL.md)。

**違規一律只警告不阻擋** —— 擋下來只會逼人繞過(加 `--no-verify`),反而讓守門機制形同虛設。

**但警告完一定要問 —— 不管任何狀況**:只要偵測到違規,除了跳警告,
**必須呼叫 AskUserQuestion 工具**詢問使用者要不要現在協助調整,
並附上具體的修正方案(哪個檔案、加哪個變數、搬哪些 class),讓使用者能直接判斷。

⚠️ 這條沒有例外:

- **在回覆末尾用文字問「要不要順手修?」不算數** —— 要真的呼叫那個工具。
- 使用者先前說過「繼續」、「整批授權」、「一路做下去」**都不算免問**。
  那是授權「做這件工作」,不是授權「不用問」。
- 手上正在做別的事也一樣 —— 先把當下的事講完,然後問。
- 違規是既有存量而非這次改出來的,**照樣要問**,只是要說明清楚它是存量。
- 只有「使用者針對這一筆說過不用」才不再問第二次。

dev server 與 pre-commit 那兩層無法互動,只印警告;
提問由 [.claude/hooks/cssGuardPrompt.js](../hooks/cssGuardPrompt.js) 帶進對話後執行。

## 四層守門

| 機制 | 何時生效 | 行為 |
|---|---|---|
| [.vite/css-guard.mjs](../../.vite/css-guard.mjs) | 編輯器存檔,**需 `npm run dev` 執行中** | 色票檔自動排序、其他檔案印紅色警告到 dev 終端機 |
| [.vscode/settings.json](../../.vscode/settings.json) 的 `emeraldwalk.runonsave` | 編輯器存檔,**不需 dev server**(要裝擴充 `emeraldwalk.RunOnSave`) | 跑 [.tools/css/guard-file.mjs](../../.tools/css/guard-file.mjs):色票檔自動排序 + 逐筆列出違規到「Run On Save」輸出面板;沒裝擴充不影響任何事 |
| [.claude/hooks/cssGuard.js](../hooks/cssGuard.js) | **Claude 用 Write / Edit 寫檔**,隨時 | 自動排序 + 警告回報到對話,並要求 Claude 主動詢問要不要修 |
| [.claude/hooks/cssGuardPrompt.js](../hooks/cssGuardPrompt.js) | **使用者送出訊息時**(補「自己存檔」的情境) | 掃工作區有改動的 .vue / .css:色票檔自動排序 + 帶出違規 + 要求 Claude 用 AskUserQuestion 詢問 |
| `<repo 根>/.githooks/pre-commit` | `git commit` 時,**不依賴 dev 或編輯器** | 色票檔自動排序並加入本次 commit;staged 檔案的違規印警告後照常 commit |

**「存檔即時看到自動排序 + 警告 + 修正詢問」是這樣拼起來的**:

1. **排序與警告**在存檔當下完成(dev server 的 vite plugin,或 Run on Save 擴充)。
2. **終端機與輸出面板都是單向的**,沒辦法在那裡問你要不要修 ——
   而 Claude Code 也沒有「檔案變更就喚醒對話」的 hook,提問只能發生在對話裡。
3. 所以存檔那層([guard-file.mjs](../../.tools/css/guard-file.mjs))會把「剛存了哪些檔」
   寫進 `node_modules/.cache/cssGuard/pending.json` 當接力棒,
   `cssGuardPrompt.js` 在你**下一次送出訊息**時讀走並清空,帶著違規要求 Claude 用
   AskUserQuestion 詢問。

也就是說:**每次存檔後的第一次對話一定會被問到**,沒再存檔就不會重複吵。
存檔會把該檔案的舊指紋從 `reported.json` 移除(你又存了它一次 = 重新關注),
所以同一筆違規在重新存檔後會再問一次;`reported.json` 則負責讓沒再動過的存量安靜。
兩份快取都在 `node_modules/.cache/`,不進版控。

存檔那層有兩個容易踩到的細節,都已處理:

- **VSCode 的輸出面板不吃 ANSI 色碼** —— 硬印會變成一堆 `esc[31m`。
  [.tools/css/colors.mjs](../../.tools/css/colors.mjs) 在非 TTY(被程式接走的 stdout)時自動關色,
  dev 終端機照樣有顏色。也支援 `NO_COLOR` 與 `--no-color`。
- **面板刻意不自動彈出** —— RunOnSave 的 `autoShowOutputPanel` 沒設。
  專案還有幾百筆既有存量,每次存檔都彈面板會搶畫面;訊息留在「Run On Save」輸出面板,
  把它開在旁邊就看得到。要改成違規時自動彈,加 `"autoShowOutputPanel": "error"` 即可
  (`guard-file.mjs` 有違規時回 exit 1)。
- **dev server 那層用 `server.watcher` 而不是 `handleHotUpdate`** ——
  後者只對「已經進模組圖」的檔案觸發,存到當前頁面沒載入的組件時完全不會有反應。

各層共用 [.tools/css/lint-core.mjs](../../.tools/css/lint-core.mjs) 與
[.tools/css/color-order.mjs](../../.tools/css/color-order.mjs),判斷標準只有一套。
**除了色票檔的排序,任何工具都不會改動色值或程式碼。**

> pre-commit 經 `core.hooksPath` 生效,`npm install` 的 postinstall 會自動設定;
> 手動安裝為 `npm run hooks:install`([.tools/install-git-hooks.mjs](../../.tools/install-git-hooks.mjs))。
> ⚠️ 這個 repo 同時放 Official 與 Backstage,而 `core.hooksPath` 是 repo 層級設定、只能指一個目錄 ——
> 所以 **hook 本體收在 repo 根的 `.githooks/`**,由它依 staged 路徑的第一層目錄分派到各專案的
> `.tools/css/`。沒有這套工具的專案(目前的 Backstage)會自動略過,兩邊各自跑
> `hooks:install` 設的也是同一個值,不會互相覆蓋。

---

## 規則 1:顏色一律定義在色票檔,且分頻道

色票檔在 [assets/css/_common/](../../assets/css/_common/),依頻道切分:

| 檔案 | 誰用 | 怎麼載入 |
|---|---|---|
| `color.css` | **全頻道共用** | [nuxt.config.ts](../../nuxt.config.ts) 的 `css` 陣列 |
| `color<Channel>.css`(`colorBuy.css` / `colorMember.css`) | **單一頻道專用** | `layouts/<channel>.vue` 經 [scripts/runtime/channelColor.js](../../scripts/runtime/channelColor.js) |

### 新增顏色時的判斷順序

1. **先查色票檔有沒有了** —— 同一個色值不要重複建變數。
2. **這個顏色只有這個頻道用嗎?**
   - 只有一個頻道用 → 建在該頻道的 `color<Channel>.css`
   - **兩個以上頻道都用到 → 建在共用的 `color.css`**,頻道檔各自刪掉
3. 頻道檔出現與 `color.css` 相同的色值 → 頻道檔那份是多餘的,刪掉、使用端改用共用變數。

第 2、3 點由工具自動比對(`findSharedColors`),跨頻道重複時會警告,
但**不自動搬家** —— 搬動會牽動使用端,要人工確認。

### 違規寫法

| 違規寫法 | 範例 |
|---|---|
| 寫死色碼 | `color: #333`、`shadow-[0_2px_8px_0_#0000001a]` |
| 寫死 `rgb()` / `rgba()` / `hsl()` 字面值 | `background: rgba(0, 0, 0, 0.5)` |
| `rgba(var(--x-rgb), …)` 舊寫法 | `rgba(var(--black-rgb), 0.1)` → 改用 `var(--black-1a)` |
| 在色票檔以外定義顏色變數 | module 自己的 `:root { --popup-overlay-bg-color: #000000b3 }` |
| tailwind 內建色票 | `text-red-500`、`bg-black`、`shadow-black` |
| CSS 具名色 | `color: white`、`border: 1px solid black` |
| **取用不存在的色票變數** | `var(--blue-08dc)` 但色票檔沒有這個變數 |

最後一條特別要小心:取不到值時**畫面上不會有顏色,也不會報錯**,只能靠 lint 抓。

正確寫法:先到色票檔建立變數,再於使用端 `var(--blue-26e1)` / `text-[--gray-666]` / `bg-[--white]`。

> 透明色一律用 **8 碼 hex**(`--black-1a: #0000001a`),不要寫 `rgba(0,0,0,0.2)`,
> 也不要寫 `rgba(var(--black-rgb), 0.1)` —— **後者也會被抓**,改用對應的 8 碼 hex 變數。
> `hexToRgb`([postcss.function.js](../../postcss.function.js) / [.tools/postcss/functions.js](../../.tools/postcss/functions.js))
> 機制保留,但**目前已經沒有任何呼叫端,不要新增**。

### `-rgb` 衍生變數

`--white-rgb: hexToRgb(#fff)` 這種跟著本體走的衍生變數,工具會多檢查三件事:

1. **本體要存在** —— `--white-rgb` 就得有 `--white`。
2. **色值要一致** —— 兩者的 hex 不同就是抄錯。
3. **要真的有人在用** —— 沒有使用端就是死變數,建議刪掉。

命名不套色碼縮寫規則(跟著本體命名)。
2026-08-27 已把 `--white-rgb`、`--black-rgb` 刪除,`mSwiper` 的三行 shadow 改用 `--black-1a`
(`rgba(#000, 0.1)` 與 `#0000001a` 等值,畫面無變化)。

### 命名規則

格式為 **`--<色名>-<色碼縮寫>`**,色碼縮寫依 hex 型態決定:

| 型態 | 取法 | 範例 |
|---|---|---|
| 6 碼、三組不同 | 第 **1、3、5** 碼 + 第 **6** 碼 | `#276ee1` → `--blue-26e1`、`#2f3338` → `--gray-2338` |
| 6 碼、純灰(R=G=B) | 前 **2** 碼 | `#f7f7f7` → `--gray-f7` |
| 3 碼 hex | 原樣照抄 | `#999` → `--gray-999` |
| 純黑 / 純白 | 不加色碼 | `#fff` → `--white`、`#000` → `--black` |

**帶透明度**時,在上述縮寫後**再接 alpha 兩碼**;純黑白則只留 alpha 兩碼:

| 色值 | 變數名 |
|---|---|
| `#87b90d66` | `--green-8b0d66` |
| `#e5e5e54d` | `--gray-e54d` |
| `#0000001a` | `--black-1a` |
| `#ffffff1a` | `--white-1a` |

alpha 兩碼的換算為 `Math.round(透明度 × 255).toString(16)`,與
[tailwind.function.js](../../tailwind.function.js) 的 `onColorWithAlpha` 一致。
常用對照:`0.04→0a`、`0.08→14`、`0.1→1a`、`0.12→1f`、`0.2→33`、`0.3→4d`、`0.4→66`、`0.5→80`、`0.7→b3`。

命名不符規則**只警告不自動改**(改名會牽動使用端)。
`--white-rgb` 這類 `-rgb` 衍生變數跟著本體命名,不套色碼縮寫規則。

### 排序規則

`:root` 內的變數依 **紅 → 澄 → 黃 → 綠 → 藍 → 紫 → 金 → 白 → 灰 → 黑** 分組,
組內 **由淺至深**(WCAG 相對亮度高者在前);同一色的不同透明度則**透明度低(較淺)者在前**。
色系之間空一行。

**存檔時排序不對會自動修正**,不需要人工調整。

註解不會被排序吃掉:

- `/* 紅色 */`、`/* blue */` 這種**色系標頭**會固定放回該色系組的最前面。
- 其他說明性註解(例如 `/* CommonMHeader(全頻道共用 header)用色 */`)**跟著它下方的變數一起移動**。

---

## 規則 2:components 的 template 不得使用 tailwind class

[components/](../../components/) 底下 `.vue` 的 `<template>`,`class` 只能寫:

- 組件自身的 class:`m-anchor`、`m-tag-element` …
- modifier:`--px-15`、`--text-white`、`p:--h-40`、`hover:--underline` …

樣式本體寫進 [assets/css/_modules/](../../assets/css/_modules/)。

**不受這條約束的**:

- `pages/`、`containers/`、`layouts/` —— 使用端照舊用 tailwind
  (`:setClass="{ main: 'tm:mt-[12px]' }"` 是正常用法,不要去動)
- `.vue` 的 `<style>` 區塊與 module css 內的 `@apply`

---

## 規則 3:module 拆成資料夾,共用與變體分開

組件樣式以「一個組件一個資料夾」組織:
**[assets/css/_modules/&lt;頻道&gt;/&lt;組件&gt;/](../../assets/css/_modules/)**
(`common/` 為跨頻道共用組件,`buy/` 等為頻道專屬)。

| 檔案 | 放什麼 |
|---|---|
| `variables.css` | **共用變數**:`:root` 預設值,以及 modifier(`--px-XX` / `--h-XX`)對應的變數值,依 `@screen p` / `t` / `m` 分別定義。 |
| `common.css` | **共用版型**:所有變體共通的結構,以及 **`@screen` 的斷點對應**。可調的尺寸與顏色走 `var()`。 |
| `<變體>Variables.css` | 該變體專屬的變數(`borderBottomVariables.css`)。 |
| `<變體>.css` | 該變體專屬的樣式與斷點對應,整段包在 `.m-xxx { &.\-\-<變體> { … } }` 內(`borderBottom.css`)。 |
| `<群組>Variables.css` / `<群組>.css` | **兩個以上變體共用、但不是全部變體都要**的那一層(見下)。 |

### variables 檔只放「值」,版型檔放「行為」

這條是 variables 與版型檔的分界線,**由工具檢查**(`checkVariablesFile`):

| 放 variables 檔 | 例 |
|---|---|
| `:root` 的預設值 | `--form-radios-oval-element-px: 0;` |
| modifier 對應的**具體值** | `&.\-\-px-5 { --x-px: 5px; }` |
| modifier 指向**色票變數**(也是在設定值) | `&.\-\-text-white { --anchor-color: var(--white); }` |

| 放版型檔(`common.css` / `<變體>.css`) | 例 |
|---|---|
| 版型宣告 | `@apply h-[--x-size];`、`border-width: var(--x-border);` |
| **狀態切換** —— 把 module 自己的變數指向**自己的另一個變數** | `&.\-\-border { --x-border-color: var(--x-border-on-color); }`<br>`&.\-\-checked { --x-bg-color: var(--x-checked-bg-color); }` |
| **斷點對應** | `@screen p { .m-x { --x-size: var(--x-pc-size); } }` |

判斷方式很簡單:**這行是在「給一個值」,還是在「切換成另一個變數」?**
前者是值,後者是行為。`var(--white)` 這種指向色票的算給值(色票是值的來源);
`var(--x-checked-bg-color)` 這種指向自己 module 的變數則是切換。

### 群組共用層(兩個以上變體共用時)

有些變體之間共通的東西很多,但又不屬於「全部變體都要」——
例如 mForm 的 **checkbox 與 radio**:都要隱藏原生 input、都是 icon + label 並排、
都有對齊與游標的處理,但 Input / Select / TextArea 都用不到。

這種就開一層**群組層**,檔名用群組名(`selection.css` / `selectionVariables.css`),
夾在共用層與變體層之間:

| 層 | 檔案 | 誰吃得到 |
|---|---|---|
| 共用 | `variables.css` / `common.css` | mForm 全系列 |
| **群組** | `selectionVariables.css` / `selection.css` | **checkbox + radio** |
| 變體 | `checkboxVariables.css` / `checkbox.css` | 只有 checkbox |

**判斷**:兩個以上變體共用 → 群組層;只有一個變體用 → 變體層。
共用的結構不要在各變體檔裡各寫一份,更不要留在 template。

**資料夾名跟著 class 前綴走,不是組件檔名** —— 多數情況一致
(`mTab/BorderBottom.vue` → `m-tab` → `common/mTab/`),但不一定。這樣看到 class 就能找到檔案。

參考實作:[assets/css/_modules/common/mTab/](../../assets/css/_modules/common/mTab/)、
[common/mAnchor/](../../assets/css/_modules/common/mAnchor/)、
[common/mForm/](../../assets/css/_modules/common/mForm/)。

### 引入方式

在組件的 **`<script setup>` 最上方用 JS import**,`<style>` 區塊不要留。
順序固定為 **共用變數 → 變體變數 → 共用版型 → 變體樣式** —— 變數全部先定義完,版型才取用:

```js
<script setup>
import '@css/_modules/common/mTab/variables.css'
import '@css/_modules/common/mTab/borderBottomVariables.css'
import '@css/_modules/common/mTab/common.css'
import '@css/_modules/common/mTab/borderBottom.css'

// …其餘 import
</script>
```

有群組層時插在中間,**同樣是「變數全部先定義完,版型才取用」**:

```js
import '@css/_modules/common/mForm/variables.css'           // 共用變數
import '@css/_modules/common/mForm/selectionVariables.css'  // 群組變數
import '@css/_modules/common/mForm/checkboxVariables.css'   // 變體變數
import '@css/_modules/common/mForm/common.css'              // 共用版型
import '@css/_modules/common/mForm/selection.css'           // 群組版型
import '@css/_modules/common/mForm/checkbox.css'            // 變體樣式
```

> 不要用 `<style src="…">`,也不要用 `<style>` 裡的 `@import`。

### 狀態一律用 `--` 開頭,不要 `is-*`

元素的附屬狀態全部寫成 `--` 開頭的 modifier:

```
--readonly   --error   --disabled   --active   --curr
--checked    --focus   --open       --show     --has-label
```

**不要用 `is-active` / `has-label` 這種裸前綴** —— 專案只有 `--` 一種寫法,
看到 `--` 就知道是這個組件的狀態或變體,不必再分辨是哪一套命名。
(`jFormValid` 這類純粹給 JS 抓的 hook class 不在此限,它不帶樣式。)

### modifier 的命名對齊 tailwind

modifier 名稱就是 **tailwind 的 utility 名前面加 `--`**,不要自己另外發明說法:

| ✗ | ✓ | tailwind |
|---|---|---|
| `--has-border-b` | `--border-b` | `border-b` |
| `--is-rounded-20` | `--rounded-20` | `rounded-20` |

這樣看到 modifier 就知道它會影響哪個屬性,也不必記兩套詞彙。
`--oval`、`--checked`、`--align-top`、`--no-label` 這類**狀態或語意開關**在 tailwind 裡沒有對應,
維持專案自己的說法即可 —— 這條只約束「對得上 tailwind utility」的那些。

### 變數要不要開 modifier

拆 module 時**最基礎的判斷**,決定每個屬性寫成哪一種形式:

| 情況 | 形式 | 例子 |
|---|---|---|
| 整個專案**各處樣式不同**,使用端要能逐頁指定 | **開 modifier**,值由 `--<屬性>-<數值>` 決定 | `--px-24` / `--py-12` / `--h-46` |
| 整個專案**只有一種狀態**,不需要逐頁指定 | **不開 modifier**,只分 `pc` / `tablet` / `mobile` 三個值 | `--anchor-pc-border` / `--anchor-tablet-border` |

> **分不出來就直接問使用者**,不要自己猜 —— 猜錯的兩種代價不對稱:
> 該開沒開,之後要加值就得整組改寫並回頭動使用端;不該開卻開了,則留下一堆沒人用的死 modifier。
> 判斷方式是 Grep 使用端看實際用到幾種值 —— 只有一種值就屬第二類。

`--rounded`、`--oval`、`--text-center` 這類是**開關**不是「值的選擇」,本來就只是 modifier,
對應的值照第二種形式分斷點。

### 要點與踩過的坑

- **`@screen` 的斷點對應放 `common.css` / `<變體>.css`,不要放 variables.css** ——
  「p 吃 pc 那組」是固定的對應關係,屬於版型;variables.css 只放值與 modifier。
- **斷點對應掛在每一棵獨立 DOM 樹的第一層**。組件本體掛一次,子元素靠繼承;
  但 `<Teleport>` 出去的區塊(dropdown、popup)DOM 上不在組件內,
  **繼承會斷掉,必須自己再掛一份**。這種錯誤只會表現為「某些值沒生效」,很難察覺。
- ⚠️ **`px-[--x]` / `py-` / `mx-` / `my-` 的變數沒預設值就整條讀不到**。
  tailwind 展開成 `padding-left: var(--x); padding-right: var(--x)` 兩條,
  變數未定義時兩條一起失效,**畫面完全沒效果也不會報錯**。
- ⚠️ **「讓變數失效」不等於「這條宣告不存在」** —— 含無效 `var()` 的宣告會算成 **initial**(`padding` → 0)
  並照常參與 cascade,一樣會蓋掉使用端傳的 `m:px-[32px]`。
  想讓某個斷點完全不干涉,**必須讓那個斷點根本沒有這條宣告**:

  ```css
  /* ✗ mobile 給 0 或不定義變數 → 宣告仍在,算成 0，蓋掉使用端的 m:px-[32px] */
  /* ✓ 宣告本身只寫在有值的斷點 */
  .m-form-filter { @apply rounded-[--form-filter-rounded] bg-[--form-filter-bg-color]; }
  @screen pt { .m-form-filter { @apply p-[--form-filter-p]; } }
  ```

  | 情況 | 做法 |
  |---|---|
  | 屬性**完全由 module 的 modifier 控制**,使用端不會另外傳 | `:root` 給 base(`--x-px: 0`),否則 modifier 沒帶到時整條讀不到 |
  | **使用端也會傳同一個屬性**,而該斷點 module 原本就沒設定 | 把宣告**收進有值的斷點**,該斷點完全不寫這條 |

- ⚠️ **變數建在「用到的最小單位」上**(padding / margin / border-radius 都適用)。

  這些屬性的 modifier 有層級:整體 → 軸向 → 單邊 → 單角。
  **只要同一個組件用到一個以上的層級,變數就要建在最細的那一層**,
  較粗的 modifier 同時設它涵蓋的每一個細變數,`common.css` 也用最細的 utility 分開取。

  | 組件用到的 modifier | 要建立的變數 |
  |---|---|
  | 只有 `--p-*` | `--x-p` 一個就好 |
  | `--p-*` + `--px-*` / `--py-*` / `--pb-*` … | `--x-pt` / `--x-pr` / `--x-pb` / `--x-pl` |
  | 只有 `--rounded-*` | `--x-rounded` 一個就好 |
  | `--rounded-*` + `--rounded-t/-b-*` | `--x-rounded-t` / `--x-rounded-b` |
  | `--rounded-*` + `--rounded-x/-y-*` | `--x-rounded-x` / `--x-rounded-y` |
  | `--rounded-*` + 單角 `--rounded-tl/-tr/-bl/-br-*` | 四個角各一個變數 |
  | `--rounded-t/-b/-x/-y-*` + 單角 | 四個角各一個變數 |

  margin 同理(`--m-*` + `--mx-*` … → `--x-mt` / `-mr` / `-mb` / `-ml`)。

  ```css
  /* variables.css —— 每個 modifier 只設它負責的那幾個細變數 */
  &.\-\-p-24, …        { --content-pt: 24px; --content-pr: 24px; --content-pb: 24px; --content-pl: 24px; }
  &.\-\-px-30, …       { --content-pr: 30px; --content-pl: 30px; }
  &.\-\-py-20, …       { --content-pt: 20px; --content-pb: 20px; }
  &.\-\-pb-20, …       { --content-pb: 20px; }
  &.\-\-rounded-20, …  { --content-rounded-t: 20px; --content-rounded-b: 20px; }
  &.\-\-rounded-b-20, …{ --content-rounded-b: 20px; }

  /* common.css —— 用最細的 utility 分開取,不要用 p- / px- / rounded- 的 shorthand */
  .m-content {
    @apply rounded-b-[--content-rounded-b] rounded-t-[--content-rounded-t]
           pb-[--content-pb] pl-[--content-pl] pr-[--content-pr] pt-[--content-pt];
  }
  ```

  **為什麼**:這樣「誰蓋掉誰」由*設了哪個細變數*決定,不必依賴宣告順序,
  也不受 tailwind 輸出順序影響(`@apply p-[…] px-[…]` 的先後在產物裡是 tailwind 自己排的,
  不是你寫的順序)。而且使用端就不必再用 tailwind 直接傳 `m:rounded-b-[20px]` 去補
  module 缺的那一層 —— **那種寫法會跟 module 的 shorthand 宣告在同一個優先權上打架**。
  使用端已經在傳某個細粒度的 tailwind 時,正確做法是**幫 module 補對應的 modifier**,
  而不是讓兩邊硬碰(mContent 的 `--rounded-b-20` 就是這樣補出來的)。
- **高度的 base 不能給 0**。padding / rounded 給 0 等同「沒設定」是對的,
  但 `--x-h: 0` 會讓元素直接塌掉 —— 高度的 base 要給 `auto`。
- **`border-width` 直接寫 CSS 屬性**(`border-width: var(--x-border)`),不要 `@apply border-[…]` ——
  production 會壓成 `border` shorthand,值是 `var()` 時整條失效。`border-color` 沒這問題。
- **`text-[--var]` 會被當成 color**,必須寫 `text-[length:--x-text-size]`。
  tailwind 推斷不出型別時一律當 color,產生 `color: var(…)` 而不是 `font-size`,**完全不會報錯**。
- **`box-shadow` 直接寫 CSS 屬性**(`box-shadow: var(--x-shadow)`),不要 `@apply shadow-[…]` ——
  和 `text-[--var]` 同一個病:tailwind 推斷不出型別就當成**陰影顏色**,產出
  `--tw-shadow-color: var(…); --tw-shadow: var(--tw-shadow-colored)`,
  **`box-shadow` 這條根本不會出現**,一樣不報錯。`shadow-[var(--x)]` 也一樣沒救。

  | 屬性 | 寫法 | 為什麼 |
  |---|---|---|
  | `border-width` | 原生 `border-width: var(--x-border)` | production 壓成 `border` shorthand,值是 `var()` 時整條失效 |
  | `box-shadow` | 原生 `box-shadow: var(--x-shadow)` | `shadow-[…]` 被當成 shadow **color** |
  | `border-color` | `@apply border-[--x-border-color]` ✓ | 產出正確的 `border-color`,沒問題 |
  | `font-size` | `@apply text-[length:--x-text-size]` | 不寫 `length:` 會變成 `color` |
  | `column-gap` | `@apply gap-x-[var(--x-gap,0px)]` ✓ | arbitrary value 內可帶 `var()` fallback |

  另外 `transition-property: transform` **不要換成 tailwind 的 `transition-transform`** ——
  後者會連帶塞進 `transition-duration: 150ms` 與 `transition-timing-function: cubic-bezier(.4,0,.2,1)`。
  duration 若由 JS inline 控制還蓋得掉,timing-function 蓋不掉,**動畫手感會變**;
  原本沒有 duration 的元素則會憑空多出 150ms 動畫。要換之前先確認 duration 由誰決定。
  `transform: translate3d(0,0,0)` 這種 GPU 提示同理,維持原生寫法就好
  (`transform-gpu` 展開成一整串 `--tw-translate-*` 鏈,反而更繞)。
- ⚠️ **字級定在哪,看組件是不是「固定位置」**:

  | 組件性質 | 字級放哪 | 例子 |
  |---|---|---|
  | **固定位置、全站長一樣**的組件 | module 自己定,走 `:root` 變數(`--x-text-size`,分三斷點) | 麵包屑、分頁器、mNav、mFooter |
  | **到處複用、每個位置都不同**的組件 | **由父系 `setClass` 傳 tailwind class**,module 不定 `text-*` | 按鈕(mAnchor)、mForm 全系列、mTag |

  第二類的組件**沒有對應的 `setClass` key 就補一個**,並且**把原本的值補回每一個使用端**,
  否則字級會變成繼承。例如 mForm 的 Select / AutoComplete 補了 `setClass.dropdownLabel`,
  五個 Select 與兩個 AutoComplete 的使用端各自補上 `dropdownLabel: 'text-[14px]'`。

  另一個例外是使用端根本沒有管道可傳(後台編輯器存進 HTML 的 class),那就留在 module。
  **分不出來就問使用者。**
- **狀態(hover / focus / active)一律用「覆寫基礎變數」**,不要在 `:root` 用
  `--x-hover-color: var(--x-color)` 做 fallback —— custom property 的 `var()` 在**定義它的元素**上
  就解析完再繼承,`:root` 當下 `--x-color` 還是 `initial`,後面再怎麼覆寫都救不回來,
  結果是「hover 時顏色整個掉光」。組件若有 `.group` 版本的 hover,要補一組 `.group:hover .m-xxx`。
- ⚠️ **顏色是組件的職責,使用端不得自訂**。modifier 只設 `--x-color`,
  `common.css` **無條件**套用 `text-[--x-color]`;沒有顏色時用 `--x-color: initial`。

  使用端在 `setClass.main`(或 `class`)寫 `text-[--gray-999]` 這種 tailwind 顏色**本身就是錯的** ——
  它會被 module 的宣告蓋掉,而且**本來就該被蓋掉**。正確做法是:

  1. **module 補上對應的顏色 modifier**(例如 mAnchor 補 `--text-gray-999`)
  2. 使用端改成 `main: '--text-gray-999 …'`

  **不要**為了讓使用端能自訂顏色,把 module 的宣告用 `:is(…列出所有 modifier…)` 條件化 ——
  那等於把顏色的決定權交回使用端,「組件定義顏色」就失去意義了,
  顏色也會散落在各個頁面而不是集中在 module。

  (這條與尺寸 / 圓角不同:那些**可以**由使用端傳,所以 module 要留意不要無條件蓋掉;
  顏色則相反,一律由 module 決定。)
- **不要為了「全部變數化」硬抽結構值**。`w-1/2`、`z-[1]`、`duration-300`、`rounded-full`
  這種不隨情境調整的直接寫。
- **`transition` 也走 tailwind**:`@apply [transition:transform_0.3s_ease,opacity_0.2s_ease]`(空格用 `_`)。
- modifier 的斷點寫法:`p` 段收 `--x`、`p:--x`、`pt:--x`;`t` 段收 `--x`、`pt:--x`、`tm:--x`、`t:--x`;
  `m` 段收 `--x`、`tm:--x`、`m:--x`。
- 看起來像 typo 的既有 class 名**先確認參考專案**([D:\Projects\Delta\EFOfficial](file:///D:/Projects/Delta/EFOfficial)),
  兩邊一致就是既有命名,不要順手改。

---

## 規則 4:module 變數的命名與斷點

這條**由工具自動檢查**([lint-core.mjs](../../.tools/css/lint-core.mjs) 的 `checkModuleVariables`),
不必靠記憶。

### 變數的前綴跟著 module 走

變數名的前綴要和 **class 前綴 / 資料夾**對得上,看到變數就知道它屬於哪支 module:

| ✗ | ✓ |
|---|---|
| `--m-autocomplete-dropdown-label-px` | `--form-autocomplete-dropdown-label-px` |
| `--m-tab-select-h` | `--tab-select-h` |

`mForm/` 底下一律 `--form-*`(變體再接變體名:`--form-autocomplete-*` / `--form-select-*`),
`mTab/` 底下一律 `--tab-*`。**不要在變數名裡塞 `m-` 前綴** —— 那是 class 的慣例,不是變數的。

### class 名被佔用時不要硬合併

同一組 module 裡不同元素撞名時,**維持原本的 class 不要改**,在 variables 檔頭註明原因。
例如 `mForm/` 的 `.m-form-label` 已經被 CheckBox / Radio / RadiosOval 用在「選項文字」上,
所以 Label 組件維持 `.m-label` —— 兩者是不同元素,合併命名會讓樣式互相汙染。
(參考專案 EFOfficial 也踩過同一個坑,處理方式一致。)

### 命名慣例

| 不要寫 | 要寫 |
|---|---|
| `-width` | `-w` |
| `-height` | `-h` |
| `-padding` | `-p` |
| `-margin` | `-m` |
| `-border-width` | `-border` |

字級一律 `-text-size`(不是 `-text`)。

### 尺寸類的值一律分三份

`:root` 裡只要是尺寸(`px` / `rem` / `%` / `vh` / `vw`),就**必須拆成
`pc` / `tablet` / `mobile` 三份**,即使目前三個值一模一樣:

```css
/* ✗ */  --pagination-p: 4px;
/* ✓ */  --pagination-pc-p: 4px;
         --pagination-tablet-p: 4px;
         --pagination-mobile-p: 4px;
```

之後要單獨調某個斷點時直接改值就好,不必回頭拆結構。**顏色不用分斷點。**

**不受這條約束的**:顏色、`0` / `0px` / `auto` / `none` / `transparent` / `inherit` / `initial`、
已經有對應斷點版本的 base 值、純結構性不隨裝置調整的造型(直接寫死不要開變數)。

---

## 規則 5:.vue 的 import 順序

`<script setup>` 的 import 由「離這支組件最近」排到「最遠」:

| 順序 | 類別 | 例 |
|---|---|---|
| 1 | **css** | `import '@css/_modules/common/mForm/variables.css'` |
| 2 | **`./.composables`** | `import useValidateEvents from './.composables/useValidateEvents.js'` |
| 3 | **`@js`** | `import { onDeepMerge } from '@js/_prototype.js'` |
| 4 | **其他套件** | `import { Field } from 'vee-validate'` |

```js
<script setup>
import '@css/_modules/common/mForm/variables.css'
import '@css/_modules/common/mForm/selectionVariables.css'
import '@css/_modules/common/mForm/radioVariables.css'
import '@css/_modules/common/mForm/common.css'
import '@css/_modules/common/mForm/selection.css'
import '@css/_modules/common/mForm/radio.css'

import useValidateEvents from './.composables/useValidateEvents.js'

import { onDeepMerge } from '@js/_prototype.js'

import { Field, ErrorMessage } from 'vee-validate'
```

類別之間空一行,**同類別內維持既有順序** —— css 之間的先後有意義(見規則 3 的引入順序)。
`@stores` / `@components` / `@imgs` 這些沒列在上面的**不參與排序檢查**,
但習慣上排在 `@js` 之後、第三方套件之前。

這條由工具檢查([lint-core.mjs](../../.tools/css/lint-core.mjs) 的 `checkImportOrder`)。

---

## 檢查工具

```powershell
npm run lint:css                              # 全專案掃描(四條規則)
node .tools/css/lint-css.mjs <檔案或目錄>      # 只檢查指定範圍
node .tools/css/lint-css.mjs --json           # JSON 輸出,供程式解析

node .tools/css/sort-color-css.mjs            # 色票檔:檢查排序 / 命名 / 頻道歸屬
npm run sort:color                            # 色票檔:自動排序
```

| 檔案 | 職責 |
|---|---|
| [.tools/css/color-order.mjs](../../.tools/css/color-order.mjs) | 色票檔的解析、命名驗證、亮度排序、頻道歸屬比對 |
| [.tools/css/lint-core.mjs](../../.tools/css/lint-core.mjs) | 四條規則的判斷邏輯(只判斷,不輸出也不改檔) |
| [.tools/css/lint-css.mjs](../../.tools/css/lint-css.mjs) | 檢查用 CLI |
| [.tools/css/sort-color-css.mjs](../../.tools/css/sort-color-css.mjs) | 排序用 CLI |
| [.tools/css/guard-file.mjs](../../.tools/css/guard-file.mjs) | 存檔用的單檔入口(排序 + 檢查),給 Run on Save 呼叫 |
| [.tools/css/colors.mjs](../../.tools/css/colors.mjs) | CLI 顏色開關(非 TTY 自動關色) |
| [.tools/install-git-hooks.mjs](../../.tools/install-git-hooks.mjs) | 設定 `core.hooksPath`(postinstall 自動跑) |

拆 module 前也要看規則 3 的「動工前一定要查的三件事」:
這支 css 有沒有被載入(`_modules/` 不在 `nuxt.config.ts` 的 `css` 陣列裡,全靠組件自己 import,
沒人 import 就是**死檔**,先問使用者要重寫還是刪)、定義出來的 modifier 有沒有人在用、
template 綁了但沒有對應 CSS 的 class 是刻意不做還是漏掉。

---

## 目前的違規存量

2026-08-27 導入後的全專案掃描結果(共 414 筆 / 258 個檔案),**這些是既有程式碼,尚未修正**:

| 規則 | 筆數 | 主要分布 |
|---|---|---|
| 規則 1(顏色) | 22 | `_modules/common/mForm/{autocomplete,select}Variables.css`(寫死 `#02041614` 等)、`_modules/buy/mTag/variables.css`(`#00000033`)、`_modules/common/mPopup/variables.css`(`#000000b3`)、`pages/buy/_components/house/poi/GoogleMap.vue`(地圖 styler 的 `#2f3338`) |
| 規則 2(tailwind) | 356 / 37 個檔案 | components 幾乎全數仍用 tailwind class |
| 規則 3(module) | 20 | components 自己留 `<style>` 區塊 |
| 規則 4(變數) | 16 | `-width` / `-height` 命名、尺寸單值未分斷點 |
| 色票檔本身 | **0** | 排序、命名、頻道歸屬、`-rgb` 衍生變數皆已清乾淨 |

碰到這些檔案時會跳警告,**那是既有存量不是這次改壞的**;是否順手修正由使用者決定,不要自行大範圍重構。

**已拆完的 module**:

| 組件 | 資料夾 | 備註 |
|---|---|---|
| `components/common/mContent.vue` | [common/mContent/](../../assets/css/_modules/common/mContent/) | 2026-08-28 拆完,三條規則皆通過。它同時有 `--p-*` / `--px-*` / `--py-*` / `--pb-*` 四種內距 modifier,所以**變數拆成 `--content-pt` / `-pr` / `-pb` / `-pl` 四個方向**,每個 modifier 只設它負責的方向,`common.css` 也用 `pt-` / `pr-` / `pb-` / `pl-` 四條分開取(見上面規則 3 的要點)。`bg` 與 `rounded` 各一個變數,base 都給 0。 |
| `components/common/mContainer.vue` | [common/mContainer/](../../assets/css/_modules/common/mContainer/) | 2026-08-27 拆完,三條規則皆通過。樣式原本就是 modifier 形式(`--max-w-1220 / 500 / 400`、`--px-10`),只是值寫死在 modifier 裡;改成 modifier 只設 `--container-max-w` / `--container-px`,版型統一取用。`--container-px` 的 base 給 `0`(不給會讓 `px-[--x]` 整條讀不到)。`@screen t` / `m` 段的定義不能刪 —— 使用端的 `tm:--px-10` 要靠那兩段收。 |
| `components/common/ImgSrc.vue` | [common/mFigure/](../../assets/css/_modules/common/mFigure/) | 2026-08-27 拆完,三條規則皆通過。**資料夾名跟著 class `m-figure` 走,不是組件檔名**。無變體,只有 `variables.css` + `common.css`。404 佔位補了 `--error` modifier 與 `m-figure-error-icon` class;內部變數的既有 typo `--figuer-*` 一併更名為 `--figure-*`(參考專案早已是正確拼字,只在這支檔案內用,無使用端受影響)。modifier `group-hover:--image-scale` 名稱不變(使用端在 [Media.vue](../../pages/buy/_components/common/card/Media.vue))。 |

**導入時已修掉的**(2026-08-27):

- 補上 5 個缺失的色票變數 —— `--gray-c8`、`--blue-08dc`、`--blue-08dc1a`、`--blue-6dd7`
  進 `colorBuy.css`,`--gray-334d`、`--black-1a` 進 `color.css`。
  這些變數原本被 `_modules/buy/mSwiper/variables.css` 與 `components/common/mForm/Select.vue`
  取用但從未定義 —— **那些顏色一直是沒生效的**(CSS 不會報錯,只能靠 lint 抓)。
- `Select.vue` 的 `--gray-3334d` 更名為符合規則的 `--gray-334d`。
- 刪掉死變數 `--white-rgb` / `--black-rgb`,`mSwiper` 三行 shadow 改用 `--black-1a`。

> ⚠️ `--blue-08dc`(#0087dc)、`--blue-6dd7`(#64d7d7)是照參考專案 EFOfficial 的色值補的,
> 補上後 buy 頻道 swiper 的分頁點與左右鈕**會從「沒顏色」變成顯示這兩個藍** ——
> 若設計上 buy 頻道該用自家主色(`--blue-26e1`),要回頭跟設計確認後改值。

> **`pages/buy/_components/house/poi/GoogleMap.vue` 的寫死色碼是已知例外** ——
> Google Maps 的 styler 吃 JS 物件,沒有 CSS 變數的管道,只能維持寫死。

## 與參考專案的關係

這套規則與工具移植自 [D:\Projects\Delta\EFOfficial](file:///D:/Projects/Delta/EFOfficial)
(`.claude/rules/css-conventions.md` + `.tools/css/`),**基準為 2026-08-27 的版本**。
兩邊是各自的複本,不會自動同步:

- 本專案多出來的是**頻道色票**(`color<Channel>.css` 與跨頻道收攏檢查)、
  `_modules/<頻道>/<組件>/` 多一層路徑、色票註解不被排序吃掉、「取用未定義色票變數」、
  `-rgb` 衍生變數的三項檢查、以及「使用者送出訊息時」那層守門(存檔後的修正詢問)。
- 那邊之後若更新規則或工具,要人工回頭對照,不要假設兩邊一致。
