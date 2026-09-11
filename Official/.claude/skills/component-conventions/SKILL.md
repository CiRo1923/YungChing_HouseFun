---
name: component-conventions
summary: 元件檔案的形狀
description: 本專案共用元件目錄底下 .vue 的撰寫規範。當新增共用元件、調整元件開頭的 import,或審查既有元件寫法時使用。規則:元件的樣式寫在 CSS 模組裡、由元件自己 import,少了那一行會報違規(工具不自動補,因為它看不出該載哪一支);import 依分組排列(樣式 → 共用邏輯 → 共用函式 → 其他),這一半不報違規,存檔時直接排好。分組定義在 .tools/lint/project-config.mjs 的 IMPORT_ORDER_GROUPS。
---

# 元件檔案的形狀

**這份管的是共用元件目錄底下的 `.vue` 自己長什麼樣子** ——
它載入了什麼、開頭那幾行怎麼排。

頁面不在範圍內。頁面載入的東西依它要做的事而定,沒有固定的形狀;
元件是被重複放進畫面的零件,每一支長得一樣才好接手。

哪個目錄算共用元件,定義在 `.tools/lint/project-config.mjs` 的 `COMPONENTS_DIR`。
各專案的資料夾擺法不同,這份文件不另外抄一份路徑 ——
抄一份就會有對不上的一天,而對不上的時候規則會安靜地不再檢查任何東西。

## 一、樣式一定要 import

**元件的樣式寫在 CSS 模組裡,由元件自己載入。**

```vue
<script setup>
import '@css/_modules/mAnchor/variables.css'
import '@css/_modules/mAnchor/common.css'
</script>
```

少了那一行,這支元件被放進別的頁面時樣式不會跟著來 ——
而它在原本那一頁看起來是正常的,因為同一頁的別支元件已經把樣式載進來了。
那種問題要換一頁才會發現,而且現場看起來像是「這一頁壞了」,
不像是「這支元件少載了一行」。

**這一條報違規,工具不自動補。** 工具看得出「這支沒有載入樣式」,
看不出這支元件的樣式該放在哪一支 CSS 模組 ——
自動補一行等於替開發者決定檔案要叫什麼、要不要跟別支共用。

檢查:規則 `importOrder`。

## 二、import 依分組排列

順序是:**樣式 → 共用邏輯 → 共用函式 → 其他**。

```vue
<script setup>
import '@css/_modules/mAnchor/common.css'
import { useAnchor } from './.composables/useAnchor.js'
import { onScrollTo } from '@js/scroll.js'
import { computed } from 'vue'
</script>
```

一支檔案開頭那十幾行,每個人寫的順序都不一樣的話,
要找「這支有沒有載入某個東西」得整段看完。

**這一半不報違規,存檔時直接把順序排好。**
順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
而且搬的過程比工具更容易出錯。

分組的定義在 `.tools/lint/project-config.mjs` 的 `IMPORT_ORDER_GROUPS`
(每一組寫 `label` 與比對用的 `match`)。各專案的 alias 與資料夾命名不同,
寫死在規則裡的話,換一個命名的專案會把每一支元件都排錯。

自動排序有三個安全前提,少一個就可能改壞,所以工具做得保守:

| 前提 | 做法 |
| --- | --- |
| 只在連續的 import 區塊內重排 | 中間夾了任何一行別的程式碼就停在那裡,不跨過去 |
| 註解跟著它下方那一行一起搬 | 註解多半在講下面那一行是什麼,留在原地就指向了別的 import |
| 排序是穩定的 | 同一組的兩行維持原本的先後 |

分成好幾行寫的 import(路徑不在 `import` 那一行上)工具認不出來,
那種區塊整塊不動 —— 排錯一行的代價遠高於少排一次。

**只管組與組之間的先後,不管同一組裡面怎麼排。**
樣式那一組的組內順序(變數檔要排在版型檔之前)由 CSS 模組的規則在管,
兩條都去管組內順序的話,同一行會被指出兩種不同的修法。

## 與相鄰規範的界線

元件會被好幾份規範同時看到,各自管的是不同的事:

| 規範 | 管什麼 |
| --- | --- |
| **這一份**(component-conventions) | 元件自己的檔案形狀:載入了什麼、開頭那幾行怎麼排 |
| page-conventions | 元件與資料的關係:元件一律不能直接 import api,資料由使用它的頁面傳進來或寫進 store |
| import-alias | import 的**路徑**怎麼寫:離開自己資料夾的相對路徑改用 `@` alias |
| composable-order | `useXxxStore()` / `useXxxActions()` 這些**宣告**的順序,存檔時自動排 |

分辨方式:這一份看的是「import 哪些東西、排在第幾行」,
import-alias 看的是「那一行的路徑字串怎麼寫」,
composable-order 看的是「import 底下那些宣告的順序」。
