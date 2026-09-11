---
name: page-conventions
summary: 頁面
description: 本專案的頁面撰寫規範(頁面目錄底下的 .vue 與其元件)。當在頁面新增 api 呼叫、包裝 action、放置 api 回來的資料、調整 onMounted 的初次載入,或審查既有頁面寫法時使用。規則:api 資料一律放 store,頁面不要自己 ref 一份;元件一律不能直接 import api(沒有例外),頁面也擋但可在檔頭標 lint-page-api-exempt 放行一次性的請求;onMounted 裡的請求一律用並行載入的包裝函式一起發出,單支也包,存檔時自動包好;包裝 function 命名為 on + endpoint(去掉 Api 與 method 那一段,postForm 連 Form 一起去掉);只有這一頁要用的邏輯寫在這一頁,第二個頁面也要用時才搬進 use*Actions;掛在 api 回傳物件上的自訂欄位一律加 _ 前綴。
---

# 頁面撰寫規範

判斷邏輯在 `.tools/lint/rules-page.mjs`,四個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— `.claude/hooks/enforce-conventions.cjs` 比對寫入前後的內容,
  只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

**這份文件用「頁面目錄」「store 目錄」「api 目錄」指稱位置,不寫死實際路徑** ——
每個專案的資料夾擺法不一樣。這幾個目錄在這個專案實際是哪一個,
定義在 `.tools/lint/project-config.mjs`(那也是規則自己讀的同一份設定)。

與 [[store-conventions]] 分開:那支管「store 與 actions 自己怎麼寫」,
這支管「頁面怎麼使用它們」。

## 1. api 資料放 store,頁面不要自己 ref 一份

規則 `pageApiData`(擋)。

```js
// 錯誤：頁面自建
const apiData = ref({ Description: null })

// 正確：讀 store
const { detail } = storeToRefs(usePetsStore())
```

頁面自己 `ref` 一份的話,那份資料只活在這個元件裡:

- 跳 popup / 換頁再回來 → 元件重建,資料沒了,得重新打一次 api
- 同一份資料被兩個元件各抓一次 → 兩邊的值可能不一致
- 別的元件要用同一份時,只能再打一次 api 或層層傳 props

畫面狀態(開關、輸入值、目前分頁)留在元件裡是對的,這條只管 api 回來的資料。

## 2. 誰可以直接 import api

正常路徑是:api → `use*Actions.js`(寫進 store)→ 頁面讀 store。
直接 import api 的話,拿到的資料就停在那一支檔案裡 —— 沒有進 store,
換頁回來要重打,別的地方要用只能再打一次,也就是第 1 條想擋的那個結果。

**兩種對象都擋,差別在有沒有例外的出口:**

| 對象 | 規則 | 有沒有例外 |
| --- | --- | --- |
| **元件** | `componentApiImport` | 沒有例外 |
| **頁面** | `pageApiImport` | 檔頭標 `lint-page-api-exempt` 可放行 |

**元件一律不能自己去要資料。** 元件是被放進畫面裡的零件,同一支可能出現在很多頁、
也可能同一頁出現很多次 —— 它自己打 api 的話,出現幾次就打幾次,
而且每一份資料各自活在各自的元件裡,彼此不同步。
元件要什麼資料,**由使用它的頁面決定並傳進來**,或是頁面寫進 store 之後元件去讀。
這一種沒有例外,標了豁免記號也一樣擋。

**頁面有一種正當情況:一次性的請求。** 送出後就不再用的表單那種,
結果不顯示在畫面上,進 store 反而多繞一圈。那種情況在檔頭標記號並寫明理由:

```js
/* lint-page-api-exempt: 送出問卷,結果不顯示在畫面上,不需要進 store */
import { apiPostQuestionnaire } from '@api/question.js'
```

**為什麼要標而不是讓工具自己判斷。** 「真的是一次性請求」與「偷懶沒寫 actions」
寫出來一模一樣,工具分不出來。讓工具去查「這支 api 有沒有對應的 actions」也不行:
新功能還沒寫 actions 的時候會放行,而那正是最該擋下來的時候。
由人判斷、理由留在程式碼裡,下一個人看到才知道那不是漏寫。

記號作用於整支檔案 —— 與其他豁免記號一樣的範圍。

哪些目錄算元件,定義在 `.tools/lint/project-config.mjs` 的 `COMPONENT_DIRS`
(那幾個目錄底下**所有層級**都算)與 `COMPONENT_FOLDERS`
(頁面目錄底下要視為元件的資料夾名)。

## 3. 進入頁面要拿的資料一起發出

規則 `pageAwaitAll`(擋,但**存檔時會自動包好**)。

進入頁面時要拿的資料常常不只一份(列表、文案、會員狀態)。
一支一支 `await` 的話,第二支要等第一支回來才開始 ——
使用者等的是每一支的時間加總;包在一起則是同時發出,等的是最慢的那一支。

