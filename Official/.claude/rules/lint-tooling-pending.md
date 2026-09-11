# 規範檢查工具 —— stores / api / pages 三支還沒做

2026-09-09 決定把自動檢查從「只有 CSS」擴充到四個面向:**stores / api / css / pages**。
`css` 那支已經完整([css-conventions.md](./css-conventions.md)、`.tools/lint/`),
另外三支**還沒開始,因為規則還沒定**。

> ⚠️ 這份放在版控裡,是因為規則可能從**另一台電腦**給進來 ——
> Claude 的本機記憶(`~/.claude/projects/.../memory/`)不跨電腦,不要依賴它。
> 完成的項目直接從這裡刪掉,不要留「已完成」的記錄,git log 才是歷史。

## 現在卡在哪

**規則由使用者提供,不可以自己發明**(見 [no-assumption.md](./no-assumption.md))。
既有文件只涵蓋一部分,不足以直接轉成檢查:

| 面向 | 現有文件 | 已經寫死、可直接轉成檢查的部分 |
|---|---|---|
| **stores** | `.claude/skills/store-conventions/`(**只有 Official 有,Backstage 沒有這支 skill**) | Actions 內不得宣告常數;檔案內排列順序(composable → 所有 `onApiXxx` → helper → `reset` → `return`);API action 一律回傳 `{ config, status, data }`;狀態判斷用 `else if` 串接,不用排除清單 |
| **api** | 沒有獨立文件 | 只有 store-conventions 提到「header 型參數走第二個 `config` 參數,不塞 body」 |
| **pages** | `.claude/skills/routing-conventions/`(兩邊都有) | 路由檔名全小寫、多字用連字號;`_components/` 內元件 PascalCase;`_components` 不得產生路由 |

`.vue` 的 `<script setup>` import 順序目前掛在 **CSS 那支**(規則 5 `checkImportOrder`)——
要不要搬到 pages 那支,也還沒決定。

## 給規則時要附的四件事

照 CSS 那套的經驗,一條規則要能落地必須講清楚:

1. **抓什麼寫法** —— 錯誤範例
2. **正確寫法** —— 修正後長怎樣
3. **掃描範圍** —— 哪些路徑 / 副檔名;哪些路徑豁免
4. **豁免標記** —— 真的有例外時怎麼標(比照 `lint-breakpoint-exempt` / `lint-same-value`)

## 要落地成什麼形狀

照 `.tools/lint/` 的板,每個面向一組:

```
.tools/<area>/lint-core.mjs     判斷邏輯(只判斷,不輸出也不改檔)
.tools/<area>/lint-<area>.mjs   CLI(可指定路徑、支援 --json)
.tools/<area>/self-test.mjs     規則自我驗證(每條規則:違規案例 + 合法案例各一)
```

- `package.json` 加 `lint:<area>` 與 `test:<area>`
- 掛進 `.githooks/pre-commit` 與兩支 hook(`css-guard.js` / `css-guard-prompt.js`)的分派 ——
  或改成依副檔名 / 路徑分派到各面向
- `colors.mjs` 共用(非 TTY 自動關色)

**Official 與 Backstage 各一份複本,內容要同步** —— 與 CSS 那套一樣是各自的複本,
不會自動同步,改一邊要記得回頭對照另一邊。

## 完成的定義

三支都做完後,兩邊都要跑過:`npm run lint:<area>`、`npm run test:<area>`、`npm run build`。
