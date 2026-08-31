# CSS 撰寫規範

本規則每次對話都必須遵守。摘要與觸發時機見 skill [css-conventions](../skills/css-conventions/SKILL.md)。

> **規則本體(到「檢查工具」為止)不綁任何專案** —— 要移植到別的專案時整份複製,
> 只需要調整最後的「[本專案現況](#本專案現況)」一章,以及路徑前綴
> (有些專案的原始碼在 `src/` 底下,`assets/css/…` 就要寫成 `src/assets/css/…`)。

**違規一律只警告不阻擋** —— 擋下來只會逼人繞過(加 `--no-verify`),反而讓守門機制形同虛設。

### ⚠️ 每一輪都要列出違規 —— 但不要主動問「要不要修」

**不沉默,也不打斷。** 這兩件事要同時成立,缺一個都不對:

| | 做法 | 為什麼 |
|---|---|---|
| **每一輪都列** | 只要違規還在,清單每一輪都會出現。**不去重** —— 上一輪列過不算數,使用者上次說「先不用」也不算數。 | 沉默會讓違規靜靜留著,讓人以為已經處理完了。**要它不再出現的唯一方式,是把違規修掉。** |
| **不主動彈問句** | **不要呼叫 AskUserQuestion 問「要不要現在修」。** | 同一份警告使用者存檔時已經在終端機 / 輸出面板看過了,那裡就寫著「要修就打『修正』」。再彈一次只是重複打斷。 |

使用者說「修正」「好」「幫我改」時**直接動手**,不用再問一次是哪個檔案 —— 清單就在上下文裡。
他沒開口就不要修、也不要催,主動權在他手上。
動手時要說清楚**哪些是這次改出來的、哪些是碰到的舊檔案存量**,別讓他誤以為都是新問題。

> **這條規則改過方向,值得記一下為什麼。**
>
> 最早的版本要求「有違規就一定要彈 AskUserQuestion,沒有例外」,
> 那是為了解決一個真實的失敗:明明跳了紅字,卻用「等做到它再處理」「那支比較特殊,晚點說」
> 帶過,或只是把它列進待辦清單 —— 違規就這樣靜靜留著。
>
> 但每一輪都彈問句太吵,而且終端機那層本來就看得到同一份警告。
> 所以拆成兩半:**可見性由「每輪都列」保證,決定權留給使用者。**
> 真正要避免的是沉默,不是「沒彈窗」—— 只要清單還在每一輪出現,前面那些規避寫法就失效了,
> 因為它根本躲不掉。

**這條不適用於「判斷不出來」的情況** —— 那是「該怎麼做」不是「要不要修」,
見下面的「判斷不出來就問」,遇到岔路一律要問,那條沒有放寬。

違規清單由 [.claude/hooks/cssGuard.js](../hooks/cssGuard.js)(Claude 寫檔時)與
[.claude/hooks/cssGuardPrompt.js](../hooks/cssGuardPrompt.js)(使用者送出訊息時)帶進對話,
但**不要依賴 hook 有沒有帶** —— 自己跑 `npm run lint:css` 或 commit 時看到的警告,一樣照這條處理。

## 四層守門

| 機制 | 何時生效 | 行為 |
|---|---|---|
| [.vite/css-guard.mjs](../../.vite/css-guard.mjs) | 編輯器存檔,**需 `npm run dev` 執行中** | 色票檔自動排序、其他檔案印紅色警告到 dev 終端機 |
| [.vscode/settings.json](../../.vscode/settings.json) 的 `emeraldwalk.runonsave` | 編輯器存檔,**不需 dev server**(要裝擴充 `emeraldwalk.RunOnSave`) | 跑 [.tools/css/guard-file.mjs](../../.tools/css/guard-file.mjs):色票檔自動排序 + 逐筆列出違規,**有違規時自動彈出**「Run On Save」輸出面板 |
| [.claude/hooks/cssGuard.js](../hooks/cssGuard.js) | **Claude 用 Write / Edit 寫檔**,隨時 | 自動排序 + 違規清單回報到對話(背景資訊,不主動彈問句) |
| [.claude/hooks/cssGuardPrompt.js](../hooks/cssGuardPrompt.js) | **使用者送出訊息時**(補「自己存檔」的情境) | 掃追蹤清單 + 工作區有改動的 .vue / .css:色票檔自動排序 + 帶出違規清單 |
| [.githooks/pre-commit](../../.githooks/pre-commit) | `git commit` 時,**不依賴 dev 或編輯器** | 色票檔自動排序並加入本次 commit;staged 檔案的違規印警告後照常 commit |

**「存檔就看到警告,想修的時候一句話就修」是這樣拼起來的**:

1. **排序與警告**在存檔當下完成(dev server 的 vite plugin,或 Run on Save 擴充),
   面板上就寫著「要修就到 Claude Code 打『修正』」。
2. **終端機與輸出面板都是單向的**,沒辦法在那裡接你的回答 ——
   而 Claude Code 也沒有「檔案變更就喚醒對話」的 hook,對話只能由你這邊起頭。
3. 所以存檔那層([guard-file.mjs](../../.tools/css/guard-file.mjs))會把「剛存了哪些檔」
   寫進 `node_modules/.cache/cssGuard/pending.json` 當接力棒,
   `cssGuardPrompt.js` 在你**下一次送出訊息**時讀出來,把違規清單帶進對話 ——
   Claude 記著但不打斷你,等你說「修正」再動手。

**`pending.json` 是「還沒修好的檔案」清單,不是「還沒回報過的」** ——
所以它**不是讀走就清空**,而是每一輪重新 lint、**只把已經通過的檔案移除**
([`onDropClean`](../hooks/cssGuardPrompt.js#L131))。違規還在就一直留在清單裡,每一輪照樣列出。

早期還有一份 `reported.json` 負責去重(同一筆回報過就安靜),**已經移除** ——
它會讓違規在第二輪之後靜靜消失,看起來像處理完了,正是這套機制要避免的事。
快取在 `node_modules/.cache/`,不進版控。

### 通過也要出聲,而且要帶時間

**存檔時沒有違規,一樣要印 `✔ 通過`** —— dev 終端機與輸出面板都不會自己清空,
靜默的話上一次的紅字會留在畫面上,看起來就像「這次存檔還是沒過」。

兩層的輸出都帶 **`HH:MM:SS` 時間戳**,通過與違規都印:

```
[css-guard] ✔ assets/css/_modules/buy/mPagination/common.css 通過 13:21:14
[css-guard] ⛔ assets/css/_modules/buy/mSwiper/common.css      13:21:14
```

沒有時間戳就分不出「這是剛剛那次存檔的結果」還是「上一次留著沒被捲掉的舊訊息」。

> 對話那兩層(`cssGuard.js` / `cssGuardPrompt.js`)**不適用這條** ——
> 它們是「有事才說」,通過時保持安靜才不會洗版;訊息本來就跟著對話輪次走,不會有殘留問題。

存檔那層有兩個容易踩到的細節,都已處理:

- **VSCode 的輸出面板不吃 ANSI 色碼** —— 硬印會變成一堆 `esc[31m`。
  [.tools/css/colors.mjs](../../.tools/css/colors.mjs) 在非 TTY(被程式接走的 stdout)時自動關色,
  dev 終端機照樣有顏色。也支援 `NO_COLOR` 與 `--no-color`。
- **違規時面板會自動彈出** —— RunOnSave 設了 `"autoShowOutputPanel": "error"`,
  而 `guard-file.mjs` **違規回 exit 1、通過回 exit 0**,所以正好是「只有出事才打擾你」:
  存檔有違規 → 「Run On Save」面板自己跳出來;通過 → 只默默印一行 `✔`,不搶畫面。
  不想被打擾就把那一行拿掉,訊息仍會留在面板裡。

  ⚠️ 這兩個 exit code 是那個設定的依據,**改 `guard-file.mjs` 時不要動它們** ——
  一律 exit 0 的話面板就永遠不會彈,一律 exit 1 則每次存檔都彈。
- **dev server 那層用 `server.watcher` 而不是 `handleHotUpdate`** ——
  後者只對「已經進模組圖」的檔案觸發,存到當前頁面沒載入的組件時完全不會有反應。

各層共用 [.tools/css/lint-core.mjs](../../.tools/css/lint-core.mjs) 與
[.tools/css/color-order.mjs](../../.tools/css/color-order.mjs),判斷標準只有一套。
**除了色票檔的排序,任何工具都不會改動色值或程式碼。**

### 沒裝 RunOnSave 擴充會怎樣

**存檔那一層整層失效** —— 它是唯一「你打字的當下就回報」的機制,沒有它:

| 仍然有效 | 失效 |
|---|---|
| 對話那層(`cssGuardPrompt.js` 靠 `git status` 掃改動過的檔案,不依賴任何擴充) | 存檔時的即時警告與面板彈出 |
| `git commit` 的 pre-commit | 存檔時的色票檔自動排序 |
| dev server 那層(**前提是 `npm run dev` 有在跑**) | `pending.json` 接力棒 —— 「存了檔但內容沒變」或「改動已 commit」的情況對話那層會漏掉 |

所以 `npm install` 會跑 [.tools/check-vscode-extensions.mjs](../../.tools/check-vscode-extensions.mjs)
檢查並印出黃色警告,說明用途、沒裝的後果與安裝指令;
[.vscode/extensions.json](../../.vscode/extensions.json) 則讓 VSCode 在第一次開這個工作區時主動提示安裝。

兩者都**只提醒不阻擋**:找不到 VSCode 擴充目錄(CI、非 VSCode 使用者)時安靜跳過,
一律 exit 0 —— 擋住 `npm install` 只會讓人想繞過。

> pre-commit 經 `core.hooksPath` 生效,`npm install` 的 postinstall 會自動設定;
> 手動安裝為 `npm run hooks:install`([.tools/install-git-hooks.mjs](../../.tools/install-git-hooks.mjs))。
> 擴充檢查為 `npm run check:extensions`。
>
> ⚠️ `core.hooksPath` 是 **repo 層級**的設定、只能指向一個目錄。
> 一個 repo 裡放了多個專案時,pre-commit 要能**依 staged 路徑的第一層目錄分派**到各專案的
> `.tools/css/`,沒有這套工具的專案自動略過 —— 否則誰後跑 `hooks:install` 就蓋掉誰。
> 每個專案一個 repo 時不需要這層,hook 直接處理根目錄即可。

---

## ⚠️ 判斷不出來就問 —— 不要猜

這條和「有違規要問」一樣重要,但性質不同:那條是**修不修**,這條是**怎麼做**。

拆 module 時會遇到一堆「規則沒有明說、要看意圖才知道」的岔路。
**猜錯的代價是不對稱的**:猜對省下一次提問,猜錯要回頭改 module、改 template、
還要把值補回每一個使用端 —— 而且常常是幾天後才發現。

**一定要問,不要自己決定的**:

| 岔路 | 為什麼看程式碼判斷不出來 |
|---|---|
| 這個屬性**要不要開 modifier** | 取決於「將來各頁面會不會想各自指定」,不是現在有幾種值 |
| 字級歸 module 還是**父系 `setClass`** | 取決於這個組件是不是「固定位置」,那是設計意圖 |
| 語意標籤(`strong` / `em`)**要不要給 class** | 取決於使用端將來想不想改它的字級 / 顏色 |
| 某個斷點沒有設定,是**刻意例外還是漏寫** | 兩者長得一模一樣,只有原作者知道 |
| 非 px 的值(`duration-*`、`rounded-full`、`w-full`)**要不要變數化** | 規則只明確要求 px;這些是灰色地帶 |
| 這支 css **沒人 import,要重寫還是刪** | 可能是還沒接上,也可能是廢棄品 |
| modifier **定義了卻沒人用**,要留還是刪 | 可能是預留給還沒做的頁面 |
| template 綁了 class **但沒有對應 CSS** | 可能是刻意不做,也可能是漏掉(實際遇過兩種都有) |

**問的方式**:直接說「這個我判斷不出來」,把兩三個選項與各自的後果列出來,
不要假裝有把握然後埋一個註解說「暫時這樣」。

### 「沒使用端的 modifier」刪之前先做三件事

2026-08-31 稽核 Official 找出 9 個沒有使用端的 modifier,決定**刪 7 個、留 2 個** ——
差別在「刪掉之後失去什麼」:

| | 判斷 | 實例 |
|---|---|---|
| **可以刪** | 它只是一個**選項**,刪掉不影響任何現有畫面,也不會讓其他宣告變成死碼 | `--border-gray-db`(mTag)、`--text-orange-f74c`(mAnchor)、`--resize-x` / `-y`(mForm)、`--gap-x-30` / `-24` / `-10`(mSeparator) |
| **先問再說** | 刪掉等於**移除一個功能**:會連帶讓一批變數變孤兒、讓版型檔的 `@apply` 讀不到值 | `--pagination-point` / `--pagination-bar`(mSwiper)—— 連帶 19 個變數與 bullet 的整段版型,實質是移除分頁點的兩種造型。**已決定保留,見那支檔案的註解** |

**刪之前一定要查的三件事**(缺一件就可能刪錯):

1. **有沒有動態拼接的 class** —— 樣板字面值拼出來的 modifier(`--` 接變數)grep 抓不到。
   先全案搜 `'--'` 與 `--` 後面接變數的寫法,確認哪些組件會拼 class
   (Official 只有 mTooltip 的 `--<align>-x` / `--<side>-y` 與 mPopup 的 `--<mode>`)。
2. **組件本身有沒有對應的 props / 綁定** —— `--resize-x` 那組就是查了才發現
   TextArea.vue **完全沒有 resize 相關程式碼**,不是「使用端還沒用」而是功能沒接上。
3. **刪掉會不會讓別的東西變孤兒** —— 那些 modifier 設定的 `-pc-` / `-tablet-` / `-mobile-`
   值變數、以及版型檔取用它們的 `@apply`,都要一起清掉,否則留下讀不到值的死宣告。

**刪掉後在檔頭留紀錄**(照 [deleted-components.md](./deleted-components.md) 的慣例):
刪了什麼、為什麼、要加回來時從 git 撈、格式照哪一組寫。
mForm/textarea.css 與 mSeparator/variables.css 的檔頭就是這樣寫的。

### 「沒有對應 CSS 的 class」先查這四種正當理由,再問

這條岔路**大多數情況是刻意的**,不是漏掉 —— 2026-08-31 全案稽核 Official,
找出 15 個沒有對應 CSS 的 `m-*` class,查完發現**一個都不用補**。
所以遇到時先照下面判斷,只有四種都不符合才需要問。

| 正當理由 | 怎麼認 | 稽核時的實例 |
|---|---|---|
| **1. 根本不是 class** | 字串長得像 class,其實是事件名 / 常數 | `new Event('m-swiper-update')` —— 自訂事件名 |
| **2. `setClass` 的掛載點** | 同一個標籤上有 `:class="setClass.xxx"` | `.m-anchor-text` + `setClass.text`、`.m-popup-note` + `setClass.note` 等 7 個 |
| **3. 樣式在父層,靠繼承或容器** | 字級 / 顏色定在父容器,子元素繼承;或間距由父層的 `gap` 負責 | `.m-loading-text` 的字級在 `.m-loading-container`;`.m-sort-item` 的間距在 `.m-sort-list` 的 `gap-x` |
| **4. 純結構標記** | SVG 的 `<g>` 群組、只為包住一組元素的容器,樣式在子元素上 | `.m-chart-grid` / `.m-chart-radial` |

**怎麼確認「本來就沒有」而不是「拆 module 時漏掉」** —— 兩條都要查:

```powershell
# 1. 歷史上有沒有存在過這個選擇器(注意前面的點,只會命中 CSS 不會命中 template)
git log --all --oneline -S ".m-chart-grid"

# 2. 該 class 首次出現時,template 那一行有沒有夾著 tailwind class
git show <首次出現的 commit>:<檔案> | Select-String "m-chart-grid"
```

第 1 條 0 筆 **且** 第 2 條顯示當時就只有這個 class(沒有 tailwind 混在一起)——
那就是**本來就沒有樣式**,不是拆的時候搬走 tailwind 卻忘了寫 CSS。

> ⚠️ 第 1 條的搜尋字串**一定要帶點**(`.m-chart-grid`)。不帶點會連 template 的
> `class="m-chart-grid"` 一起命中,每個 class 都有一堆 commit,查了等於沒查。

這幾種都留著沒有壞處:class 在,將來要上樣式時選擇器已經就位;
而 `setClass` 掛載點與「樣式在父層」兩種**本來就該沒有 CSS**,補了反而會蓋掉使用端。

---

## 動手前先讀 tailwind.config.js

⚠️ **本專案改過 tailwind 的預設,不讀 config 就會照 tailwind 官方的直覺寫錯。**
動 CSS 之前先看 [tailwind.config.js](../../tailwind.config.js),重點如下。

### `theme` 底下哪些是「覆寫」而不是 `extend`

`screens` / `fontFamily` / `fontSize` / `boxShadow` 直接寫在 `theme`,**tailwind 的預設值整組被換掉**;
只有 `content` / `width` / `dropShadow` / `transitionProperty` 在 `extend` 裡是「加上去」。

| 被覆寫的 | 後果 |
|---|---|
| `fontSize` | **沒有 `text-sm` / `text-base` / `text-lg`**,只剩 `vmp` / `vmt` / `vmm` / `vmmls` 四個 vw 級距。字級一律寫 arbitrary value(`text-[16px]` / `text-[length:--x-text-size]`) |
| `screens` | 沒有 `sm` / `md` / `lg` / `xl`,全部換成本專案的斷點(見下) |
| `boxShadow` | 沒有 `shadow-sm` / `shadow-md` / `shadow-none`,只有 [tailwind.extend.js](../../tailwind.extend.js) 的三個:`shadow-black-y2-b4` / `shadow-dropdown` / `shadow-card` |
| `fontFamily` | 沒有 `font-sans` / `font-serif` / `font-mono`,只有 `font-default` |

`letterSpacing` / `lineHeight` 在 config 裡是**註解掉的**,所以內建保留 ——
`tracking-wider` / `leading-*` 都是合法的。

**這一節由 [規則 6](#規則-6不要用本專案不存在的-tailwind-class) 守門** ——
`checkTailwindTheme` 會把這些寫法抓出來,不必靠記憶。

### 斷點

全部是 `raw` media query(不是單純的 min-width),所以**順序不遵守 tailwind 的行動優先直覺**,
要靠 media query 本身判斷誰蓋誰。斷點的寬度來自 [config.js](../../config.js)
(`mobileMaxWidth` / `desktopMinWidth`),不是寫死在 config 裡。

| 斷點 | 涵蓋 |
|---|---|
| `m` | 手機(含橫向的矮螢幕) |
| `t` | 平板 |
| `p` | `min-width: 1024px` |
| `tm` | 平板 + 手機 |
| `pt` | PC + 平板 |
| `pMin` / `pMax` | PC 的窄 / 寬兩段 |
| `mLandscape` | 手機橫向 |
| `notsupport` / `firefox` / `IE` | 瀏覽器偵測用 |

模組的三段 `@screen p` / `@screen t` / `@screen m` 就是對應 `p` / `t` / `m`;
`pt` 與 `tm` 是複合斷點,**會同時落在兩段裡**,寫 modifier 時要一起收(見規則 4)。

### plugin 提供的自訂 utility

`text-hexa` / `bg-hexa` / `border-hexa` / `divide-hexa` 走 `onColorWithAlpha`,
語法是 `bg-hexa-[--black,0.7]`(色票變數 + alpha),不是 tailwind 原生的 `/70`。

⚠️ **本專案已淘汰這四個**(2026-08-28 全面改用 8 碼 hex 色票),plugin 還留著但不要再用,
規則 6 會抓。**Backstage 那邊還在用**,對照時不要把這條抄過去。

`.imeMode-disabled` 是 `addComponents` 加的,仍在使用。

### `theme.extend.transitionProperty` 是複數

`widths` / `heights` / `sizes` / `opacitys` / `margin` / `filter` ——
所以 module 裡的 `transition-opacitys`、`transition-heights` **不是 typo**。
寫單數(`transition-width`)則不存在,規則 6 會抓。

### `content` 的掃描範圍

只掃 `components` / `containers` / `layouts` / `pages` / `static` / `app.vue` / `error.vue`。
`assets/css/` **不在裡面** —— 但那不影響 `@apply`(它在 PostCSS 階段處理,不經過 content 掃描)。
真正的影響是:**只寫在 CSS 檔字串裡、template 沒出現過的 class 不會被產生**。

### `corePlugins.preflight` 沒有關掉

所以 tailwind 內建的 preflight 生效,`*, ::before, ::after` 已經是 `border: 0 solid` ——
**不用寫 `border-solid`**(見規則 3)。

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

### ⚠️ tailwind 的設定檔也算使用端

`tailwind.extend.js` / `tailwind.config.js` 的 `theme` 設定(`boxShadow`、`colors` …)
**最後會變成產物裡的 CSS 宣告**,所以規則 1 對它一樣成立 —— 寫死色碼同樣是違規:

```js
// ✗ 色碼寫死在設定檔裡
boxShadow: { card: '0 0 5px 0 #00000026' }

// ✓ 走色票變數
boxShadow: { card: '0 0 5px 0 var(--black-26)' }
```

`var()` 在這裡是安全的 —— 色票檔由 [nuxt.config.ts](../../nuxt.config.ts) 全域載入、定義在 `:root`,
tailwind 產出的 `--tw-shadow: 0 0 .3125rem 0 var(--black-26)` 執行時解析得到,
`--tw-shadow-colored` 的機制也不受影響(實測過產物)。

**這類設定檔以前完全沒有守門** —— lint 只掃 `.vue` / `.css`,
色碼躲在 `.js` 裡就永遠不會被發現。現在由 `SCAN_CONFIG_FILES` 白名單納入(**只檢查顏色**,
其餘規則講的是 CSS 結構,對 js 不成立)。

> ⚠️ **不要把 `.js` 整個加進掃描範圍** —— 一般 js 裡的 hex(雜湊、id、二進位遮罩)
> 會全部變成誤報。要納入新的設定檔就加進那份白名單。

> 透明色一律用 **8 碼 hex**(`--black-1a: #0000001a`),不要寫 `rgba(0,0,0,0.2)`,
> 也不要寫 `rgba(var(--black-rgb), 0.1)` —— **後者也會被抓**,改用對應的 8 碼 hex 變數。
> `hexToRgb`([postcss.function.js](../../postcss.function.js) / [.tools/postcss/functions.js](../../.tools/postcss/functions.js))
> 機制保留,但**目前已經沒有任何呼叫端,不要新增**。

這三條由 `checkColorMechanism` 檢查,而且**連色票檔本身也會檢查** ——
色票檔在其他顏色規則裡是豁免的(它本來就該有顏色),但這三種寫法在色票檔裡出現同樣是錯的,
那裡正是它們的原生棲地:

| 編號 | 抓什麼 | 改成 |
|---|---|---|
| 1-f2 | `rgba(var(--x-rgb), .5)` 的**使用端** | `var(--black-80)` |
| 1-g | `hexToRgb(` 的**呼叫端** | 8 碼 hex |
| 1-h | `--xxx-rgb:` 的**定義端** | 直接在色票檔定義 8 碼 hex |

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

**帶透明度**時,在上述縮寫後**用 `-` 隔開再接 alpha 兩碼**;
純黑白因為沒有色碼縮寫,只留 alpha 兩碼、不加額外的分隔:

| 色值 | 變數名 | |
|---|---|---|
| `#87b90d66` | `--green-8b0d-66` | 色碼 `8b0d` + alpha `66` |
| `#e5e5e54d` | `--gray-e5-4d` | 純灰取前 2 碼 `e5` + alpha `4d` |
| `#3333334d` | `--gray-33-4d` | 同上 |
| `#0000001a` | `--black-1a` | 純黑沒有色碼縮寫,`1a` 就是 alpha |
| `#ffffff4d` | `--white-4d` | 純白同理 |

**為什麼要那個連字號**:黏在一起會分不出哪幾碼是色碼、哪幾碼是透明度 ——
`--gray-334d` 到底是「`#33334d` 這個顏色」還是「`#333333` 加 30% 透明」?
加了 `-` 就沒有歧義。純黑白本來就不帶色碼縮寫,不會混淆,所以維持原樣。

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

### ⚠️ 反過來也成立:版型檔不准出現「直接給值」

`common.css` / `<變體>.css` 裡的變數宣告**只能是斷點對應或狀態切換**
(`--x-size: var(--x-pc-size)`),**不可以直接寫死一個值**:

```css
/* ✗ common.css —— 這些 base 值屬於 variables.css 的 :root */
.m-tag {
  --tag-px: 0;
  --tag-h: '';
  --tag-border-color: transparent;
}

/* ✓ variables.css */
:root {
  --tag-px: 0;
  --tag-h: auto;
  --tag-border-color: transparent;
}
```

**為什麼**:值散在兩個檔案時,要調一個預設值得先猜它在哪裡。
規則很好記 —— **`variables.css` 與 `*Variables.css` 以外的檔案,
變數宣告右邊一定是 `var(…)`**,看到常值就是放錯地方了。

這條由 `checkLayoutFileValues` 檢查(`checkVariablesFile` 的反向)。

> ⚠️ 順帶一提,`--tag-h: ''` 這種**空字串是無效的 CSS 值**,
> 整條宣告會被丟棄。行為上剛好等同「沒設定」所以看不出問題,
> 但意圖完全讀不出來 —— 高度要寫 `auto`、圓角寫 `0`、陰影寫 `none`。

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

### 組件在子資料夾底下時,class 也要跟著收斂

`components/buy/mItem/SwitchItem.vue` 這種「**放在某個 module 的子資料夾**」的組件,
它是那個 module 的變體,module 資料夾與 class 都要跟著母體走:

| | ✗ | ✓ |
|---|---|---|
| module 資料夾 | `_modules/buy/mSwitchItem/` | `_modules/buy/mItem/` |
| 變體檔名 | `common.css` | `switchItem.css` / `switchItemVariables.css` |
| class | `m-switch-item-header` | `m-item-switch-header` |

**三者要一致**:看到 `m-item-switch-*` 就知道去 `_modules/buy/mItem/switchItem.css` 找。
如果只搬資料夾而 class 維持 `m-switch-item`,「看到 class 就能找到檔案」這條就失效了。

判斷方式:組件檔案放在 `components/<頻道>/<母體>/` 底下 → 它就是 `<母體>` 的變體。

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

這一節是拆 module 時最常回頭查的東西,依主題分成六區:

| 區 | 大概在講什麼 |
|---|---|
| [斷點與 DOM 結構](#斷點與-dom-結構) | `@screen` 放哪、Teleport 浮層的變數會斷掉 |
| [template 與 class](#template-與-class) | 容器別漏 `flex`、語意標籤要不要給 class、子組件用什麼接 |
| [變數的 base 與粒度](#變數的-base-與粒度) | 沒 base 整條讀不到、無效 `var()` 仍會參與 cascade、變數建在最小單位 |
| [這些屬性不能用 tailwind 寫](#這些屬性不能用-tailwind-寫) | `border-width` / `box-shadow` / `font-size` / `transition` |
| [誰決定這個屬性](#誰決定這個屬性) | 字級、顏色、hover 各自歸誰管 |
| [值要不要開變數](#值要不要開變數) | 帶 px 一律開;`z-index` / `leading` / `tracking` / `100%` / `font-weight` 不開 |

#### 斷點與 DOM 結構

- **`@screen` 的斷點對應放 `common.css` / `<變體>.css`,不要放 variables.css** ——
  「p 吃 pc 那組」是固定的對應關係,屬於版型;variables.css 只放值與 modifier。
- **斷點對應掛在每一棵獨立 DOM 樹的第一層**。組件本體掛一次,子元素靠繼承;
  但 `<Teleport>` 出去的區塊(dropdown、popup)DOM 上不在組件內,
  **繼承會斷掉,必須自己再掛一份**。

  ⚠️ 這不只是「少了圓角」那種小事 —— `w-[--x-size]` 讀不到變數會**整條失效**,
  寬度變成 `auto`,裡面的 svg 就套用瀏覽器預設的 **300×150**,把整個浮層撐寬近 300px。
  參考專案的 mSearch dropdown 就是這樣被撐爆的(`--search-clear-icon-size`
  當初只掛在 `.m-search`,浮層在 body 底下繼承不到)。
  **拆完務必實際點開浮層確認**,光看程式碼看不出來。

#### template 與 class

- **容器別漏掉 `flex`**。子元素靠 `grow` 撐滿寬度時,少了 flex 容器會縮成內容寬度 ——
  改寫 template 時要逐一比對原本有哪些 class,不要只挑看得懂的搬。
- ⚠️ **語意標籤要不要給 class —— 一律先問使用者,不要自己決定。**

  `<strong>` / `<em>` / `<small>` 這種「一個父容器內只有一個」的標籤,
  技術上用後代選擇器就選得到,不必硬湊一個 `m-title-strong`:

  ```css
  .m-title-text {
    > strong {
      @apply font-medium;
    }
  }
  ```

  **但這個選擇有後果,而且是不對稱的** —— `.m-title-text > strong` 是 **(0,1,1)**,
  使用端 `setClass` 傳的 `text-[20px]` 只有 **(0,1,0)**,**module 永遠贏**。
  也就是說,只要 module 在後代選擇器上設了某個屬性,使用端就再也改不動它。

  | 情況 | 做法 |
  |---|---|
  | module 全權決定(全站一致) | 後代選擇器 + 變數,沒問題 |
  | **使用端要能決定** | 補 `setClass` key,template 寫 `<strong :class="setClass.strong">`,module **不設**那個屬性 —— 仍然不需要固定 class |
  | module 給預設值 + 使用端可覆蓋 | **後代選擇器做不到**,(0,1,1) 永遠贏。改用 modifier 由 module 提供選項 |

  問題在於「使用端將來會不會想改這個屬性」**不是看程式碼就能判斷的**,猜錯的代價是
  之後要回頭改 module 加 template。所以**拆到語意標籤時就停下來問**:
  這個 `<strong>` 的字級 / 顏色要不要讓使用端傳?要 → 給 `setClass` key;不要 → 後代選擇器。

  不必問的只有三種明確情況:JS 要抓、同一層有多個同名標籤要分別上樣式、
  或那是 `<div>` / `<span>` 這種無語意容器(這些一律給 class)。
- **注意子組件是用 `class` 還是 `setClass` 接**。使用端若是 components,
  直接寫 `<MTag class="text-[14px]">` 會踩規則 2;這種情況要**給子組件補 `setClass`**,
  而不是讓父組件硬塞 tailwind。
- **不用寫 `border-solid`** —— tailwind 內建 preflight(本專案**沒有**關掉 `corePlugins.preflight`)
  已對 `*, ::before, ::after` 輸出 `border: 0 solid`,產物裡看得到:

  ```css
  *,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}
  ```

  寫了是多餘的。(參考專案是關掉內建 preflight、靠自家 `preflight.css` 設同一件事,
  結論一樣但來源不同 —— 之後若本專案也改成自訂 preflight,要回頭確認那邊有沒有設。)

#### 變數的 base 與粒度

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

#### 這些屬性不能用 tailwind 寫

- **`border-width` 直接寫 CSS 屬性**(`border-width: var(--x-border)`),不要 `@apply border-[…]` ——
  production 會壓成 `border` shorthand,值是 `var()` 時整條失效。`border-color` 沒這問題。
- **字級一律用 `text-[length:--x-text-size]`,不要寫原生 `font-size: var(…)`**。

  兩件事要一起記:

  1. **不寫原生** —— 版型統一走 `@apply`,混用原生宣告會讓「這個屬性在哪裡設的」變難找。
     ✗ `font-size: var(--sort-anchor-text-size);`
     ✓ `@apply text-[length:--sort-anchor-text-size];`
  2. **`length:` 不能省** —— `text-[--var]` 會被 tailwind 當成 **color**,
     產生 `color: var(…)` 而不是 `font-size`,**完全不會報錯**,畫面上就是字級沒生效。
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

  前三條由 `checkTailwindPitfalls` 檢查(`.vue` 與 `.css` 都掃,寫在哪裡都是錯的)。
  它靠規則 4 的命名慣例分辨合法用法:**字級一律 `-text-size`、顏色一律 `-color`**,
  所以 `text-[--x-color]` 與 `border-[--x-border-color]` 會放行;
  直接指色票的 `border-t-[--gray-e5]` 也放行(那本來就是 `border-color`)。

  另外 `transition-property: transform` **不要換成 tailwind 的 `transition-transform`** ——
  後者會連帶塞進 `transition-duration: 150ms` 與 `transition-timing-function: cubic-bezier(.4,0,.2,1)`。
  duration 若由 JS inline 控制還蓋得掉,timing-function 蓋不掉,**動畫手感會變**;
  原本沒有 duration 的元素則會憑空多出 150ms 動畫。要換之前先確認 duration 由誰決定。
  `transform: translate3d(0,0,0)` 這種 GPU 提示同理,維持原生寫法就好
  (`transform-gpu` 展開成一整串 `--tw-translate-*` 鏈,反而更繞)。

#### 誰決定這個屬性

- ⚠️ **字級定在哪,看組件是不是「固定位置」**:

  | 組件性質 | 字級放哪 | 例子 |
  |---|---|---|
  | **固定位置、全站長一樣**的組件 | module 自己定,走 `:root` 變數(`--x-text-size`,分三斷點) | 麵包屑、分頁器、mNav、mFooter |
  | **到處複用、每個位置都不同**的組件 | **由父系 `setClass` 傳 tailwind class**,module 不定 `text-*` | 按鈕(mAnchor)、mForm 全系列、mTag |

  第二類的組件**沒有對應的 `setClass` key 就補一個**,並且**把原本的值補回每一個使用端**,
  否則字級會變成繼承。例如 mForm 的 Select / AutoComplete 補了 `setClass.dropdownLabel`,
  五個 Select 與兩個 AutoComplete 的使用端各自補上 `dropdownLabel: 'text-[14px]'`。

  ⚠️ **非固定位置的組件(到處複用的那一類)連 `--x-text-size` 變數都不要建。**

  這是最容易做半套的地方 —— 知道「字級交給父系」,卻還是順手建了變數。
  只要建了,module 就會在某處 `@apply` 它,而**一輸出就蓋掉使用端傳的 `text-*`**,
  等於「交給父系」白做。**沒有變數,才真的沒有輸出。**

  字級變數只能出現在**固定位置**的組件裡。目前全案有 `-text-size` 變數的只有六支,
  全都屬於這類:mTitle / mFooter / mNav / mLoading / mPopup,以及 mChart 的 tooltip
  (它是組件自己疊出來的圖層,`setClass` 沒有對應的 key,使用端根本沒有管道可傳)。
  複用型的 mTag / mAnchor **一個字級變數都沒有**,那是對的。

  **例外:`.m-form-error`(2026-08-31 決定)。** mForm 整體是複用型,但錯誤訊息的字級
  **全站長一樣、不隨使用位置變化**,所以由 module 統一決定,建了
  `--form-error-pc-text-size` / `-tablet-` / `-mobile-`(原本是寫死的 `text-[14px]`)。
  判斷依據是「這個**元素**是不是固定樣貌」,不是「這支組件是不是複用型」——
  同一支 module 裡可以一部分交給使用端、一部分自己定。
  `setClass.error` 仍然存在(要傳其他樣式),但**不該用來調字級**。

  另一個例外是使用端根本沒有管道可傳(後台編輯器存進 HTML 的 class),那就留在 module。
  **分不出來就問使用者。**
- **狀態(hover / focus / active)一律用「覆寫基礎變數」**,不要在 `:root` 用
  `--x-hover-color: var(--x-color)` 做 fallback —— custom property 的 `var()` 在**定義它的元素**上
  就解析完再繼承,`:root` 當下 `--x-color` 還是 `initial`,後面再怎麼覆寫都救不回來,
  結果是「hover 時顏色整個掉光」。組件若有 `.group` 版本的 hover,要補一組 `.group:hover .m-xxx`。

  **hover 的寫法固定成這個形狀**(參考實作:[common/mAnchor/variables.css](../../assets/css/_modules/common/mAnchor/variables.css)):

  ```css
  /* variables.css —— hover 是獨立的 modifier,包在 &:hover 裡 */
  .m-tooltip {
    /* color */
    &.\-\-text-white {
      --tooltip-color: var(--white);
    }

    /* bg color */
    &.\-\-bg-gray-33bf {
      --tooltip-bg-color: var(--gray-33bf);
    }

    &:hover {
      /* bg color */
      &.hover\:\-\-bg-gray-333 {
        --tooltip-bg-color: var(--gray-333);
      }
    }
  }

  /* common.css —— 無條件取一次就好,不要再寫 &:hover */
  .m-tooltip {
    @apply bg-[--tooltip-bg-color] text-[--tooltip-color];
  }
  ```

  三個要點:

  1. **modifier 帶 `hover:` 前綴**(`hover:--bg-gray-333`),由使用端顯式指定要不要有 hover。
  2. **不要建 `--x-hover-bg-color` 這種「hover 專用變數」** —— hover modifier 直接覆寫
     `--x-bg-color` 本身。多一層變數只是把「誰決定顏色」變得更難追。
  3. **版型檔不要寫 `&:hover`** —— 那會變成「module 自己決定 hover 行為」,
     使用端沒帶 modifier 時也會觸發。狀態切換由 variables 的 modifier 表達就夠了。
- ⚠️ **顏色是組件的職責,使用端不得自訂**。modifier 只設 `--x-color`,
  `common.css` **無條件**套用 `text-[--x-color]`;沒有顏色時用 **`--x-color: inherit`**。

  ⚠️ **base 一定寫出真正想要的值,不要用 `initial`**,而且分兩種:

  | 變數 | base | 意思 |
  |---|---|---|
  | 文字色 `--x-color` | `inherit` | 沒指定就跟父層走(等同拆 module 前的行為) |
  | 背景 / 邊框色 `--x-bg-color` / `--x-border-color` | `transparent` | 沒指定就是**沒有顏色** —— 背景不該去繼承父層 |

  **為什麼不用 `initial`**:它其實**能運作**,但靠的是繞路 ——
  custom property 的值寫成 CSS-wide keyword 時,它的計算值是 guaranteed-invalid,
  於是 `color: var(--x-color)` 成為 **IACVT**(invalid at computed-value time):
  繼承屬性(`color`)表現為 `inherit`、非繼承屬性(`background-color`)表現為
  `initial`(即 transparent)。結果剛好符合直覺,所以 mAnchor 用了很久也沒出事。

  真正的問題是**意圖讀不出來**:下一個人會以為 initial 就是 `color` 的初始值(黑色)而不敢動,
  或反過來以為 `-bg-color: initial` 會繼承父層背景。寫 `inherit` / `transparent` 就沒有這層猜測。

  2026-08-31 清完存量(mTag ×2、mTooltip ×2、mAnchor),由 `checkColorBase` 檢查
  (依變數名判斷該建議 `inherit` 還是 `transparent`)。

  使用端在 `setClass.main`(或 `class`)寫 `text-[--gray-999]` 這種 tailwind 顏色**本身就是錯的** ——
  它會被 module 的宣告蓋掉,而且**本來就該被蓋掉**。正確做法是:

  1. **module 補上對應的顏色 modifier**(例如 mAnchor 補 `--text-gray-999`)
  2. 使用端改成 `main: '--text-gray-999 …'`

  **不要**為了讓使用端能自訂顏色,把 module 的宣告用 `:is(…列出所有 modifier…)` 條件化 ——
  那等於把顏色的決定權交回使用端,「組件定義顏色」就失去意義了,
  顏色也會散落在各個頁面而不是集中在 module。

  (這條與尺寸 / 圓角不同:那些**可以**由使用端傳,所以 module 要留意不要無條件蓋掉;
  顏色則相反,一律由 module 決定。)

#### 值要不要開變數

- ⚠️ **帶 px 的值一律開變數,不要因為「它只有 1px」就寫死。**

  判斷標準是**單位**,不是「感覺重不重要」:

  | 直接寫 | 開變數(拆三斷點) |
  |---|---|
  | `w-1/2`、`w-full`(比例) | `w-[--x-w]`、`h-[--x-h]` |
  | `z-[1]`、`z-[3]`(層級) | `px-[--x-px]`、`my-[--x-my]` |
  | `duration-300`、`rounded-full` | `rounded-[--x-rounded]` |
  | `left-1/2`、`-translate-x-1/2` | `gap-x-[--x-gap-x]` |
  | `border-0`、`h-0`(歸零) | `text-[length:--x-text-size]` |

  **`1px` 的線寬、`2px` 的內距也算**——它們一樣是 px。實際踩過:
  mSwitchItem 的展開符號兩條線寫死 `h-[1px]` / `w-[1px]`、
  mSort 的捲軸留白寫死 `pr-[2px]`,當時都以為「這是造型不會變」而略過。
  真要調的時候(例如高解析度螢幕想加粗)就得回頭改版型檔,而不是只動一個值。

  **明確不開變數的這幾個**(每一條都有對應的檢查函式,不必靠記憶):

  - **`letter-spacing`(`tracking`)** —— 字距是組件的字體造型設定,全站一個值走到底,
    沒有「各頁面各自指定」或「各斷點不同」的需求。直接寫 `@apply tracking-[0.06em]`
    或 tailwind 內建的 `tracking-wider`。
    由 `checkTrackingVariable` 檢查(抓 `--x-tracking:` / `tracking-[--x]` / `letter-spacing: var(…)`)。
  - **`line-height`(`leading`)** —— 理由同上:行高跟著字級走,而且值多半是**無單位比例**
    (`1.5` / `1`),本來就不隨斷點改變,拆三份只會得到三個一樣的數字。
    直接寫 `@apply leading-[1.5]`。
    由 `checkLeadingVariable` 檢查(2026-08-31 加,抓 `--x-leading:` / `--x-line-height:` /
    `leading-[--x]` / `line-height: var(…)`)。
  - **`z-index`** —— 層級是版型結構的一部分,`z-[1]` / `z-[3]` 直接寫,
    抽成變數只會讓「誰疊在誰上面」更難看懂:要回頭查三個斷點的值才知道順序。
    而且**層級不會因為斷點而改變**,拆三份只會得到三個一樣的數字。
    這條由 `checkZIndexVariable` 檢查(2026-08-31 加),抓三種寫法:
    變數定義(`--x-z:` / `--x-z-index:`)、tailwind 取用(`z-[--x]`)、原生(`z-index: var(…)`)。
  - **`100%`** —— 三個斷點沒差別時直接用 tailwind 的 `-full`,
    不要寫成 `w-[100%]`,更不要繞一層變數:

    | ✗ | ✓ |
    |---|---|
    | `--x-w: 100%` 再 `w-[--x-w]` | `w-full` |
    | `w-[100%]` / `h-[100%]` | `w-full` / `h-full` |
    | `max-w-[100%]` / `min-w-[100%]` | `max-w-full` / `min-w-full` |
    | `min-h-[100%]` | `min-h-full` |

    `100%` 語意是「撐滿容器」不是某個尺寸,拆三斷點只會得到三個一樣的值。
    **只有真的分斷點不同**(例如 pc 用 `50%`、mobile 用 `100%`)才開變數。
  - **`font-weight`** —— **不是父系帶入,就是寫死**,沒有中間地帶。
    module 自己的狀態(`--active` 時變粗)直接 `@apply font-medium` / `font-normal`;
    要讓使用端決定就走 `setClass`。開成 `--x-font-weight` 變數只是多一層轉手,
    而字重的值域小又固定(400 / 500 / 700),不會有「各頁面各自指定」的需求。

  `0` / `auto` / `none` 這種「歸零或不設定」也直接寫,那不是尺寸。

  **時間值(`duration-*` / `delay-*`)不開變數**(2026-08-31 決定)——
  `delay-[0ms,150ms]` 這種直接寫就好,理由同 `duration-*`:它是動畫手感的一部分,
  不是尺寸,也沒有「各頁面各自指定」或「各斷點不同」的需求。

  ⚠️ **`calc()` 裡的抵銷值仍然要開變數。** 那是尺寸,不因為包在算式裡就豁免 ——
  實際踩過:mTab/ovalResponsiv 的 `mt-[calc(calc(var(--x-border-h)_-_1px)_*_-1)]`,
  那個 `1px` 是「底線露出的厚度」,已改成 `--tab-oval-responsiv-body-*-border-visible`。
  順帶一個容易漏的點:**那條宣告在 `@screen pt` 內,所以不能吃 `-pc-`**(規則 4 的 6-a),
  要吃中性變數再由 `@screen p` / `t` 兩段各自對應。

  > 目前 `_modules/` 內還有一批既有存量沒有變數化:
  > `rounded-full` 9 處、`w-full` / `h-full` 36 處、`-1/2` 25 處、`opacity-*` 15 處。
  > 這些是不是也該開變數,**碰到時問使用者**,不要自行決定。

#### 其他慣例

- **`transition` 也走 tailwind**:`@apply [transition:transform_0.3s_ease,opacity_0.2s_ease]`(空格用 `_`)。
- modifier 的斷點寫法:`p` 段收 `--x`、`p:--x`、`pt:--x`;`t` 段收 `--x`、`pt:--x`、`tm:--x`、`t:--x`;
  `m` 段收 `--x`、`tm:--x`、`m:--x`。
- 看起來像 typo 的既有 class 名**先確認參考專案**(位置見「[本專案現況](#本專案現況)」),
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
(參考專案也踩過同一個坑,處理方式一致。)

### 命名慣例

| 不要寫 | 要寫 |
|---|---|
| `-width` | `-w` |
| `-height` | `-h` |
| `-padding` | `-p` |
| `-margin` | `-m` |
| `-border-width` | `-border` |

字級一律 `-text-size`(不是 `-text`)。

### 寬高相同用 `-size`,不同才拆 `-w` / `-h`

icon、圓點、方形按鈕這類**寬高一致**的元素,只建一個 `-size` 變數:

```css
/* ✓ 20 × 20 的 icon */
--pagination-arrow-icon-pc-size: 20px;
.m-pagination-arrow-icon { @apply h-[--pagination-arrow-icon-size] w-[--pagination-arrow-icon-size]; }

/* ✓ 寬高不同才拆兩個 */
--tag-checkbox-pc-assist-w: 12px;
--tag-checkbox-pc-assist-h: 15px;
```

**一個 `-w` 變數被套到 `h-[]` 上(或反過來)就是命名錯誤** ——
工具的名實不符檢查會抓(`checkVariableUsage`),但更根本的問題是:
之後有人要單獨調高度時,會發現改 `-w` 會把寬度也一起改掉。

同一個值被兩個軸共用時,判斷「它們是不是永遠相等」:
- **永遠相等**(正方形 icon、圓點)→ 一個 `-size`
- **剛好目前相等**(展開符號的橫線長 = 直線高)→ 也用 `-size`,因為那是同一個「臂長」概念
- **各自獨立會變**(容器的寬與高)→ 拆 `-w` / `-h`

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
已經有對應斷點版本的 base 值,以及**非 px 單位**的比例 / 層級 / 時間
(`w-1/2`、`z-[1]`、`duration-300`、`rounded-full`)。

⚠️ **「反正只有 1px,應該算造型吧」不是豁免理由** —— 只要帶 px 就開變數,
即使三個斷點的值一模一樣。判斷看單位,不看直覺(見規則 3 的「帶 px 的值一律開變數」)。

### 斷點要成套,而且版型不能直接吃

這兩條由 `checkBreakpointCoverage` 檢查,補的是上一條的死角 ——
上一條只抓「完全沒分斷點的單值」,**分了三份卻漏掉其中一個**沒人會發現,
而那個斷點會靜靜地讀不到值,**畫面不報錯**。

| | 規則 | 例 |
|---|---|---|
| **6-a** | 版型檔不可直接吃帶斷點的變數 | ✗ `@apply gap-x-[--x-pc-gap-x]`(綁死 pc,t / m 永遠吃不到) |
| **6-b** | `:root` 有 `-pc-X` 就必須有 `-tablet-X` 與 `-mobile-X` | ✗ 只寫了 `--x-pc-gap-x` 與 `--x-tablet-gap-x` |

**6-a 只抓「斷點對不上」的**:已經包在 `@screen p` 裡面的宣告直接吃 `-pc-` 的值
**是合理寫法,不算違規** —— 那本來就只有 pc 會套用到。工具會看它在哪個區塊裡:

```css
/* ✓ 在 p 區塊內吃 pc 的值 —— 直接、正確 */
@screen p { .m-x { @apply max-w-[--x-pc-max-w]; } }

/* ✗ 沒包在任何 @screen p / t / m 裡 —— 平板手機也會吃到 pc 的值 */
.m-x { border-width: var(--x-pc-border); }

/* ✗ 斷點對不上 —— pt 同時涵蓋 p 與 t，平板也會吃到 pc 的值 */
@screen pt { .m-x { @apply p-[--x-pc-p]; } }
```

> 複合斷點(`pt` / `tm`)裡一律不能直接吃單一斷點的變數,理由同上。

**同一支檔案的 `@screen p` / `t` / `m` 各自只寫一組**,不要拆散成好幾處 ——
同一個斷點的設定散在檔案各處,改的時候很容易漏掉其中一組。

這條由 `checkScreenGrouping` 檢查(2026-08-31 加),但**只看頂層的 `@screen`**:

| 寫法 | 算不算違規 |
|---|---|
| 頂層出現兩個 `@screen m` | ⛔ 違規 —— 合併成一組 |
| 巢狀(`.m-x { @screen p { … } }`)在多個選擇器內各寫一次 | ✅ 合法 —— 那是另一種組織方式,每個選擇器自己收三段 |

真的需要分開(變數對應與子元素版型差異大)就在該行或上一行標
`/* lint-screen-group-exempt: 理由 */`,**理由一定要寫**。

> 導入當天兩邊各有一筆存量,都用**合併**解決而不是標豁免:
> mHeader 的第二段 `@screen m` 併回第一段(選擇器不重疊、`@screen pt` 的相對順序不變),
> Backstage 的 mTable/checkboxResponsiv 同理。合併前確認過兩件事:
> **選擇器有沒有重疊**(有就要注意宣告順序)、**與複合斷點(`pt` / `tm`)的先後有沒有被改動**。

```css
/* ✓ 版型吃中性變數，@screen p / t / m 各段負責對應 */
.m-x { @apply gap-x-[--x-gap-x]; }

@screen p { .m-x { --x-gap-x: var(--x-pc-gap-x); } }
@screen t { .m-x { --x-gap-x: var(--x-tablet-gap-x); } }
@screen m { .m-x { --x-gap-x: var(--x-mobile-gap-x); } }
```

### 中性變數要不要開,看「這支檔案有幾個變數要分斷點」

| 情況 | 寫法 |
|---|---|
| **多個**變數要分斷點 | 版型吃**中性變數**,`@screen p` / `t` / `m` 各開一段集中對應(上面的例子) |
| **只有一個** | 不必多繞一層 —— 版型直接寫在 `@screen` 內吃 `-pc-` / `-tablet-` / `-mobile-` |

```css
/* ✓ 整支檔案只有一個變數要分斷點時，直接吃就好 */
@screen p { .m-x { @apply max-w-[--x-pc-max-w]; } }
@screen t { .m-x { @apply max-w-[--x-tablet-max-w]; } }
@screen m { .m-x { @apply max-w-[--x-mobile-max-w]; } }
```

多個變數時之所以要中性變數,是因為版型會散在檔案各處 ——
每一處都包一層 `@screen` 會讓同一個選擇器出現三次以上,改的時候很難確定改全了。
只有一個變數就沒有這個問題,多繞一層反而增加追查成本。

**這條會被觸發,多半是因為照搬了原始 template 的單邊寫法** ——
template 常常只有 `p:min-w-[265px]` 這種只寫桌機的 class,直接搬進 module 就變成
「只有 `@screen p` 有這條規則」。正確做法是**版型只寫一次吃中性變數,三個 `@screen` 各自對應**;
平板手機原本沒有的設定也要明確寫出 `auto` / `none` / `0`。
`@screen pt` / `@screen tm` 同樣要拆成 p / t / m 三段。

真的只有某一端才成立的樣式(例如手機版刻意不給 padding,讓使用端自己控制)是例外,
在該行或上一行寫 `/* lint-breakpoint-exempt: 理由 */` 就會跳過 —— **理由一定要寫**。
分不出來是例外還是漏寫就**直接問使用者**。

> 移植自參考專案,判斷邏輯與那邊一致。

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

## 規則 6:不要用「本專案不存在」的 tailwind class

> ⚠️ 這裡的「規則 6」與規則 4 章節內的 `6-a` / `6-b` 編號無關,那是另一組代號。

[tailwind.config.js](../../tailwind.config.js) 有四組寫在 **`theme`** 而不是 `theme.extend`,
也就是**整組覆寫** —— tailwind 內建的那些 key 因此**完全消失**:

| theme 的組 | 本專案剩下什麼 | 因此不存在的 |
|---|---|---|
| `screens` | `m` / `t` / `p` / `tm` / `pt` / `pMin` / `pMax` / `mLandscape` / `notsupport` / `firefox` / `IE` | **`sm:` `md:` `lg:` `xl:` `2xl:`** |
| `fontSize` | `vmp` / `vmt` / `vmm` / `vmmls`(四個 vw 值) | **`text-xs` ~ `text-9xl`、`text-base`** |
| `boxShadow` | [tailwind.extend.js](../../tailwind.extend.js) 的三個 preset | **`shadow` `shadow-sm` `shadow-md` … `shadow-none`** |
| `fontFamily` | `default` | **`font-sans` `font-serif` `font-mono`** |

**寫了不會報錯,class 就靜靜地不生效** —— 和拼錯字一個症狀,但更難發現,
因為 `text-sm` 看起來完全正常。實測(`npx tailwindcss` 對一份含這些 class 的檔案跑產物):
`text-sm` / `text-3xl` / `shadow-md` / `shadow-none` / `font-sans` / `md:flex` / `2xl:hidden`
**一條 CSS 都沒有產出**。

另外兩類也一併抓:

| 寫法 | 為什麼錯 |
|---|---|
| `text-hexa` / `bg-hexa` / `border-hexa` / `divide-hexa` | 2026-08-28 起全面改用 8 碼 hex 色票。plugin 還留著(還沒移除)但**不要再用** |
| `transition-width` / `-height` / `-size`(單數) | `theme.extend.transitionProperty` 定義的是**複數**:`widths` / `heights` / `sizes` |

`letterSpacing` / `lineHeight` 在 config 裡是**註解掉的**,所以內建保留 ——
`tracking-wider` / `leading-*` 都是合法的(規範也要求字距用 `tracking-wider`)。
`dropShadow` / `width` / `content` / `transitionProperty` 在 `extend` 底下,內建也都還在。

這條由 [lint-core.mjs](../../.tools/css/lint-core.mjs) 的 `checkTailwindTheme` 檢查,
`.vue` 與 `.css` 都掃(寫在哪裡都是錯的)。

> ⚠️ **改了 `theme` 就要回頭同步 `UNAVAILABLE_CLASSES`** ——
> 把某一組從 `theme` 移進 `theme.extend`(內建復活)時,對應那段要刪掉,否則會變成誤報。

---

## 檢查工具

### ⚠️ 掃描範圍以外的檔案 —— 寫死色碼一層都抓不到

[lint-core.mjs](../../.tools/css/lint-core.mjs) 的 `SCAN_TARGETS` 只涵蓋
`components` / `containers` / `pages` / `layouts` / `assets/css` / `app.vue` / `error.vue`,
`SCAN_EXT` 只有 `.vue` 與 `.css`。**根目錄的設定檔兩個條件都不符**,
而五層守門共用同一份判斷邏輯 —— 所以那些檔案是**五層都讀不到**,不是讀了以後判定沒問題。

親自確認:

```powershell
node .tools/css/lint-css.mjs tailwind.extend.js
# ✔ CSS 規範檢查通過(掃描 0 個檔案)   ← 括號裡是 0,檔案根本沒被打開
```

**這代表「存量 0 筆」只涵蓋掃得到的範圍。** 本專案目前就有三個藏在盲區的色碼,
都在 [tailwind.extend.js](../../tailwind.extend.js) 的 `boxShadow`:

| preset | 色碼 | 使用端 |
|---|---|---|
| `black-y2-b4` | `#00000033` | `containers/common/Header.vue`、`_modules/common/mTab/ovalResponsiv.css` |
| `dropdown` | `#0000001a` ×2 | `_modules/buy/mSort/common.css` |
| `card` | `#00000026` | `pages/buy/_components/common/Card.vue` |

`tailwind.config.js` / `tailwind.function.js` / `postcss.function.js` / `config.js` 同理 ——
`theme` 底下任何吃顏色的 key(`colors` / `borderColor` / `boxShadow` / `dropShadow`)都在盲區。

**修法不是擴大掃描範圍**(把 `.js` 拉進來會開始誤報一堆字串),而是切斷需求:
**陰影不要放進 tailwind preset** —— 值裡必定帶顏色,而 preset 又掃不到。
改走原生 `box-shadow` + module 自己的 `--x-pc-shadow` / `-tablet-` / `-mobile-` 變數,
色值取色票變數;那些檔案在 `assets/css/` 底下就掃得到了。
本專案已經有四支是這樣寫的:[common/mForm/autocomplete.css](../../assets/css/_modules/common/mForm/autocomplete.css)、
[common/mForm/select.css](../../assets/css/_modules/common/mForm/select.css)、
[buy/mSwiper/common.css](../../assets/css/_modules/buy/mSwiper/common.css)、
[buy/mTooltip/common.css](../../assets/css/_modules/buy/mTooltip/common.css) ——
上面那三個 preset 照這個模式收掉即可。

```powershell
npm run lint:css                              # 全專案掃描(四條規則)
node .tools/css/lint-css.mjs <檔案或目錄>      # 只檢查指定範圍
node .tools/css/lint-css.mjs --json           # JSON 輸出,供程式解析

node .tools/css/sort-color-css.mjs            # 色票檔:檢查排序 / 命名 / 頻道歸屬
npm run sort:color                            # 色票檔:自動排序
```

### 拆完 module 的驗證

```powershell
node .tools/css/lint-css.mjs components/<頻道>/<組件>.vue        # 應該完全通過
node .tools/css/lint-css.mjs assets/css/_modules/<頻道>/<組件>/  # 應該完全通過
npm run build                                                    # 必跑
```

**lint 通過不等於樣式真的進了產物** —— 沒被任何組件 import 的 css 是死檔,
lint 只看檔案內容,不會知道它沒人載入。build 完要實際確認:

```powershell
$all = (Get-ChildItem '.output' -Recurse -Filter '*.css' | ForEach-Object { Get-Content $_.FullName -Raw }) -join "`n"
$all -match 'm-tab-select-element'
```

> ⚠️ `.output` 的 css 在 `_nuxt/assets/css/` 子目錄,**`Get-ChildItem` 一定要加 `-Recurse`**,
> 少了它會找不到任何檔案而誤判成「樣式沒進去」。
> ⚠️ px 會被 px-to-rem 轉成 rem(`8px` → `.5rem`),**搜產物時不要用 px 找**。

| 檔案 | 職責 |
|---|---|
| [.tools/css/color-order.mjs](../../.tools/css/color-order.mjs) | 色票檔的解析、命名驗證、亮度排序、頻道歸屬比對 |
| [.tools/css/lint-core.mjs](../../.tools/css/lint-core.mjs) | 五條規則的判斷邏輯(只判斷,不輸出也不改檔) |
| [.tools/css/lint-css.mjs](../../.tools/css/lint-css.mjs) | 檢查用 CLI |
| [.tools/css/sort-color-css.mjs](../../.tools/css/sort-color-css.mjs) | 排序用 CLI |
| [.tools/css/guard-file.mjs](../../.tools/css/guard-file.mjs) | 存檔用的單檔入口(排序 + 檢查),給 Run on Save 呼叫 |
| [.tools/css/colors.mjs](../../.tools/css/colors.mjs) | CLI 顏色開關(非 TTY 自動關色) |
| [.tools/install-git-hooks.mjs](../../.tools/install-git-hooks.mjs) | 設定 `core.hooksPath`(postinstall 自動跑) |
| [.tools/check-vscode-extensions.mjs](../../.tools/check-vscode-extensions.mjs) | 檢查 RunOnSave 擴充有沒有裝(postinstall 自動跑,只警告不阻擋) |

拆 module 前也要看規則 3 的「動工前一定要查的三件事」:
這支 css 有沒有被載入(`_modules/` 不在 `nuxt.config.ts` 的 `css` 陣列裡,全靠組件自己 import,
沒人 import 就是**死檔**,先問使用者要重寫還是刪)、定義出來的 modifier 有沒有人在用、
template 綁了但沒有對應 CSS 的 class 是刻意不做還是漏掉。

---

## 本專案現況

> ⚠️ **這一章以上的內容不綁任何專案,移植時整份複製即可 —— 要換掉的只有這一章。**
> 另外檢查一件事:規則本體寫的是 `assets/css/…` / `components/…` / `pages/…`,
> 原始碼放在 `src/` 底下的專案要整批加上前綴。

### 這份規範用在哪

`Official` —— 原始碼在 repo 根,所以路徑不帶前綴。
色票依頻道切分(`color.css` 共用,`colorBuy.css` / `colorMember.css` 各自專屬),
module 也多一層頻道目錄(`_modules/<頻道>/<組件>/`)。

**參考專案**([D:\Projects\Delta\EFOfficial](file:///D:/Projects/Delta/EFOfficial))——
規則本體提到「先確認參考專案」時指的就是它。

### 違規存量

**2026-08-28 起為 0 筆** —— `npm run lint:css` 掃描 289 個檔案全數通過。

> ⚠️ 這個 0 只涵蓋**掃得到的範圍**。`tailwind.extend.js` 的三個 `boxShadow` preset
> 仍藏著寫死色碼,那支檔案在掃描範圍外(見「檢查工具」章),lint 永遠不會報它們。

導入當天(2026-08-27)是 414 筆 / 258 個檔案,分兩批清完:

| 批次 | 內容 |
|---|---|
| 08-27 | common 組件全數拆進 `_modules/common/`;色票檔的排序、命名、頻道歸屬、`-rgb` 衍生變數 |
| 08-28 | buy 組件全數拆進 `_modules/buy/`;刪掉 5 支沒有使用端的組件(見 [deleted-components.md](./deleted-components.md));`bg-hexa` 全面改 8 碼 hex 色票;alpha 命名加連字號;module 變數的斷點、命名、base 值 |

**所以現在跳出來的警告都是「這次改出來的」,不是存量。**
既有程式碼已經沒有可以推給前人的違規了 —— 看到紅字就是剛動的那幾行有問題。

> 少數確實無法符合規範的地方,一律用 `/* lint-breakpoint-exempt: 理由 */` 就地標註,
> 不集中列在這裡 —— 清單會過期,註解不會。目前有標的是
> mNav(漢堡按鈕與側邊選單只有手機版)、mPopup(工具列手機用 `mt`、桌機用 `mx`)、
> mTab/ovalResponsiv(mobile 是膠囊形按鈕組,另一套設計)。

### 參考實作

`components/` 底下全部拆完了,遇到類似情境時照著這幾支看:

| 情境 | 看哪一支 |
|---|---|
| **最標準的一支**(共用 + 變體兩層) | [common/mTab/](../../assets/css/_modules/common/mTab/) — `variables` / `common` + `borderBottom*` |
| **群組層**(兩個以上變體共用) | [common/mForm/](../../assets/css/_modules/common/mForm/) 的 `selection.*` — checkbox + radio 共用 |
| **hover 的固定寫法** | [common/mAnchor/variables.css](../../assets/css/_modules/common/mAnchor/variables.css) — `hover:--bg-*` modifier 包在 `&:hover` 裡 |
| **顏色 modifier 只設變數** | [buy/mTag/variables.css](../../assets/css/_modules/buy/mTag/variables.css) — 17 個顏色 modifier,`common.css` 無條件取用 |
| **變數建在最小單位** | [common/mContent/](../../assets/css/_modules/common/mContent/) — `--p-*` 與 `--px-*` 併存,所以拆成 `-pt` / `-pr` / `-pb` / `-pl` 四向 |
| **資料夾名跟著 class 走** | [common/mFigure/](../../assets/css/_modules/common/mFigure/) — 組件檔叫 `ImgSrc.vue`,class 是 `m-figure` |
| **modifier 的斷點三段** | [common/mContainer/](../../assets/css/_modules/common/mContainer/) — `@screen t` / `m` 段不能刪,使用端的 `tm:--px-10` 要靠那兩段收 |

### 導入時已修掉的(2026-08-27)

- 補上 5 個缺失的色票變數 —— `--gray-c8`、`--blue-08dc`、`--blue-08dc-1a`、`--blue-6dd7`
  進 `colorBuy.css`,`--gray-33-4d`、`--black-1a` 進 `color.css`。
  這些變數原本被 `_modules/buy/mSwiper/variables.css` 與 `components/common/mForm/Select.vue`
  取用但從未定義 —— **那些顏色一直是沒生效的**(CSS 不會報錯,只能靠 lint 抓)。
- `Select.vue` 的 `--gray-3334d` 更名為符合規則的 `--gray-33-4d`(2026-08-28 alpha 加了連字號)。
- 刪掉死變數 `--white-rgb` / `--black-rgb`,`mSwiper` 三行 shadow 改用 `--black-1a`。

> ⚠️ `--blue-08dc`(#0087dc)、`--blue-6dd7`(#64d7d7)是照參考專案的色值補的,
> 補上後 buy 頻道 swiper 的分頁點與左右鈕**會從「沒顏色」變成顯示這兩個藍** ——
> 若設計上 buy 頻道該用自家主色(`--blue-26e1`),要回頭跟設計確認後改值。

> ~~`GoogleMap.vue` 的寫死色碼是已知例外~~ —— **這條當初就判斷錯了,2026-08-28 已修掉。**
> 那兩處 `#2f3338` 在 `<style>` 區塊裡,是覆蓋 Google Maps 注入 DOM(`.gm-*`)的普通 CSS,
> 變數當然讀得到;同一支檔案的 L367 本來就在用 `var(--gray-2338)`。
> 真正吃 JS 物件的 styler 只設了 `visibility: off`,根本沒有顏色。
>
> **教訓**:「第三方套件的樣式」不等於「不能用變數」。
> 判斷依據是**這段是不是 CSS** —— 是 CSS 就走規範,是 JS 設定物件才另當別論。

### 與參考專案的關係

這套規則與工具移植自參考專案(`.claude/rules/css-conventions.md` + `.tools/css/`),
**最近一次對照為 2026-08-28**(對方 commit `32bd943`)。兩邊是各自的複本,不會自動同步:

#### 2026-08-28 那次對照收了什麼

| 項目 | 來源 |
|---|---|
| `checkBreakpointCoverage`(6-a / 6-b 斷點成套) | 對方 `lint-core.mjs` |
| `checkColorMechanism`(1-g hexToRgb 呼叫端、1-h `-rgb` 定義端) | 同上,**連色票檔也檢查** |
| 容器別漏 `flex`、子組件用 `class` 還是 `setClass` 接 | 對方 skill `css-module-split` |
| Teleport 浮層讀不到變數會撐成 300×150 | 同上 |
| 斷點單邊寫法的來源、`@screen pt` / `tm` 要拆三段 | 同上 |
| build 驗證(`.output` 要 `-Recurse`、px 會轉 rem) | 同上 |
| 不用寫 `border-solid` | 同上(**理由不同**,見規則 3) |

**刻意不收**:對方主張「使用端會傳的屬性(顏色、字級、外距),module 只能在自己的
modifier 下輸出」與「顏色 modifier 不適合用變數覆寫模式」——
本專案的決定相反(見規則 3「顏色是組件的職責」),兩邊在這點上分歧,不要照抄。

對方獨有但**不適用**本專案的:`rules/commit-then-deploy-sit.md`、`docs-then-sync-f2e.md`、
`hooks/dev-debug-panel.cjs` 等(對方專屬流程)、`.vite/pinia-auto-hmr.mjs`(非 CSS)。

#### 比較差異

本專案多出來的:

| 面向 | 內容 |
|---|---|
| 色票 | **頻道色票**(`color<Channel>.css` 與跨頻道收攏檢查)、色票註解不被排序吃掉、「取用未定義色票變數」(1-f)、`-rgb` 衍生變數的三項檢查 |
| 結構 | `_modules/<頻道>/<組件>/` 多一層路徑、**群組共用層**(mForm 的 `selection.*`)、變數建在「用到的最小單位」、寬高相同用 `-size` |
| 命名 | modifier 對齊 tailwind utility、狀態一律 `--` 開頭(`checkStateClassNaming`)、variables 檔只放值(`checkVariablesFile`)、名實相符(`checkVariableUsage`) |
| 規則 5 | `<script setup>` 的 import 順序(`checkImportOrder`)—— 對方沒有這條 |
| 守門 | 第四層「使用者送出訊息時」(`cssGuardPrompt.js` + `guard-file.mjs` 的接力機制)、dev server 那層的去抖與 hash 比對、`colors.mjs` 的非 TTY 自動關色 |
| 流程 | 「**違規每一輪都要列出,但不主動彈問句**」以及「判斷不出來就問」的岔路清單 |

> 那邊之後若更新規則或工具,要**人工回頭對照**,不要假設兩邊一致。
> 對照時的三個目錄:`.claude/`(rules + skills + hooks)、`.tools/css/`、`.vite/`。