```js
// 錯誤：一支一支等
onMounted(async () => {
  await onApiGetActivityList()
  await onJsonEventsIndex()
})

// 正確：一起發出
onMounted(async () => {
  await awaitAllPromise([onApiGetActivityList(), onJsonEventsIndex()])
})
```

**只有一支的時候也一律包起來。** 之後要加第二支時直接加進陣列就好,
不必先把寫法整個改一遍;而且每一頁的初次載入長得一樣,讀的人不必分辨兩種寫法。

**這條只管進入頁面就要拿的資料**(`onMounted` 裡的)。
使用者觸發的動作(送出表單、切換排序)不在此限 —— 那是單一動作,包成陣列反而多一層。

存檔時工具會自動包好,連 import 一起補上。但有三種情況它不會動,留給人判斷:

| 情況 | 為什麼不自動改 |
| --- | --- |
| 後面那支拿前面的結果當參數 | 一起發出就是同時開始,後面那支會拿到還沒準備好的值,而且不會報錯 |
| 那一行接收了回傳值(`const { data } = await …`) | 包進陣列之後就拿不到結果了 |
| 中間夾了別的語句 | 那代表這幾支之間有順序安排,跨過去合併會把安排打散 |

包裝函式叫什麼、從哪裡來,定義在 `.tools/lint/project-config.mjs` 的
`PARALLEL_AWAIT_HELPER`。**專案沒有這支共用函式時,把 `name` 設成空字串,
這條規則就會整條略過** —— 有些框架自己就會處理並行載入,不需要這一層。

## 4. 包裝 function 的命名

規則 `pageActionNaming`(擋)。三層命名一路對得上,往下各去掉一段:

```
api 檔    apiGetMemberVoucherID       api + Method + endpoint
action    onApiGetMemberVoucherID     api 名前面加 on
頁面      onMemberVoucherID           去掉 Api 與 method 那一段
```

頁面那層把 `Api` 與 method 拿掉,是因為在頁面裡它就是個一般的事件處理函式
(通常還會接 callback、開關 loading),method 是底層的事;但 endpoint 留著,
才看得出它背後打的是哪一支 api。

**表單格式的 method 連 `Form` 一起去掉** —— `postForm` / `putForm` 這些
method 的 `Form` 講的是「送出的是表單格式」,屬於 method 那一段:

```
api 檔    apiPostFormPhotoUpload
action    onApiPostFormPhotoUpload
頁面      onPhotoUpload               PostForm 整段去掉
```

**只有需要在頁面做後續處理時才包一層**(導頁、彈窗、寫本地狀態)。
沒有後續處理、只是 `onMounted` 直接呼叫的話,直接 `await onApiGetXxx()` 就好,
不必多包。

## 5. 只有這一頁要用的邏輯,寫在這一頁

`use*Actions.js` 裡的 action,基本盤是做兩件事:打 api、把結果寫回 store 的
`apiData` 與 `data`。

這一支 api 回來以後要導去哪、要不要開彈窗、依欄位值決定下一步 ——
**只有這個頁面需要的處理就寫在這個頁面**。塞回 `use*Actions` 的話,
同一支 action 被第二個頁面用到時就得加「如果是從 A 頁來的就……」的判斷,
而那些判斷會越疊越多,最後沒有人敢動它。

**例外:第二個頁面也要用同一段邏輯時,搬進 action。**

在 api 資料上加工出前端欄位(`_` 開頭的那種)如果不只一頁要用,
就在 action 裡做完再寫回 store,不要每個頁面各算一次同樣的東西。
判斷方式很簡單:第一頁寫在頁面;第二頁也需要時,搬進 action 做一次。
不要為了「以後可能會用到」提前搬。

## 6. 自訂欄位加 `_` 前綴

掛在**「api 回傳物件」**上的前端自訂屬性一律加 `_`,與 api 欄位區隔:

```js
mission.value.detail._isRead = true
health.autoOrder.data._points = 100
```

不加的話,下次看到這個 key 會以為是後端給的,查 api 文件卻找不到;
後端真的新增同名欄位時還會直接撞掉。

這個前綴在頁面裡加、或在 `use*Actions.js` 的 action 裡加都適用 ——
只有一頁要用就在頁面加,多頁共用就在 action 加完再寫回 store。

前端狀態如果是 store 自建的獨立欄位(api 資料另外存在 `.data`),就不需要 `_`。

## 相關

- [[root-cause-fix]]:**照著這份改之前先看它** —— 頁面是最容易被疊東西的地方
  (多一個 prop、多一層包裝、多一份自己的狀態),修違規要處理成因。
- [[store-conventions]]:store 與 action 怎麼寫。
- [[api-conventions]]:api 檔案的命名與歸屬。
- [[composable-order]]:`<script setup>` 內的宣告順序。
