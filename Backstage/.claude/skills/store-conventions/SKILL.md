---
name: store-conventions
summary: store / actions
description: 本專案的 store 與 actions 撰寫規範(store 目錄的 *.js 與 .composables/use*Actions.js)。當新增或修改 store、搬移狀態歸屬、取用 store 的值、新增呼叫 api 的 action,或審查既有 store 寫法時使用。規則:store 只放宣告(變數與 computed),function 一律進 .composables/use*Actions.js;檔名與分層跟著頁面目錄的資料夾走,層裡面有 data 還是 apiData 看這一頁與後端的往來而定;送出參數的預設值集中成 const apiDefault = readonly({ … });取值一律走 storeToRefs,直接解構或賦值會斷掉響應;action 命名為 onApi + api 函式名,一律 return { config, status, data };action 基本只覆寫 apiData 與 data,只有一頁要用的邏輯寫在頁面、多頁共用的自訂欄位(_ 開頭)才寫進 action。
---

# store / actions 撰寫規範

判斷邏輯在 `.tools/lint/rules-store.mjs`,四個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— `.claude/hooks/enforce-conventions.cjs` 比對寫入前後的內容,
  只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

**這份文件用「store 目錄」「頁面目錄」「api 目錄」指稱位置,不寫死實際路徑** ——
每個專案的資料夾擺法不一樣。這幾個目錄在這個專案實際是哪一個,
定義在 `.tools/lint/project-config.mjs`(那也是規則自己讀的同一份設定)。

## 1. store 只放宣告,行為進 actions

規則 `storeDeclare`(擋)。

```js
// 正確：<store 目錄>/<頁面資料夾名>.js —— 只有宣告
export const useExchangeStore = defineStore('exchange', () => {
  const index = ref({ data: null })
  const detail = ref({
    delivery: { data: null, apiData: { ...apiDefault.detail.delivery } },
  })

  const isEmpty = computed(() => !index.value.data?.length)

  return { index, detail, isEmpty }
})
```

- **`computed` 可以**(它是衍生狀態,不是行為)。
- **function 一律不行** —— 一旦 store 開始放 function,它就同時是「狀態定義」
  與「行為實作」;之後要找某個行為得先猜它在 store 還是 actions。
- 資料夾一律叫 `stores`(規則 `storeDir`),store 命名 `use{名稱}Store`(規則 `storeNaming`),
  actions 檔名 `use{名稱}Actions.js`(規則 `storeActions`)。

## 2. 分層跟著頁面

規則 `storeScope`(檔名)與 `storeLayer`(分層),都會擋。

**一個頁面一層,層名就是頁面名(首字小寫)。**

```
<頁面群>/<頁面>.vue          →  const <頁面> = ref({ … })
<頁面群>/<分類>/<頁面>.vue   →  const <頁面> = ref({ … })   ← 分類資料夾不佔一層
```

角括號是要換掉的部分。層裡面放什麼,看這一頁與後端有哪些往來:

| key | 什麼時候要有 |
| --- | --- |
| `data` | 這一頁有向後端要資料時,放 api 回來的結果 |
| `apiData` | 這一頁有送參數給後端時,放要送出的資料 |

**不是每一層都要有這兩個。** 只讀不送的頁面沒有 `apiData`,
送出後不顯示結果的頁面沒有 `data` —— 依這一頁實際的往來決定,
沒有的那個不必補一個空的出來。

工具檢查的也是這件事:它只看「有向後端要資料的頁面,store 裡有沒有對應的層」,
層裡面放什麼不管;`apiDefault` 則是「有 `apiData` 時才要求」。

分層跟著頁面走,才能「看到頁面就知道資料在 store 的哪裡」。
反過來也成立:看到 store 裡某一層,知道它是給哪一頁用的,改的時候知道會影響誰。

**只有向後端要資料的頁面需要一層。** 純版型頁、靜態說明頁本來就沒有狀態,
硬補一層出來,那一層沒有人讀 —— 沒有人讀就永遠不會被發現是錯的,
而下一個人看到它會以為某個地方在用,不敢刪。

### 資料夾只是分類時,不要多包一層

頁面群底下常常會再分資料夾,把性質相近的頁面放在一起。
**那種資料夾只是分類,不是一層狀態** —— store 直接用頁面名就好。

舉例:某個頁面群底下有一個分類資料夾,裡面放著三支各自獨立的頁面。

```js
// 正確：三支頁面各自一層,分類資料夾不出現在 store 裡
const 頁面A = ref({ … })
const 頁面B = ref({ … })
const 頁面C = ref({ … })

// 錯誤：為了對應資料夾名多包一層
const 分類 = ref({
  頁面A: { … },
  頁面B: { … },
  頁面C: { … },
})
```

多包的那一層沒有任何東西住在裡面 —— 它不持有共用狀態,只是把路徑加長,
每個使用端都要多寫一段。

