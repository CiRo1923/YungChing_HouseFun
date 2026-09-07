---
name: shared-components-sync
description: Backstage 與 Official 共用元件(mForm / mPopup / ImgSrc / SvgIcon)的同步規則 —— 功能必須一致、樣式各自獨立。修改這些元件時必讀。
---

# 共用元件同步規則

## 適用範圍

以下元件在 **Backstage** 與 **Official** 兩個專案都有一份,**功能必須保持一致**:

| 元件 | Backstage | Official |
| --- | --- | --- |
| mForm | `components/common/mForm/` | `components/common/mForm/` |
| mPopup | `components/common/mPopup/` | `components/common/mPopup/` |
| ImgSrc | `components/common/ImgSrc.vue` | `components/common/ImgSrc.vue` |
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

> `npm run build` 最後會接 `sync:public`。找不到發布 repo 時它**印警告後跳過、回 exit 0**(2026-09-07 改;在那之前是 exit 1,舊的紀錄說「exit code 1 是正常的」已不成立)。所以現在 **exit code 非零就是真的有問題**,不要放過。

## ⚠️ 驗證時機:「碰過才即時驗」(2026-09-07,兩邊一致)

這是 mForm 全系列的行為契約,**兩邊的 `validateEvents` 預設與 `useValidateEvents`
必須保持一致**。改動它就是改全站表單的手感,不要只改一邊。

| 元件類別 | 預設 |
| --- | --- |
| 一般欄位(Input / Select / Hidden / AutoComplete / TextArea …) | `['blur', 'change', 'touchedModelUpdate']` |
| 勾選類(CheckBox / Radio / RadioItem / RadiosOval) | `['touchedModelUpdate']` |

`touchedModelUpdate` 是**本專案自訂的 token**(不是 vee-validate 的):
「值一動就驗」只在該欄位 **touched 之後**才生效。它解掉的是三種誤報 ——
多欄位合成的 computed 填到一半、程式自己連動清值、radio 切換讓一組欄位顯示出來。

### ⛔ 新增送出點時一定要呼叫 setTouched(true)

**這是最容易漏、而且漏了不會報錯的一件事。** touched 只有兩個來源:

| 來源 | 誰負責 |
| --- | --- |
| blur | vee-validate 的 `handleBlur` 自己會做,不必管 |
| 送出 | **要自己呼叫** `setTouched(true)` |

漏了的後果:送出跳紅字後,使用者去補填,**紅字不會即時消失**(得等下一次送出)。
畫面看起來只是「有點鈍」,不會有任何錯誤訊息。

兩種寫法,看那一頁的表單怎麼組:

```js
// Form 的 slot 型 —— 從 slot 取出來,傳進送出函式
// <Form v-slot="{ validate, setTouched }">
const onSumit = async (validate, setTouched) => {
  setTouched(true)
  const { valid } = await validate()
  // …
}

// formRef 型 —— <Form> 的 expose 就有 setTouched
const validate = async () => {
  formRef.value?.setTouched?.(true)

  return await formRef.value?.validate?.()
}
```

> ⚠️ **不要改用 vee-validate 的 `submitCount` 判斷** —— 兩邊的送出都是手動呼叫
> slot 的 `validate()`,不是 `handleSubmit`,`submitCount` 永遠是 0。
> (`handleSubmit` 內建就會 touch 全部欄位,但改用它等於重寫所有頁面的送出流程。)

### 元件端的注意事項

`useValidateEvents(source, fieldName)` 的第二個參數是**這個元件註冊給 vee-validate
的名稱**,拿來查 touched。傳錯或不傳,那個欄位就永遠是「還沒碰過」(dev 會警告)。

名稱不一定等於 `props.name`:

| 元件 | 要傳什麼 |
| --- | --- |
| 多數元件 | `() => props.name` |
| Hidden | `() => \`${props.name}_hidden\`` |
| RadiosOval | `() => \`${props.name}_radios\`` |
| 一個元件有多個 Field | 傳陣列,語意是「任一個碰過就算」 |

⚠️ **轉手型元件**(自己不掛 Field、把 config 往下傳的,如 Official 的 Continuous /
VerifyCountdown)的預設**要跟著子元件走** —— 傳 `null` 會蓋掉子元件的預設,
讓機制退回「值一動就驗」。

## 已知結構差異(同步時要繞開的坑)

這兩份程式碼同源但已各自演進,**不能直接複製貼上**:

### mForm 的 composable 分層不同

| | Backstage | Official |
| --- | --- | --- |
| 文字輸入 | `useTextCore.js` —— 較厚,回傳 `model` / `onInput` / `onEnter` / `onClear` | `useInputTextCore.js` —— 很薄,只回傳 `isFocus` / `config` / `setClass`,邏輯留在元件 |
| 下拉 | `useDropdownCore.js` | `useDropdownCore.js`,多一個 `onDropdownActive` |

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
