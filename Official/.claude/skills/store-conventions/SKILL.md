---
name: store-conventions
description: 改 stores/ 下的檔案前必須先讀。說明 store(宣告)與 Actions(執行事件)的分層、API action 的錯誤處理慣例、apiData / apiResult 的角色,以及 cookie 的職責切分。觸發時機 - 要新增或修改 stores/**/*.js 或 stores/**/.composables/use*Actions.js、要接一支新 API、要決定「錯誤要彈窗還是換整頁」、或使用者問到「這個常數 / 狀態該放哪」。
---

# Store 慣例

## 分層:`*.js` 宣告,`*Actions.js` 執行事件

| 檔案 | 只放 |
|---|---|
| `stores/member/upgrade.js` | **宣告** — state(`ref`)、常數與預設值(`readonly`) |
| `stores/member/.composables/useUpgradeActions.js` | **執行事件** — 函式(API 呼叫、cookie 存取、popup 開關) |

**Actions 內不得宣告常數**。需要固定值時放進 store 再引用:

```js
// stores/member/upgrade.js
const apiTokenInvalid = readonly({ config: {}, status: 401, data: {} })

return { apiDefault, apiTokenInvalid, ... }
```

```js
// useUpgradeActions.js
if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid
```

取值方式:**state 走 `storeToRefs`,常數直接從 store 實例取**(`memberUpgrade.apiDefault.email`)——
`readonly` 的東西沒有反應式需求,走 `storeToRefs` 只是多一層 ref。

### Actions 檔案內的排列順序

1. `useXxxStore()` / `storeToRefs` / 其他 composable
2. **所有 `onApiXxx`**(API 執行事件)
3. **helper**(`onUpgradeTokenConfig`、`onCheckUpgradeToken`、cookie 工具 …)
4. `reset`
5. `return { ... }`

helper 一律放在 API function 後面。它們是 `const` 箭頭函式,但因為只在 action **執行時**才被呼叫
(那時整個 setup 已跑完),不會踩到 TDZ。

---

## API action 的形狀

每支都長這樣,**一律回傳 `{ config, status, data }`** 讓呼叫端自行決定後續:

```js
const onApiXxx = async () => {
  const { apiData } = xxx.value
  const { config, status, data } = await apiXxx(apiData)

  xxx.value.apiResult = null

  if (status === 200) {
    // 成功處理:寫 store、寫 cookie
  } else if (status === 400 || status === 404) {
    // 後端有給明確原因的可預期錯誤 → 只顯示 message
    onAlert({ content: data.message, setClass: { main: 'pt:--w-460' } })
  } else if (status !== 200) {
    // 其餘皆為非預期錯誤 → 統一錯誤彈窗
    onApiError(config, status, data)
  }

  return { config, status, data }
}
```

**用 `else if` 串接,不要用「排除清單」**(`status !== 200 && status !== 400 && ...`)——
排除清單與 `===` 判斷是兩套邏輯,新增狀態時漏改就會互相覆蓋成死碼。

---

## `apiData` / `apiResult` 的角色

| 欄位 | 用途 |
|---|---|
| `apiData` | 送出去的 request body。初值一律來自 `apiDefault.xxx` 的展開 |
| `apiResult` | **只給「整頁換掉」的狀態**(例如超限),不是所有錯誤都往裡塞 |

一般的可預期錯誤(格式不符、查無資料)走 `onAlert` 就好。**寫進 `apiResult` 會讓輸入表單
被整頁取代掉,使用者連改都沒得改** —— 這個 bug 實際發生過:手機號碼打錯(400)導致
`phone.apiResult` 有值,表單整個被「無法發送驗證碼」的畫面蓋掉。

---

## `reset` 的模式

```js
const reset = {
  onEmailVerify() {
    emailVerify.value.apiData = { ...memberUpgrade.apiDefault.emailVerify }

    // apiResult 也要一起清:store 是單例,上一次進頁面留下的結果會被這次沿用
    emailVerify.value.apiResult = null
  },
}
```

頁面的 `onInit` 一律先 `reset.onXxx()` 再從 cookie 還原,順序不能反。

---

## cookie 的職責切分

**一個流程段落一支 cookie,不共用**。共用會互相污染:

```
EMAILVALUE       email 值(session cookie)
EMAILVERIFY      challengeToken + resendAvailableAt(效期 = resendAvailableAt)
EMAILVERIFYTOKEN upgradeToken(效期 = expiresAt)
PHONE            手機號碼(session cookie)
EMAILEXCEEDED    email 發送超限(效期 = unlockAt)
PHONEEXCEEDED    手機發送超限(效期 = unlockAt)
```

`EMAILEXCEEDED` / `PHONEEXCEEDED` 一開始是同一支 `EXCEEDED`,結果 email 超限會讓 phone 頁
也顯示超限、email-verify 的 middleware 也被手機的超限擋住 → 拆成兩支。

### 三條規則

1. **效期跟隨後端給的絕對時間**(`expiresAt` / `unlockAt` / `resendAvailableAt`),
   讓瀏覽器自動清掉,不要自己排程;值無效時退為 session cookie:

   ```js
   const expires = new Date(data.expiresAt)
   const isValidExpires = !Number.isNaN(expires.getTime())

   onSetCookie(KEY, value, isValidExpires ? { expires } : {})
   ```

2. **一律經 `onSetCookie` / `onGetCookie` / `onClearCookie`** —— 它們負責加解密與壞值清理,
   不要直接碰 `useCookie`。例外是 middleware:那裡只需要「有沒有有效值」這個判斷,
   用 `useCookie` + `deCrypto` 兩行就夠,不必為此初始化整個 store。
   (Pinia 在 route middleware 執行前已就緒,composable 其實呼叫得到 ——
   真正的限制是 **server 端 store 沒有值**,所以判斷依據要放 cookie 而不是 store。)

3. **流程作廢時,連它發出的通行證一起清**。例如 email 超限(429)不只清 `EMAILVALUE` /
   `EMAILVERIFY`,還要清 `EMAILVERIFYTOKEN` —— 否則已驗證過的人回頭重送到超限後,
   仍能憑舊 token 前進到下一段流程。

---

## header 型的參數走第二個 config 參數

API 層保留 `config`,由 action 帶入,**不要塞進 body**:

```js
// scripts/_api/member/upgrade.js
export const apiAuthEmailUpgradeMobileCheck = async (data, config) =>
  await fetchApi.post(`api/${version}/...`, data, config)
```

```js
// useUpgradeActions.js — 無值時整個 headers 省略,
// 免得送出 X-Upgrade-Token: null 讓後端當成無效 token 而非未帶
const onUpgradeTokenConfig = () => {
  const { token } = phone.value

  return token ? { headers: { 'X-Upgrade-Token': token } } : {}
}
```

---

## 短效 token 的雙重防線

middleware 只在**進入頁面**檢查一次,停留期間 cookie 可能已到期被瀏覽器清掉,
而 store 的值是進頁面時讀的、不會跟著消失。所以每支需要 token 的 action 都要:

```js
// 開頭:以 cookie 為準重新確認(順便把 store 補成最新)
if (!onCheckUpgradeToken()) return memberUpgrade.apiTokenInvalid

// 回應:後端說失效就走同一個出口
if (status === 401 || status === 403) onUpgradeTokenInvalid()
```

失效的統一出口負責:清 store 的 token → 清整條流程的 cookie → 提示 → `router.replace` 回起點。

`router` 要在 **setup 期間**先取好(`const router = useRouter()`)。action 是在事件處理器、
且多半在 `await` 之後才執行,那時直接呼叫 `navigateTo` / `useRouter` 可能已經沒有 Nuxt context。

---

## 改動前的檢查清單

- [ ] 新增的常數 / 預設值放在 `stores/*.js`,不是 Actions
- [ ] 新的 helper 放在所有 `onApiXxx` 後面
- [ ] API action 回傳 `{ config, status, data }`,狀態用 `else if` 串接
- [ ] 這個錯誤該彈窗還是換整頁?只有後者才寫 `apiResult`
- [ ] 新的 cookie 有自己的常數,沒有跟別的流程共用
- [ ] cookie 效期用後端給的絕對時間,無效時退 session cookie
- [ ] 需要 token 的 action 兩道都補了(開頭檢查 + 401/403 分支)