### 例外:同一群裡有好幾支同名頁面

每個分類資料夾底下各放一支 `Index.vue` 與 `Detail.vue` 是很常見的擺法。
那時扁平的層名會撞在一起 —— 而**撞在一起就等於兩頁共用同一份狀態**:
一頁改了另一頁跟著變,而且看不出來是誰改的。

**撞名的那幾支,才把分類資料夾補回來當一層。**

```js
// 頁面群底下:
//   <頁面群>/Information.vue            ← 沒有第二支同名的
//   <頁面群>/<分類A>/Detail.vue
//   <頁面群>/<分類B>/Detail.vue         ← 兩支都叫 Detail

const information = ref({ … })        // 沒撞,維持扁平

const <分類A> = ref({ detail: { … } }) // 撞了,資料夾佔一層
const <分類B> = ref({ detail: { … } })
```

名字只在需要分辨的時候才變長,沒撞的維持最短。
判斷範圍是**同一個頁面群之內** —— 別的頁面群有同名頁面不影響,
它們本來就在不同的 store 裡。

### 工具報了這條該怎麼看

規則看到「這一頁有向後端要資料、store 沒有對應的層」時會提醒。
**那是提醒,不是結論** —— 規則看得到結構對不對得上,看不出那份資料實際上該放哪裡:

| 判斷 | 做法 |
| --- | --- |
| 這一頁確實有自己的資料 | 建一層,層名照上面的規則取 |
| 那份資料屬於別的層(例如清單頁與內頁共用同一份清單) | 標 `/* lint-store-layer-exempt: 理由 */` |
| 兩頁確實要共用同一份狀態 | 標豁免並寫清楚為什麼共用 |

豁免要寫理由 —— 下一個人看到那行才知道是想過的決定,不是繞過檢查。

**不要為了讓規則過就補一層。** 沒有頁面要用的狀態不該存在 ——
補出來的空層沒有人讀,重設狀態、初始化的地方卻都要多帶它一份。

**沒有頁面要用的狀態不要自己加。** 這條提醒說「缺一層」時,
先確認有沒有哪一頁真的要用那份狀態;沒有就停下來問,由開發者決定。

照著補上去的話,store 裡會多一份沒有人讀的狀態 —— 沒有人讀所以永遠不會被
發現是錯的,下一個人看到它又會以為某個地方在用而不敢刪,
重設與初始化的地方還都要多帶它一份。

這是 [[no-assumption]] 的「不自行建立狀態」在分層這件事上的樣子。

## 3. 送出參數的預設值集中在 apiDefault

規則 `storeApiDefault` 與 `storeResetDefault`(都擋)。

```js
const apiDefault = readonly({
  detail: {
    delivery: { LastName: null, Phone: null },
    linePoint: { Amount: 1, Id: null },
  },
})

// 初始化與 reset 都直接展開
detail.value.delivery.apiData = { ...apiDefault.detail.delivery }
```

- **結構跟著 store 的分層走**,要找某一層的預設值時路徑是一樣的。
- **一定要 `readonly`**。這份是「還原用的原始值」,不是狀態;少了 `readonly`,
  任何一次 `apiDefault.detail.delivery.Phone = x` 都會把原始值改掉,
  之後每次 reset 都還原成被改過的值,而且完全沒有徵兆。
- **reset 不要手寫預設值**。散在各處的話,改一個欄位要同時記得改 store 的初始值
  與每一支 reset,漏掉一邊不會報錯 —— 只會在「送出前先重填一次」的流程裡帶到舊值。

## 4. 取值一律走 storeToRefs

規則 `storeToRefs`(擋)。

```js
const member = useMemberStore()

const { info } = storeToRefs(member)   // 正確：拿到 ref,跟著 store 變

const { info } = useMemberStore()      // 錯誤：解構,拿到當下的值
const info = member.info               // 錯誤：賦值,同樣是當下的值
```

pinia 的 store 實例是 reactive 物件,值一旦「取出來」就跟 store 斷了連結。
斷掉之後畫面**不會報錯,只是不再更新** —— api 回來了、別的頁面改了值,
這裡還是舊的;而且通常要等到有人問「為什麼這裡沒跟著變」才被發現。

不受這條限制的:

- **寫入**:`member.info = x` 是對的,只有「讀出來存成 `const`」才有問題
- **`$` 開頭的 pinia API**:`$patch` / `$reset` / `$subscribe` / `$state`
- **`use*Actions()`**:那是一般 composable,不是 store,直接解構就好

## 5. action 命名:onApi + api 函式名

規則 `storeActionNaming`(擋)。

```
api 檔    apiGetMemberVoucherID
action    onApiGetMemberVoucherID    ← api 名前面加 on
```

從 action 名字直接看得出它打的是哪一支 api,不必翻進函式主體找;
api 改名時,對不上的 action 也會被規則抓出來。

