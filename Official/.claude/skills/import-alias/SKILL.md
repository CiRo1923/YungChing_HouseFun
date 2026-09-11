---
name: import-alias
summary: import 路徑
description: 本專案的 import 路徑規範。當需要在原始碼新增或修改 import(.js/.mjs/.ts/.vue),或審查、整理既有 import 路徑時使用。規則:離開自己資料夾的相對路徑(含 ..)一律改用建置設定 resolve.alias 定義的 @ 系列 alias。
---

# import 路徑規範:一律使用 @ alias

建置設定的 `resolve.alias` 定義了一組 `@` 開頭的路徑別名。
**原始碼裡的所有 import,凡是離開自己資料夾的相對路徑(含 `..`),
一律改用對應的 alias。** 同層的 `./Foo` 可以保留。

為什麼:`../../../scripts/util.js` 這種路徑,搬動檔案時要一層層重算,
而且看不出它到底指到哪裡。alias 寫法搬檔案時完全不用改。

## alias 有哪些

**唯一的來源是建置設定的 `resolve.alias`。** 這份文件不另外抄一張對照表 ——
抄一份就會有對不上的一天,而對不上的時候,規則會叫人改成一個不存在的 alias。

檢查工具也是直接讀那份設定,所以新增或改名 alias 時只改建置設定一處,
規則自動跟著更新,不必回頭維護任何清單。

路徑裡帶變數的 alias(例如目錄名寫在專案設定檔裡的那幾個),
工具會把變數換成實際值再比對;設定檔查不到值的那條會整條略過,
不會誤把它當成指向原始碼根目錄。

## 判定規則

- 相對路徑 import(以 `.` 開頭)解析後若**落在某個 alias 目錄下**,改用該 alias。
- 有多個 alias 命中時,選**最深層**(路徑最長)那個。
  例如一個檔案同時落在 `@` 與 `@components` 底下,要用 `@components`,
  因為它比較精確。
- 只針對含 `..`(離開當前資料夾)的相對路徑;同層 `./Foo` 不必改。

## 範例

```js
// 不要
import Foo from '../../components/Foo.vue'
import { useUser } from '../../stores/user'
import util from '../../scripts/util'

// 改成
import Foo from '@components/Foo.vue'
import { useUser } from '@stores/user'
import util from '@js/util'
```

同層維持相對即可:

```js
// 正確：OK(同資料夾)
import Child from './Child.vue'
```

## 自動檢查

規則 `importAlias`,判斷邏輯在 `.tools/lint/rules-code.mjs`,
四個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— `.claude/hooks/enforce-conventions.js` 比對寫入前後的內容,
  只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

訊息會直接寫出該改成哪一個 alias。

---

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
