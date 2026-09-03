# 忘記密碼流程 —— 還沒處理的事情

2026-09-03 依設計稿(買屋.pdf p48~p58)建好 `pages/member/forget/` 的三頁與元件,
但有一批事情**由使用者那邊決定或提供**,還沒完成。這份清單放在版控裡,
換電腦、換人接手都看得到 —— Claude 的本機記憶不跨電腦,不要依賴它。

> 完成的項目直接從這裡刪掉,不要留「已完成」的記錄 —— git log 才是歷史。

## 目前的檔案

| 檔案 | 狀態 |
|---|---|
| `pages/member/forget/index.vue` | 步驟 1 手機驗證,`/member/forget` |
| `pages/member/forget/reset.vue` | 步驟 2 重設密碼,`/member/forget/reset` |
| `pages/member/forget/complete.vue` | 步驟 3 設定完成,`/member/forget/complete` |
| `pages/member/forget/_components/` | Header / Steps / Note + index、reset、complete 三個 Content |
| `stores/member/forget.js` | **空殼**,欄位等 API |
| `stores/member/.composables/useForgetActions.js` | **空殼**,只有 `reset` |
| `scripts/_api/member/forget.js` | **空的**,三支 API 都還沒有 |

錯誤呈現一律走 mForm 內建那套(`--error` 紅框 + `m-form-error`),
**設計稿的錯誤樣式是錯的,不要照抄**,比照 member 其他單元即可。

## 等使用者處理的項目

| # | 項目 | 現況 | 誰處理 |
|---|---|---|---|
| 1 | 步驟指示器要移到 `components/member/` | 暫放 `pages/member/forget/_components/Steps.vue`(頁面內元件,直接寫 tailwind) | 使用者正在做模型,**做完會回來要求調整** —— 移過去時 class 與 module 要照 css-conventions 拆(`components/` 的 template 不能有 tailwind),並且會是 `_modules/member/` 這個新頻道目錄的第一支 |
| 2 | 缺兩個 icon:設計稿的「手機裝置」與「鎖」 | `_svg/` 沒有,暫用 `icon_phone`(其實是聽筒)與 `icon_certification`,已標 TODO。第三步的實心圓 + 白勾是用 `icon_check_solid` 包圓底做出來的 | 使用者會補 svg 進 `_svg/` |
| 3 | ~~停用狀態的淡橘按鈕色票~~ | **已定案:不補。** 設計稿那個淡橘是錯的,按鈕一律用現有的 `--bg-orange-f74c`,按下去才驗證(等同 upgrade 既有做法) | — |
| 4 | 完成頁插圖 | 暫時沿用註冊完成頁的 `member/register/complete/icon_complete.svg` | 使用者會再提供 |
| 5 | API 與 store | 三支頁面的表單 model 還是頁面內的 `ref`;store / actions / api 三個檔案都是空殼;步驟 2、3 的 middleware(未經上一步直接進來要退回)也還沒寫,等 token 規格 | 使用者會提供 API 資料 |
| 6 | 設計稿內部不一致 | p57 是重設密碼頁,但按鈕寫「下一步」又沒有 ⓘ 提示行,和 p50 / p55 的「確定修改」+「請設定新密碼」對不上 —— 目前照 p50 / p55 做 | 使用者會再確認 |
| 7 | 忘記密碼的入口 | `containers/login/Note.vue` 只有「立即註冊」與「MAIL 會員升級」,沒有連到 `/member/forget` 的入口 | 使用者會再確認要放哪 |