一個 action 打多支 api 時只檢查 `onApi` 前綴 —— 該用哪一支的名字是人要決定的。

### 同一支 api 兩個頁面都要用

同一支 api 常常有兩個頁面要打:清單頁要整份列表,內頁要其中一筆加上明細欄位。

**api 本身維持一份,名字不變**(`api` + method + endpoint)。
**分開的是「拿到之後放進哪一層」** —— 那屬於 action,不屬於 api。

作法是各自寫一個 action、各自寫進自己那一層,名字帶上層名分辨:

```js
// store:兩層各自獨立
const index = ref({ data: null, apiData: { … } })
const detail = ref({ data: null, apiData: { … } })

// actions:同一支 api,兩個 action
const onApiGetVoucherListIndex = async () => {
  const { config, status, data } = await apiGetVoucherList(index.value.apiData)

  index.value.data = data

  return { config, status, data }
}

const onApiGetVoucherListDetail = async () => {
  const { config, status, data } = await apiGetVoucherList(detail.value.apiData)

  detail.value.data = data

  return { config, status, data }
}
```

**不要共用同一個 action、也不要共用同一層。** 共用的話,
要嘛得在 action 裡加「誰在呼叫」的判斷(那段邏輯屬於頁面,不屬於 action),
要嘛兩頁共用同一份狀態 —— 一頁換頁回來另一頁的畫面就跟著變,
而且從畫面看不出來是誰改的。

**後綴只在需要分辨時才加。** 一支 api 只有一個 action 在用的話,
名字維持最短的 `on` + api 名,不必帶層名。

**不同頁面群(不同 store)共用同一支 api 時不受這條影響** ——
各自的 `use*Actions.js` 各自 import 那支 api、各自寫進自己 store 的層。
名字相同但在不同檔案裡,本來就分得開。

## 6. action 的寫法

規則 `storeActionReturn`(擋):打了 api 的 action **一律 `return { config, status, data }`**。

**(a) 非 200 即錯誤(多數情況)**

```js
const onApiGetMemberVoucherID = async (params) => {
  const { config, status, data } = await apiGetMemberVoucherID(params)

  if (status !== 200) {
    onApiError(config, status, data)
    return { config, status, data }
  }

  member.value.voucher.data = data

  return { config, status, data }
}
```

**(b) 400 交給頁面自理**

```js
  if (status !== 200 && status !== 400) {
    onApiError(config, status, data)
    return { config, status, data }
  }
```

只有當呼叫端有明確判斷 400(導頁、彈自訂窗)時才用 (b)。

**通則**

- **禁止 `return await apiXxx(params)` 這種 bare 透傳**(規則 `deprecated` 會擋)——
  沒有明確回傳三件,也沒套錯誤規則。
- **`onApiError` 由 action 負責**,頁面不再重複彈一次。
- 不要 `console.log`。判斷用 `data?.length`。

## 7. action 寫多少 —— 看那段邏輯有幾個頁面要用

**基本盤:action 只覆寫 store 的 `apiData` 與 `data`。**

導頁、開彈窗、依回傳值決定下一步這類**只有這一頁需要**的處理,寫在頁面。
塞進 action 的話,同一支 action 被第二個頁面用到時就得加
「如果是從 A 頁來的就……」的判斷,而那些判斷會越疊越多,最後沒有人敢動它。

**例外:多個頁面共用的自訂邏輯,寫進 action。**

在 api 回來的資料上加工出前端自己的欄位(`_` 開頭的那種,例如
`data._isExpired`、`data._displayName`),如果**不只一個頁面需要**,
就在 action 裡做完再寫回 store,不要每個頁面各算一次。

```js
const onApiGetMemberVoucherID = async (params) => {
  const { config, status, data } = await apiGetMemberVoucherID(params)

  if (status !== 200) {
    onApiError(config, status, data)
    return { config, status, data }
  }

  // 多個頁面都要判斷「這張券過期了沒」,所以算在這裡,不是每頁各算一次
  member.value.voucher.data = {
    ...data,
    _isExpired: new Date(data.ExpiredAt) < new Date(),
  }

  return { config, status, data }
}
```

自訂欄位一律加 `_` 前綴,與 api 給的欄位分開 —— 不加的話,下次看到這個 key
會以為是後端給的,查 api 文件卻找不到;後端真的新增同名欄位時還會直接撞掉。

**判斷方式**:這段邏輯只有一個頁面要用就留在頁面;第二個頁面也要用時,
搬進 action 做一次。不要為了「以後可能會用到」提前搬。

## 相關

- [[root-cause-fix]]:**照著這份改之前先看它** —— 修違規要處理成因,
  不是在 action 上再加一個 if、在 store 上再多存一份。
- [[api-conventions]]:api 檔案本身的命名與歸屬。
- [[page-conventions]]:頁面怎麼使用這些 action。
- [[composable-order]]:頁面內 store / actions 的宣告順序。
