---
name: error-page
description: 動到錯誤頁或 404 導向前必須先讀。說明 error.vue 為何一定要放在 srcDir 根目錄(放 pages/ 會變成孤兒路由)、為何刻意不套 buy layout,以及尚未做的頻道判斷與各頻道入口的缺口。觸發時機 - 要改 error.vue、layouts/buy.vue 的 onInit;或使用者問到「404 / 錯誤頁 / 亂打網址 / clearError」。
---

# 錯誤頁

## error.vue 的位置(踩過的坑)

**Nuxt 的錯誤頁必須放在 srcDir 根目錄** —— 本專案 `pages/`、`components/`、`layouts/` 都在根,
所以 srcDir 就是根,錯誤頁是 `./error.vue`。

原本它放在 `pages/error.vue`,只有一行 `HouseFun Error`。那樣會被當成一般頁面編譯成
`/error` 路由,**`showError` 從來不會用到它** —— 全專案也沒有任何地方導向 `/error`,它是個孤兒。
(姊妹專案 Backstage 有一模一樣的問題,兩邊同時修掉。)

**怎麼確認錯誤頁真的生效**:build 後看 `.output`。

- 沒有自訂錯誤頁 → 會出現 Nuxt 內建的 `error-404.*.css` / `error-500.*.css` / `error-404.*.js`
- 有自訂錯誤頁 → 上述 chunk 消失,只剩 `.output/server/chunks/_/error-500.mjs`
  (那是 Nitro 層級的最後防線,Nuxt 整個 render 失敗時才用,永遠都在)

## 刻意不套 layout

`error.vue` **不用** `<NuxtLayout name="buy">`,自己畫一個置中版面,維持零外部相依。

原因:`layouts/buy.vue` 會 `await callOnce(onInit)` 打 auth API(`onRestoreAuthToken` /
`onRestoreAccessData` / `onApiAuthMe`),SSR 時還會依 `route.name` 預抓 SEO。
**錯誤頁常常正是 API 出狀況時顯示的** —— 再打一次若又失敗,錯誤頁本身就渲染不出來,
只能落到 Nitro 的兜底畫面,那才是真的難看。

> 姊妹專案 Backstage 的錯誤頁**可以**套 layout:它的 `layouts/buy.vue` 只有 header / footer,
> `mHeader` 只依賴 `device`,沒有 API 呼叫。兩邊的差異是刻意的,不要「統一」掉。

代價是錯誤頁沒有 header / footer。若日後要讓它視覺一致,兩條路:抽一個不打 API 的輕量 layout,
或把 `onInit` 用 try/catch 包起來讓它失敗也不中斷渲染。

`clearError` 一定要帶 `redirect` —— 錯誤頁是蓋在原本的路由上的,不帶會留在那個壞掉的網址。
目前一律導回 `/home`。

---

## 待辦:錯誤頁的頻道判斷

`showError` **不會改變 URL**,所以錯誤頁裡 `useRoute().path` 就是出錯時的路徑,
可以用第一段判斷使用者原本在哪個頻道,讓按鈕導回對應的地方:

```js
const [, channel] = route.path.split('/')
```

⚠ 404 到完全不存在的路由時(例如 `/aaa`),`route.matched` 和 `route.meta` 都是空的,
**只有 `path` 可靠**,不要試圖用 `meta.channel`。

各頻道的入口現況:

| 頻道 | 入口 | 狀態 |
|---|---|---|
| `rent` / `newhouse` / `news` / `community` / `price` / `home` | 有 `index.vue` | 可直接導 `/rent`、`/newhouse`… |
| `buy` | **沒有 index** —— 只有 `house` / `list` / `_components` | 導 `/buy` 會 404,入口路徑待定,**暫不處理** |
| `member` | **沒有 index** —— 只有 `login` / `register` / `upgrade` | 預計導向個人資料頁,**但該頁還沒製作** |

buy 與 member 的目的地確定後再一起收成對照表。在那之前維持一律回 `/home`。
