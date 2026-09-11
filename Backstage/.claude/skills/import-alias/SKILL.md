---
name: import-alias
description: 本專案的 import 路徑規範。當需要新增或修改 import(.js/.mjs/.ts/.vue),或審查、整理既有 import 路徑時使用。規則:離開自己資料夾的相對路徑(含 ..)一律改用 nuxt.config.ts 的 alias 定義;有多個 alias 命中時選最深層的那個;同層的 ./Foo 維持相對路徑。
---

# import 路徑規範:一律使用 alias

`nuxt.config.ts` 的 `alias` 定義了一組 `@` 開頭的路徑別名。
**所有 import,凡是離開自己資料夾的相對路徑(含 `..`),一律改用對應的 alias。**
同層的 `./Foo` 可以保留。

為什麼:`../../../scripts/util.js` 這種路徑,搬動檔案時要一層層重算,
而且看不出它到底指到哪裡。alias 寫法搬檔案時完全不用改。

## alias 有哪些

**唯一的來源是 `nuxt.config.ts` 的 `alias` 區塊。**
這份文件不另外抄一張對照表 —— 抄一份就會有對不上的一天,
而對不上的時候,規則會叫人改成一個不存在的 alias。

其中幾個的目標路徑寫在專案設定檔的變數裡(圖片、樣式、指令碼三個目錄),
要知道實際指向哪裡,看那個設定檔,不要在這裡再記一次。

## Nuxt 內建的 `~/` 與 `@/` 怎麼辦

Nuxt 本身提供 `~/`、`~~/`、`@/` 指向專案根。**有自訂 alias 可用時就用自訂的** ——
`@imgs/buy/house.svg` 比 `@/assets/imgs/buy/house.svg` 精確,
而且圖片目錄搬家時前者不用改。

自訂 alias 沒有涵蓋到的目錄才用 Nuxt 內建的。

## 判定規則

- 相對路徑 import(以 `.` 開頭)解析後若**落在某個 alias 目錄下**,改用該 alias
- 有多個 alias 命中時,選**最深層**(路徑最長)那個 ——
  一個檔案同時落在 `@/` 與 `@imgs` 底下時要用 `@imgs`,因為它比較精確
- 只針對含 `..`(離開當前資料夾)的相對路徑;同層 `./Foo` 不必改

## 範例

```js
// 不要
import Foo from '../../components/common/Foo.vue'
import { useCommonStore } from '../../stores/common.js'
import icon from '@/assets/imgs/buy/house/home.svg'

// 改成
import Foo from '@components/common/Foo.vue'
import { useCommonStore } from '@stores/common.js'
import icon from '@imgs/buy/house/home.svg'
```

同層維持相對即可:

```js
// 同資料夾,不必改
import useValidateEvents from './.composables/useValidateEvents.js'
```

## 目前沒有自動檢查

這條規則**還沒有對應的檢查工具** —— 靠寫的時候自己遵守,以及 code review。

判斷方式很簡單:**看到 `..` 就想一下有沒有對應的 alias**。

要找出違規的地方,搜尋 `from '../` 就看得到全部
(同層的 `./` 不算,那本來就允許)。

## 相關

- CSS 模組的 import 順序另有規範,見 `.claude/rules/css-conventions.md` 的
  「規則 5:.vue 的 import 順序」—— 那條管的是**先後次序**,
  這一份管的是**路徑怎麼寫**,兩者不衝突。
