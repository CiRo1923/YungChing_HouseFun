---
name: shared-components-sync
description: Backstage 與 Official 共用元件(mForm / mPopup / ImgSrc / SvgIcon)的同步規則 —— 功能必須一致、樣式各自獨立。修改這些元件時必讀。
---

# 共用元件同步規則

## 適用範圍

以下元件在 **Backstage** 與 **Official** 兩個專案都有一份,**功能必須保持一致**:

| 元件    | Backstage                       | Official                        |
| ------- | ------------------------------- | ------------------------------- |
| mForm   | `components/common/mForm/`      | `components/common/mForm/`      |
| mPopup  | `components/common/mPopup/`     | `components/common/mPopup/`     |
| ImgSrc  | `components/common/ImgSrc.vue`  | `components/common/ImgSrc.vue`  |
| SvgIcon | `components/common/SvgIcon.vue` | `components/common/SvgIcon.vue` |

兩專案的路徑相同:
`d:\CiRo\Project\YungChing\Dev\HouseFun\{Backstage,Official}\`

## 核心原則

**功能一致,樣式獨立。**

- **要同步**:`config` 的 key 與預設值、`props` / `emits` 的介面、輸入處理與驗證行為、對外暴露的方法(`defineExpose`)、bug 修正
- **不用同步**:CSS、Tailwind class、`setClass` 的預設 class 字串、版面與色彩

判斷方式:如果改動會讓「同樣的 config 傳進去,行為不一樣」,就要同步。

## 修改流程

1. 在其中一邊改完功能
2. 打開另一邊的同名元件,確認要不要跟著改
3. 若對方的實作結構不同(見下方「已知結構差異」),**不要整包覆蓋** —— 在對方現有架構上補等效功能
4. 兩邊各自跑 `npm run build` 驗證

> `npm run build` 的 exit code 1 是正常的 —— 來自最後的 `sync:public`(找不到發布 repo)。判斷成功看有沒有印出 `✨ Build complete!`。

## 已知結構差異(同步時要繞開的坑)

這兩份程式碼同源但已各自演進,**不能直接複製貼上**:

### mForm 的 composable 分層不同

|          | Backstage                                                                 | Official                                                                            |
| -------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 文字輸入 | `useTextCore.js` —— 較厚,回傳 `model` / `onInput` / `onEnter` / `onClear` | `useInputTextCore.js` —— 很薄,只回傳 `isFocus` / `config` / `setClass`,邏輯留在元件 |
| 下拉     | `useDropdownCore.js`                                                      | `useDropdownCore.js`,多一個 `onDropdownActive`                                      |

`placeholder` / `hasClearButton` 在 Backstage 是定義在 `useTextCore` 的 `textConfigDefault`,不在元件檔裡 —— 用 grep 找元件檔的 config 會誤判成「缺這兩項」。

### 各自獨有的元件(不強求對齊)

- **只有 Backstage 有**:`Dropdown` / `RadioItem` / `Search` / `SelectDropdownOptions` / `SelectMultiple`
- **只有 Official 有**:`AutoComplete` / `Continuous` / `Password` / `Radio` / `SelectDropdown` / `TextArea` / `VerifyCountdown`

只服務單邊獨有元件的 config(例如 Backstage `Select` 的 `dropdownOption`,只給 `SelectDropdownOptions` / `SelectMultiple` 用)**不需要**補到另一邊 —— 補過去沒有消費者。

### CheckBox 的 mode 語意不同

- Backstage:`'boolean' | 'group' | 'value'`,`value` 模式靠 `true-value` / `false-value` 回傳自訂值
- Official:`'group' | 'boolean'`,用 vee-validate 的 `v-bind="field"` 架構

同步功能時在各自架構上加,不要把 model 的 get/set 整包搬過去。

## 待同步清單(2026-08-26 盤點)

已補完:

- Backstage `CheckBox` ← Official 的 `sort` / `isError` / `valueClickClear` / `modelModifiers` / `rules` 型別放寬
- Backstage `Hidden` ← Official 的 `config.length/minlength/maxlength` / `setClass.errorMessage` / `defineExpose({ name })`
- Official `Input` ← Backstage 的 `allowNegative`
- Official `Select` / `VerifyCountdown` 的 `props.cityModifiers` → `props.modelModifiers`(錯字,`v-model.number` 原本完全失效;查過 17 處呼叫端都沒用 `.number`,修正後行為不變)

> 這個錯字是從 `mAddress.vue` 那類「具名 v-model」元件複製過來的 —— 它用 `v-model:city.number`,所以 `props.cityModifiers` 在**那裡**是對的。往單一 v-model 的元件貼過去時要記得改回 `modelModifiers`。

尚未處理(需要決定後再動):

- **Backstage `mAutoComplete`**(在 `components/buy/` 根層,不在 mForm 下)vs Official `mForm/AutoComplete.vue`,四個功能差異:
  1. `onGetInputLabel` 不會回查 options —— `schema.model !== schema.label` 時輸入框會顯示 id 而非名稱
  2. `onInput` / `onCompositionEnd` 沒有 `model.value = label.value` —— 自由輸入不選項目時 v-model 拿不到值
  3. `watch(inputOptions)` 沒有重新定位 dropdown —— 非同步選項回來後高度不會重算
  4. 沒有 `isWaiting` / `waitMessage`(載入中提示)
- **Backstage mForm 的 CSS 還在 `assets/css/_modules/buy/`**,元件已搬到 `components/common/`,位置語意不一致(不影響功能)
