# 刪掉但保留的組件 —— 要用時從 git 撈回來,不要重寫

2026-08-28 清掉五支**當下完全沒有使用端**的 buy 組件。
判斷標準是「現在沒人用」,**不是「這個功能不需要」** ——
它們的實作都是完整可用的,只是還沒接上頁面。

| 組件 | 內容 | 之後想做什麼會用到 |
|---|---|---|
| `components/buy/mItem/SwitchItem.vue` | 可展開收合的項目,含遮罩高度計算(`maskRows` 控制收合時顯示幾行、`hasMask` 支援 p / t / m 分別設定) | **可展開的清單項目** |
| `components/buy/mItem/Main.vue` | 被 SwitchItem 使用 | 同上 |
| `components/buy/mItem/Container.vue` | 被 Main 使用 | 同上 |
| `components/buy/mAccordion/Content.vue` | 空殼 —— `m-accordion-*` 連 CSS 都不存在,`<style>` 是空的 | (參考價值低) |
| `components/buy/mDialog.vue` | 氣泡對話框,有 `--arrow-bottom` / `--arrow-right` 箭頭(用 border 畫,pc 8px 9px 0、tablet / mobile 4px 5px 0)與 `--px-*` / `--h-*` modifier | **氣泡提示框** |

## 怎麼撈回來

```powershell
# 找到刪除那次 commit
git log --diff-filter=D --name-only -- "Official/components/buy/mItem/*"

# 直接取出當時的檔案內容(注意 commit 後面的 ^ —— 要刪除「之前」的版本)
git show <commit>^:Official/components/buy/mItem/SwitchItem.vue
```

## 撈回來之後

**不要照原樣貼回去** —— 那些檔案是舊寫法(template 帶 tailwind、樣式留在 `<style>`),
要照 [css-conventions.md](./css-conventions.md) 重拆:

- `SwitchItem` 是 **mItem 的變體**(檔案在 `components/buy/mItem/` 底下),
  所以 module 放 `_modules/buy/mItem/`、檔名 `switchItem.css` / `switchItemVariables.css`、
  class 收斂成 **`m-item-switch-*`**(不是 `m-switch-item-*`)。
- `mDialog` 的箭頭尺寸三個斷點不同,拆成 `--dialog-arrow-pc-*` / `-tablet-*` / `-mobile-*`。

> ⚠️ 這份清單要跟著 git 走才有意義 —— 換一台電腦、換一個人接手都看得到。
> Claude 的本機記憶(`~/.claude/projects/.../memory/`)**不會跨電腦**,別依賴它。
