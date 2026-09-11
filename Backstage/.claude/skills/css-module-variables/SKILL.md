---
name: css-module-variables
summary: css 模組變數
description: 本專案的 CSS 模組變數分層規範。當需要在 CSS 模組目錄新增或調整樣式、加入 --px-XX / --py-XX / --h-XX / --rounded-XX 這類可由父層覆寫的尺寸級距,或審查既有模組 css 時使用。規則:同一屬性有兩個以上級距值的覆寫 class 一律定義在 ***Variables.css(單一值可留在模組 css);作用域依實際共用範圍決定,只有這個模組用的放該模組的 Variables 檔、跨模組共用的放共用 variables.css。
---

# CSS 模組變數分層:值進 Variables、樣式留模組

CSS 模組目錄(位置定義在 `.tools/lint/project-config.mjs` 的 `CSS_MODULES_DIR`)
底下的每個模組,都成對存在兩種檔案:

| 檔案 | 放什麼 |
| --- | --- |
| `***Variables.css` | `:root` 的**原始值** + **級距覆寫 class**(同一屬性有多個可選值者) |
| `***.css`(模組樣式) | **樣式規則**(顏色、圓角、排版)+ **斷點變數對應**(`--x: var(--x-pc)`) |

判準是**「這個屬性有幾個可選值」**:

- **兩個以上** → 是一組級距,覆寫 class 必須寫在 `***Variables.css`。
- **只有一個固定值** → 直接寫在模組 css 即可,不需要抽出來。

## 一、作用域:依實際共用範圍決定

跟色票的分層邏輯一致 —— **共用的放共用檔,專屬的放專屬檔**:

- **跨模組共用** → 共用變數檔(位置定義在 `.tools/lint/project-config.mjs` 的
  `SHARED_MODULE_VARIABLES`,規則的提示訊息會直接寫出實際檔名)。
  例:`--form-element-px`(`--px-20` / `--px-15` / `--px-10`)、`--form-element-h`、
  `--form-element-rounded`,input / select / textarea 都吃同一組。
- **模組專屬** → 該模組的 `***Variables.css`。
  例:`--form-selection-box-px` / `-py` 只有 checkbox / radio 的 `isBox` 用得到,
  input / select 沒有盒狀樣式,所以定義在 `selectionVariables.css`,不放共用檔。

判斷方式:先看這組級距是否真的會被其他模組使用。**只有一個模組用就放模組專屬**,
不要為了「以後可能會用」提前放進共用檔。

## 二、寫法

```css
/* selectionVariables.css —— 原始值 + 級距覆寫 */
:root {
  --form-selection-box-pc-px: 0px;
  --form-selection-box-tablet-px: 0px;
  --form-selection-box-mobile-px: 0px;
}

@screen p {
  .m-form-element {
    &.\-\-checkbox,
    &.\-\-radio {
      &.\-\-px-24,
      &.p\:\-\-px-24,
      &.pt\:\-\-px-24 {
        --form-selection-box-px: 24px;
      }

      &.\-\-px-15,
      &.p\:\-\-px-15,
      &.pt\:\-\-px-15 {
        --form-selection-box-px: 15px;
      }
    }
  }
}
```

```css
/* selection.css —— 樣式 + 斷點對應 */
.m-form-element {
  &.\-\-checkbox,
  &.\-\-radio {
    &.\-\-box {
      @apply w-full rounded-[--form-selection-box-rounded] px-[--form-selection-box-px] py-[--form-selection-box-py];
    }
  }
}

@screen p {
  .m-form-element {
    &.\-\-checkbox,
    &.\-\-radio {
      --form-selection-box-px: var(--form-selection-box-pc-px);
    }
  }
}
```

### 斷點前綴的完整寫法

每個級距在三個 `@screen` 都要列出,且各自涵蓋會命中該斷點的所有前綴:

| 斷點 | 需列出的變體 |
| --- | --- |
| `@screen p` | `--px-24`、`p:--px-24`、`pt:--px-24` |
| `@screen t` | `--px-24`、`pt:--px-24`、`tm:--px-24`、`t:--px-24` |
| `@screen m` | `--px-24`、`tm:--px-24`、`m:--px-24` |

## 三、為什麼分開放不會壞

級距覆寫比斷點預設對應**多一個 class**,specificity 較高:

- 斷點對應 `.m-form-element.--radio` → `0,2,0`
- 級距覆寫 `.m-form-element.--radio.--px-24` → `0,3,0`

所以即使 `***Variables.css` 比模組 css **先**載入,級距仍然勝出,**不受 import 順序影響**。

## 四、使用端

級距 class 由元件的 `setClass` 傳入,對應到 CSS 的覆寫規則:

```html
<MFormRadio
  :config="{ isBox: true }"
  :setClass="{ element: 'p:--px-15 p:--py-24 tm:--px-10 tm:--py-15' }"
/>
```

**沒有傳就是 `:root` 的預設值**(box 的 padding 預設 `0`)。因此不需要 `--px-0` /
`--py-0` 這種級距 —— 不傳即為 0。

## 五、新增級距的檢查清單

1. 這個屬性目前有幾個值?**兩個以上**才需要進 Variables 檔。
2. 只有這個模組會用嗎?是 → `***Variables.css`;跨模組 → 共用變數檔
   (位置定義在 `.tools/lint/project-config.mjs` 的 `SHARED_MODULE_VARIABLES`)。
3. 三個 `@screen` 都補齊了嗎?各自的前綴變體都列了嗎?
4. 值本身是否已存在於同組級距?避免同一屬性出現重複或過於接近的級距。

## 六、自動檢查

規則 `moduleVar`,判斷邏輯在 `.tools/lint/lint-core.mjs`,
四個時機跑的是同一份判斷:

- **存檔時** —— 編輯器與開發伺服器會即時檢查,違規逐筆印在終端機。只提醒,不影響存檔。
- **AI 寫檔時** —— `.claude/hooks/enforce-conventions.cjs` 比對寫入前後的內容,
  只擋「這次新增」的違規;既有存量不影響。
- **對話時** —— 存檔時沒修掉的違規會列進對話,直到修好為止。
- **commit 時** —— pre-commit 檢查這次提交的檔案。

本機覆核:`node .tools/lint/lint.mjs <檔案或目錄>`。

判定方式:非 Variables 檔裡,同一屬性出現**兩個以上不同值**的覆寫 class
(例如同時有 `--px-24` 與 `--px-15`)就要搬到對應的 `***Variables.css`。

不算違規的情況:`***Variables.css` 與 `variables.css` 本身、單一值的覆寫 class、
以及值不是數字的狀態 modifier(`--range-start` 這種是狀態不是尺寸級距)。

## 相關

- [[color-naming]]:顏色變數的集中定義與命名規範,分層邏輯相同(共用 / 專屬)。
