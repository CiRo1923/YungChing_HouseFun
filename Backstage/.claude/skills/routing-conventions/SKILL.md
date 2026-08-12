---
name: routing-conventions
description: 新增 / 改名 pages 目錄下的檔案或目錄前必須先讀。說明檔名如何直接變成 URL(大小寫不轉換)、_components 為何要從路由排除(本專案尚未排除,含套用步驟),以及新增頁面時的命名規則。觸發時機 - 要在 pages/ 新增或改名檔案 / 目錄、要改 nuxt.config.ts 的 pages:extend 或 components:dirs、或使用者問到「網址為什麼長這樣 / 大小寫 / 404 / 內部元件被當成頁面 / 產物太大」。
---

# 路由慣例

## 檔名 = URL,大小寫不轉換

Nuxt 的檔案路由直接拿檔名當 path segment,**不做任何大小寫轉換**:

| 檔案 | 產生的 path |
|---|---|
| `pages/buy/list/verify.vue` | `/buy/list/verify` |
| `pages/buy/list/VerifyCode.vue` | `/buy/list/VerifyCode` ← 大寫會留在 URL |

大寫 URL 的問題:

- **Vue Router 預設區分大小寫** → 使用者手打小寫版本會 404
- 與既有慣例不符

### 命名規則

| 位置 | 命名 | 例 |
|---|---|---|
| `pages/` 下的**路由檔** | 全小寫,多字用連字號 | `index.vue`、`basic.vue`、`[id].vue` |
| `pages/**/_components/` 下的**元件** | PascalCase | `AutoRefreshAddTime.vue` |
| `components/`、`containers/` 下的元件 | 依既有慣例 | `buy/mPopup/Main.vue` |

**改名 pages 檔案前先 grep 路由 name** —— 路由 name 由路徑轉成(`/buy/list/VerifyCode`
→ `buy-list-VerifyCode`),`router.push({ name: ... })` 的地方會一起壞掉。

---

## `_components` 應排除在路由之外(本專案尚未套用)

`pages/**/_components/` 是「元件就近放在頁面旁」的慣例,由 `nuxt.config.ts` 的
`components:dirs` + `scripts/nuxt/page-component-dirs.ts` 註冊成元件(前綴 `Page` + 路徑)。

**但 Nuxt 的頁面掃描不認得這個約定** —— 它照樣把每個 `.vue` 掃成頁面。

**本專案現況**:`pages/` 下有 6 個 `_components` 目錄、共 **152 個 .vue**,
全部都是可被直接訪問的內部路由,例如:

```
/buy/_components/popup/AutoRefreshAddTime
/buy/list/_components/popup/Deal
/buy/publish/basic/_components/...
```

後果:產物膨脹、內部元件可被列舉與訪問、爬蟲會抓到大量無意義頁面。
姊妹專案 Official 移除同類路由(115 條)後,產物由 **4.86 MB → 4.42 MB**
(gzip 1.23 → **1.03 MB**)。

### 套用方式

在 `nuxt.config.ts` 的 `hooks` 內加入(放在既有的 `components:dirs` 之前即可):

```ts
// pages/**/_components 只是「元件就近放在頁面旁」的慣例,由 components:dirs 註冊成元件;
// 但 Nuxt 的頁面掃描不認得這個約定,仍會把每個檔案掃成頁面 → 產生上百條可被直接訪問的
// 內部路由。這裡整批移除。
'pages:extend'(pages) {
  const removeComponentRoutes = (routes: typeof pages) => {
    for (let i = routes.length - 1; i >= 0; i -= 1) {
      const route = routes[i]

      if (!route) {
        continue
      }

      if (route.path.includes('_components')) {
        routes.splice(i, 1)
        continue
      }

      if (route.children?.length) removeComponentRoutes(route.children)
    }
  }

  removeComponentRoutes(pages)
},
```

三個實作細節:

1. **由後往前迭代** — 邊走邊 `splice` 才不會跳過元素
2. **遞迴處理 `children`** — 巢狀路由的子路由也要清
3. **`if (!route) continue`** — 若專案開了 `noUncheckedIndexedAccess`,`routes[i]` 的型別是
   `T | undefined`,少了這段 `tsc` 會報 TS18048

套用後 `_components` 底下的檔案**仍然是元件**(`components:dirs` 不受影響),只是不再是頁面。

---

## 驗證方式

`nuxt prepare` 不會產生可直接讀的路由清單,最可靠的是從 build 產物撈:

```bash
# 套用前應為 152 左右,套用後應為 0
grep -rho 'path: "[^"]*_components[^"]*"' .output/server --include="*.mjs" | sort -u | wc -l

# 確認某頁的實際 path(含大小寫)
grep -rho 'path: "/buy[^"]*"' .output/server --include="*.mjs" | sort -u
```

## 新增頁面時的檢查清單

- [ ] 檔名全小寫、多字用連字號
- [ ] 需要就近放元件時建 `_components/`(會自動註冊成 `Page*` 元件)
- [ ] 若改名既有頁面,grep 舊的路由 name(`router.push({ name: ... })`)
- [ ] build 後用上面的指令確認 path 與預期一致
