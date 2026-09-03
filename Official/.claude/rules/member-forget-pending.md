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
| `stores/member/forget.js` | 欄位照 swagger,`verify` / `resetPassword` 兩段 |
| `stores/member/.composables/useForgetActions.js` | 兩支 API、cookie 工具、驗證碼錯誤的出口都接好了 |
| `scripts/_api/member/forget.js` | 兩支 C 端 API |
| `scripts/_storage.js` | 新增 `FORGETRESET`(效期跟 `expireAt`)、`FORGETCOMPLETE`(短效,完成頁憑證) |

## API(`.apiJson/swagger.json`)

C 端只有兩支;`app/password-reset/*` 那三支是舊版 App 用的,**不要接**。

| API | 送出 | 回傳 |
|---|---|---|
| `POST /member/auth/password-reset/request` | `mobilePhone`、`verificationChannel` | `success`、`resetToken`、`expireAt`、`message` |
| `POST /member/auth/password-reset/confirm` | `mobilePhone`、`verificationCode`、`resetToken`、`newPassword`、`confirmPassword` | `success`、`requireRelogin`、`message` |

**驗證碼是 confirm 才驗的**,`request` 只發碼 —— 所以步驟 1 的「下一步」只能檢查格式。
**已定案:維持三頁,confirm 回驗證碼錯誤時導回步驟 1 並帶出錯誤訊息。**

發送限制與註冊驗證共用 60 秒冷卻 + 手機每日 / IP 每小時上限;
400 會帶 `failedAttempts` / `remainingAttempts` / `unlockAt`,結構同 upgrade。

**`verificationChannel` 帶字串** —— swagger 寫成 integer 0 / 1 是轉譯錯誤。
目前一律 `'sms'`,未來可能發 LINE,值集中在 store 的 `verificationChannels`。

### 兩個暫時的做法,拿到後端答案就改

1. **重送倒數吃 `expireAt`** —— 規格寫 60 秒冷卻,但 200 只回 token 的到期時間,
   沒有 `resendAvailableAt` 那種「可重送時間」欄位(upgrade 那條流程有)。
   **要問後端補不補這個欄位**;補了就把 `verify.countdownData.expires` 改吃它。
2. **驗證碼錯誤靠「有沒有帶 `failedAttempts` / `remainingAttempts`」判斷** ——
   400 有 `code` 欄位但 swagger 沒列舉值。實際看到 code 之後改成比對 code 會更準
   (現在的判斷若失準,會變成密碼格式錯誤也把人踢回步驟 1)。

錯誤呈現一律走 mForm 內建那套(`--error` 紅框 + `m-form-error`),
**設計稿的錯誤樣式是錯的,不要照抄**,比照 member 其他單元即可。

## 等使用者處理的項目

| # | 項目 | 現況 | 誰處理 |
|---|---|---|---|
| 1 | 步驟指示器要移到 `components/member/` | 暫放 `pages/member/forget/_components/Steps.vue`(頁面內元件,直接寫 tailwind) | 使用者正在做模型,**做完會回來要求調整** —— 移過去時 class 與 module 要照 css-conventions 拆(`components/` 的 template 不能有 tailwind),並且會是 `_modules/member/` 這個新頻道目錄的第一支 |
| 2 | 缺兩個 icon:設計稿的「手機裝置」與「鎖」 | `_svg/` 沒有,暫用 `icon_phone`(其實是聽筒)與 `icon_certification`,已標 TODO。第三步的實心圓 + 白勾是用 `icon_check_solid` 包圓底做出來的 | 使用者會補 svg 進 `_svg/` |
| 3 | ~~停用狀態的淡橘按鈕色票~~ | **已定案:不補。** 設計稿那個淡橘是錯的,按鈕一律用現有的 `--bg-orange-f74c`,按下去才驗證(等同 upgrade 既有做法) | — |
| 4 | 完成頁插圖 | 暫時沿用註冊完成頁的 `member/register/complete/icon_complete.svg` | 使用者會再提供 |
| 5 | ~~接 API~~ | **已接完**,三頁都走 store,middleware 也補了(步驟 2 看 `FORGETRESET`、步驟 3 看 `FORGETCOMPLETE`,沒有就退回步驟 1)。剩下上面那兩個暫時做法要問後端 | 待後端回覆重送冷卻欄位與 400 的 code |
| 6 | 設計稿內部不一致 | p57 是重設密碼頁,但按鈕寫「下一步」又沒有 ⓘ 提示行,和 p50 / p55 的「確定修改」+「請設定新密碼」對不上 —— 目前照 p50 / p55 做 | 使用者會再確認 |
| 7 | 忘記密碼的入口 | `containers/login/Note.vue` 只有「立即註冊」與「MAIL 會員升級」,沒有連到 `/member/forget` 的入口 | 使用者會再確認要放哪 |
