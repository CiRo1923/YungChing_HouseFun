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
| `pages/member/forget/_components/` | Header / Note + index、reset、complete 三個 Content |
| `components/member/mStep/Oval.vue` | 步驟指示器,`_modules/member/mStep/` 是 member 頻道目錄的第一支 |
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
**超限也是回 400 帶 `message`** —— 兩支的回應只列 200 / 400,沒有 429。
400 的結構是共用的 `MemberAuthErrorResponse`:
`code` / `message` / `details` / `failedAttempts` / `remainingAttempts` / `unlockAt`。

### 待後端確認

1. **`verificationChannel` 到底傳什麼** —— 目前傳字串 `'sms'`(值集中在 store 的
   `verificationChannels`),當初判斷 swagger 寫成 integer 是轉譯錯誤。
   **2026-09-04 對照更新後的 swagger,那個欄位仍然是 `integer` 的 enum `[0, 1]`。**
   若規格才是對的,現在送出去會 400 —— 要跟後端確認,不要自己改值。
2. **重送倒數吃 `expireAt`** —— 規格寫 60 秒冷卻,但 200 只回 token 的到期時間。
   `resendAvailableAt`(可重送時間)確實存在於 swagger,但**只在會員升級與註冊的回應**,
   忘記密碼這支沒有。要問後端補不補;補了就把 `verify.countdownData.expires` 改吃它。
3. **`developmentVerificationCode`(2026-09-04 新增)** —— develop 模式開啟時
   200 會回傳測試用驗證碼,不寄簡訊。目前程式沒有用它。要不要在開發環境自動帶入,
   是新行為,等指示。

> **驗證碼錯誤的判斷已經有依據了**(原本列為暫時做法)——
> swagger 現在明寫 `failedAttempts` / `remainingAttempts`「僅驗證碼錯誤時回傳」,
> 所以「有沒有帶次數」就是正確的判準,不必等 `code` 的列舉值。
> (`unlockAt` 的說明是「Email 每 24 小時寄送上限達標時回傳」,手機這條流程未必會帶,程式沒用到它。)

錯誤呈現一律走 mForm 內建那套(`--error` 紅框 + `m-form-error`),
**設計稿的錯誤樣式是錯的,不要照抄**,比照 member 其他單元即可。

## 等使用者處理的項目

| # | 項目 | 現況 | 誰處理 |
|---|---|---|---|
| 1 | 忘記密碼的入口 | `containers/login/Note.vue` 只有「立即註冊」與「MAIL 會員升級」,**沒有任何連到 `/member/forget` 的地方** —— 現在只能手打網址 | 使用者會再確認要放哪、文案叫什麼 |

> 步驟指示器、三個 icon、完成頁插圖、按鈕文案(兩步都用「下一步」)都已完成,
> 設計稿 p57 與 p50 / p55 的不一致也定案照 p57 走 —— 這些已從清單移除,細節看 git log。
