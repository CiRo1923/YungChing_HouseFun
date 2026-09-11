---
name: api-conventions
summary: api
description: 本專案的 API 撰寫規範(api 目錄底下的 *.js)。當新增或修改 api 檔案、搬移 api 的歸屬、決定 api 函式名稱,或審查既有 api 寫法時使用。規則:禁用 axios(原生請求可用但不建議);api 檔名對得上頁面目錄的第一層資料夾,對不上的放 project.js;請求實例只建在 api 目錄的設定檔一支;命名為 api + Method + endpoint 各段(GET 也要寫出 method,{id} 一律大寫 ID);每支一律回 { config, status, data };動態網址用 {key} 模板;不包 try/catch。
---

# API 撰寫規範

判斷邏輯在 `.tools/lint/rules-api.mjs`,四個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— `.claude/hooks/enforce-conventions.js` 比對寫入前後的內容,
  只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

**這份文件用「api 目錄」「頁面目錄」「store 目錄」指稱位置,不寫死實際路徑** ——
每個專案的資料夾擺法不一樣。這幾個目錄在這個專案實際是哪一個,
定義在 `.tools/lint/project-config.mjs`(那也是規則自己讀的同一份設定)。

## 1. 請求一律走共用實例

```js
// ✅ <api 目錄>/member.js
import fetchApi from './.config.js'

export const apiGetMemberInfo = (data) => fetchApi.get('member/info', data)
```

- **禁用 axios**(規則 `apiClient`,擋)。專案已經有共用的 `onFetchApi`,
  再多一套請求庫等於兩種錯誤格式、兩份攔截器,使用端得為它多寫一套判斷。
- **原生 `fetch` / `XMLHttpRequest` 可以用,但會被提醒**(規則 `apiClient`,建議級不擋)。
  它能動,只是繞過共用實例 —— 攔截器帶的 `LineIdToken` 那類共用參數不會生效。
  打外部服務、要上傳進度時才用,不要順手用。
- **實例只建在 `.config.js` 一支**(規則 `apiSource`,擋)。
  每支 api 各自 `onFetchApi()` 的話,攔截器要各設一次;漏掉一支不會報錯,
  只會在某個頁面靜靜地少帶參數,通常要等後端說「這支怎麼沒帶 token」才發現。

## 2. 檔案歸屬:對得上頁面目錄的第一層資料夾

規則 `apiScope`(擋)。

一支 api 檔案對應一個頁面資料夾,**檔名與資料夾同名**:

| 情況 | 放哪 |
| --- | --- |
| 只在 `<頁面目錄>/<資料夾名>/` 底下用 | `<api 目錄>/<資料夾名>.js` |
| 跨多個第一層資料夾共用 | `<api 目錄>/project.js` |
| 對不上任何資料夾 | `<api 目錄>/project.js` |

角括號是要換掉的部分。頁面目錄底下有 `member/`,api 就叫 `member.js`;
有 `order/`,api 就叫 `order.js` —— 資料夾叫什麼由專案自己決定,
這條規則管的是「兩邊必須同名」。

**不要再開新的獨立檔案。** 同一支 api 被多個頁面用到時,**api 檔案仍然只放一份**,
名字也不變 —— 分開的是「拿到之後放進哪一層」,那屬於 action。

每個頁面群在自己的 `use*Actions.js` 裡 import 那支 api,各自寫一個 action、
各自寫進自己 store 的層。同一支 actions 檔裡有兩個 action 打同一支 api 時,
名字要帶上層名分辨(`onApiGetVoucherListIndex` / `onApiGetVoucherListDetail`)——
共用一個 action 的話,兩頁就共用同一份狀態,一頁換頁回來另一頁的畫面跟著變。

判斷依「實際被哪些第一層資料夾的頁面使用」,不是依 API 路徑字面 ——
路徑開頭是 `member/` 的 api 未必歸 member 那一支。

## 3. 命名:api + Method + endpoint

規則 `apiNaming`(擋)。

函式名由三段組成:`api` + HTTP method + endpoint 的每一段(各段首字母大寫)。
下面的 endpoint 只是示意,實際的網址由後端決定:

```
get      activity/list        →  apiGetActivityList
post     member/info/update   →  apiPostMemberInfoUpdate
get      voucher/item/{id}    →  apiGetVoucherItemID
delete   member/pet/{id}      →  apiDeleteMemberPetID
postForm photo/upload         →  apiPostFormPhotoUpload
```

- **method 寫在前面** —— 第一眼就知道這支是查詢還是寫入。
- **GET 也要寫出來**。不寫的話,看到一個沒有 method 的名字分不出它是查詢還是新增;
  而且同一個 endpoint 有多個 method 時,只有其中一支沒寫,規則就不齊。
- **路徑參數 `{id}` 一律大寫 `ID`**(不是 `Id`)。這一段是大小寫敏感的。
- 其餘段落的比對**不分大小寫** —— 全小寫的複合字要怎麼拆
  (例如 `userphoto` 要拆成 `UserPhoto` 還是別的)需要語意判斷,
  工具推不出來,拆法交給人。

**寫成兩行也一樣要檢查。** 路徑長一點的時候會被格式化成這樣,
名字與請求分開在兩行 —— 這是正常的寫法,規則照樣看得到:

```js
export const apiGetVoucherForceBookDetailID = (data) =>
  fetchApi.get('voucher/forcebook/detail/{id}', data)
```

## 4. 回傳一律 { config, status, data }

規則 `apiReturn`(擋)。

三個欄位是使用端的共同契約:`status` 判成敗、`data` 拿內容、`config` 回頭看送了什麼。
少一個,使用端就得為這一支寫特例 —— 而那個特例通常是在出事的時候才被發現。

直接 `=> fetchApi.get(...)` 的不必自己組,共用實例回的就是這三件。
自己組一份回傳(`=> ({ … })`)時三個欄位一個都不能少。

## 5. 動態網址用 {key} 模板

```js
export const apiGetMemberVoucherID = (data) => fetchApi.get('member/voucher/{id}', data)
export const apiGetMemberMissionModuleID = (data) =>
  fetchApi.get('member/mission/{module}/{id}', data)

// 呼叫端帶扁平物件:onApiGetMemberVoucherID({ id })
```

`.export.js` 的 `onReplacePathParams` 會替換路徑,並把用過的 key 從 query / body 排除。

舊的 `apiParams`(用位置參數接路徑)**已淘汰**,規則 `deprecated` 會擋。

## 6. 不包 try/catch

`.export.js` 已經統一處理錯誤並轉成 `{ config, status, data }`。
再包一層 try/catch 只會把錯誤吞掉,讓 `status` 判斷失效。

## 相關

- [[root-cause-fix]]:**照著這份改之前先看它** —— api 的形狀不對時要改 api,
  不是讓每個使用端各自轉一次。
- [[store-conventions]]:action 怎麼呼叫這些 api、怎麼寫回 store。
- [[page-conventions]]:頁面怎麼使用 action。
