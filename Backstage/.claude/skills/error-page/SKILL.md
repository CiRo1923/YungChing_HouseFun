---
name: error-page
description: 動到錯誤頁、404 導向或分頁參數(pg)防呆前必須先讀。說明 error.vue 為何一定要放在 srcDir 根目錄(放 pages/ 會變成孤兒路由)、本專案的錯誤頁為何可以套 buy layout、pg 的兩層防呆與 404 流程,以及尚未做的頻道判斷。觸發時機 - 要改 error.vue、middleware/pageQuery.global.js、stores/buy/.composables/useListActions.js 的 onApiPOSTRealEstateSearch 的 404 分支;或使用者問到「404 / 錯誤頁 / pg 參數 / 亂打網址 / 頁碼超出範圍」。
---

# 錯誤頁與分頁參數防呆

## error.vue 的位置(踩過的坑)

**Nuxt 的錯誤頁必須放在 srcDir 根目錄** —— 本專案 `pages/`、`components/`、`layouts/` 都在根,
所以 srcDir 就是根,錯誤頁是 `./error.vue`。

原本它放在 `pages/error.vue`,只有一行 `HouseFun Error`。那樣會被當成一般頁面編譯成
`/error` 路由,**`showError` 從來不會用到它** —— 全專案也沒有任何地方導向 `/error`,它是個孤兒。
驗收條目 C-17 記錄的「HouseFun Error 系統錯誤頁」講的就是那個畫面。

**怎麼確認錯誤頁真的生效**:build 後看 `.output`。

- 沒有自訂錯誤頁 → 會出現 Nuxt 內建的 `error-404.*.css` / `error-500.*.css` / `error-404.*.js`
- 有自訂錯誤頁 → 上述 chunk 消失,只剩 `.output/server/chunks/_/error-500.mjs`
  (那是 Nitro 層級的最後防線,Nuxt 整個 render 失敗時才用,永遠都在)

## 本專案的錯誤頁可以套 layout

`error.vue` 用 `<NuxtLayout name="buy">`,有 header / footer,版型與站台一致。

**這在本專案是安全的**:`layouts/buy.vue` 只渲染 header / footer,`components/buy/mHeader.vue`
只依賴 `device`,沒有任何 API 呼叫。

> ⚠ 姊妹專案 Official **不能這樣做** —— 它的 `layouts/buy.vue` 會 `await callOnce(onInit)`
> 打 auth API、SSR 還會預抓 SEO。錯誤頁常常正是 API 出狀況時顯示的,再打一次若又失敗,
> 錯誤頁自己就渲染不出來。Official 的錯誤頁刻意零外部相依。

`clearError` 一定要帶 `redirect` —— 錯誤頁是蓋在原本的路由上的,不帶會留在那個壞掉的網址。

---

## pg 參數的兩層防呆

| 層 | 位置 | 擋什麼 |
|---|---|---|
| 路由 | `middleware/pageQuery.global.js` | 非數字、0、負數、小數、`01` 這種(`String(page) === String(pg)` 擋掉),一律 `replace` 成 `pg=1` |
| API | `stores/buy/.composables/useListActions.js` 的 `onApiPOSTRealEstateSearch` | `queryPage >= 1 ? queryPage : 1`(`NaN >= 1` 為 false,所以 `abc` 也接得住) |

兩層都只防**下界**。上界(`pg=999`)由後端負責:超過最大頁數時 API 回 404,前端在
`status === 404` 分支處理:

```js
// 初次載入是使用者自己輸入了不存在的頁數 → 導向 404 頁;
// 操作後重新查詢(例如把該頁物件全部刪光)不該把人踢出列表 → 退回第 1 頁
if (import.meta.server) {
  showError({ statusCode: 404, statusMessage: '找不到頁面' })
} else {
  await navigateTo({ path: route.path, query: { ...route.query, pg: 1 } }, { replace: true })
}
```

**測 `pg=999` 要在網址列輸入後按 Enter**(走 SSR),在頁面內點連結是 client 端,會走退回第 1 頁那條。

---

## 待辦:錯誤頁的頻道判斷

現在 `onBackClick` 寫死導回 `/buy/list/publish`。

`showError` **不會改變 URL**,所以錯誤頁裡 `useRoute().path` 就是出錯時的路徑,
可以用第一段判斷使用者原本在哪個頻道,讓按鈕導回對應的地方:

```js
const [, channel] = route.path.split('/')
```

⚠ 404 到完全不存在的路由時(例如 `/aaa`),`route.matched` 和 `route.meta` 都是空的,
**只有 `path` 可靠**,不要試圖用 `meta.channel`。

**卡住的原因**:`layouts/rent.vue` 存在,但 `pages/rent` 還沒開發 —— 判斷得出 rent 也沒地方導。
等 rent 頻道做出來再一起處理,屆時把 buy / rent 的入口路徑收成一份對照表即可。
