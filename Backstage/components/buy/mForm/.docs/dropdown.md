# Dropdown.vue

`Dropdown.vue` 是 mForm 的自訂 dropdown 欄位。它保留 dropdown shell 的定位與開關邏輯，同時接上 `v-model`、`vee-validate`、placeholder、錯誤狀態與 suffix。

## 參考來源

- 元件：`components/buy/mForm/Dropdown.vue`
- 共用邏輯：`components/buy/mForm/.composables/useDropdownCore.js`
- 驗證：`vee-validate` 的 `Field` / `ErrorMessage`
- 動畫：`<Transition name="dropdown" @before-leave="onCloseDropdown" appear>`

## 目前結構

元件已先補上 `useDropdownCore` 需要的核心狀態：

- `elenemtRef`：觸發元素，提供 dropdown 定位基準。
- `config`：合併 dropdown 預設設定與外部傳入設定。
- `setClass`：合併預設 class key 與外部傳入 class。
- `model`：透過 `modelValue` / `update:modelValue` 雙向綁定目前顯示值。
- `placeholder`：把字串或物件格式統一成 `{ value, isToOption }`。
- `isActive`：控制 dropdown 是否掛載。
- `isFocus`：控制觸發元素 focus 樣式。
- `isOpen`：dropdown 定位與高度計算完成後設為 true，用來補開啟狀態 class。
- `onCloseDropdown`：離場動畫結束後關閉 dropdown。
- `dropdownRef` / `dropdownContainerRef` / `dropdownBodyRef`：提供定位、高度與捲動計算使用。
- 外部點擊與視窗 resize 事件：開啟後可點擊外部關閉，視窗尺寸變更時重新定位。

## Props

| 名稱 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `name` | `String` | `null` | vee-validate 欄位名稱。 |
| `modelValue` | `String` / `Number` / `Boolean` / `Object` | `null` | 目前欄位值。 |
| `modelModifiers` | `Object` | `{}` | 支援 `number` modifier，空字串會轉成 `null`。 |
| `config` | `Object` | `{}` | dropdown 設定。 |
| `rules` | `Object` | `null` | vee-validate rules。 |
| `setClass` | `Object` | `{}` | 外部覆寫 class。 |

## config 預設值

```js
{
  arrowType: 'caret',
  placeholder: null,
  isDisabled: false,
  isError: false,
  position: 'auto'
}
```

### config.arrowType

- `caret`：顯示 `CommonSvgIcon` 的 `caret_large_down`。
- `arrow`：顯示 CSS 三角形 `.m-form-icon-arrow`。

## setClass key

```js
{
  main: '',
  container: '',
  element: '',
  type: '',
  icon: '',
  suffix: '',
  error: '',
  dropdown: '',
  dropdownContainer: '',
}
```

## Slots

### `suffix`

欄位右側輔助內容，會渲染在 `.m-form-suffix`。

### `dropdownHeader`

dropdown container 上方區塊。

### `dropdown`

dropdown body 內的內容。卷軸掛在 `.m-form-dropdown-body.scrollbar.--y`，`useDropdownCore` 會在需要限制高度時把高度寫到 body，再用 container 內容高度回寫外層 dropdown。

### `dropdownFooter`

dropdown container 下方區塊。

需要 dropdown 與觸發元素之間的間距時，請加在 `.m-form-dropdown` / `dropdownRef` 外層，不要加在 `.m-form-dropdown-container`，避免內層 margin 被外層 `overflow-hidden` 裁切。

不要在 `dropdownContainer` 或 `.m-form-dropdown-body` 上加 `max-height: 100%` / `max-h-full`，否則會被父層動畫高度限制，導致 `scrollHeight` 量到被裁切後的高度。

## defineExpose

元件目前 expose 下列值，方便外層接入觸發元素與控制 dropdown：

- `elenemtRef`
- `dropdownRef`
- `dropdownContainerRef`
- `dropdownBodyRef`
- `dropdownItemRef`
- `isActive`
- `isFocus`
- `isOpen`
- `onSwitchActive`
- `onDropdownOpen`
- `onElementClick`
- `onSelectResize`
- `isDropdownOutside`

## 使用範例

```vue
<BuyMFormDropdown
  name="customDropdown"
  v-model="dropdownValue"
  :config="{ placeholder: '請選擇' }"
>
  <template #suffix>
    <span>單位</span>
  </template>

  <template #dropdownHeader>
    <p>標題</p>
  </template>

  <template #dropdown>
    <button type="button" class="m-form-dropdown-button" @click="dropdownValue = '選項一'">
      選項一
    </button>
    <button type="button" class="m-form-dropdown-button" @click="dropdownValue = '選項二'">
      選項二
    </button>
  </template>

  <template #dropdownFooter>
    <button type="button">套用</button>
  </template>
</BuyMFormDropdown>
```

## 樣式與動畫

`Dropdown.vue` 直接引入：

```vue
<style src="@css/_modules/buy/mForm.css"></style>
<style src="@css/_modules/buy/mFormDropdown.css"></style>
<style lang="postcss">
@import '@css/_common/vueTransition.css';
</style>
```

dropdown 外層會套上 `--open`：

```vue
<div class="m-form-dropdown --dropdown" :class="[setClass.dropdown, { '--open': isOpen }]">
```

## CSS Variables

下拉選單樣式集中在 `assets/css/_modules/buy/mFormDropdown.css`，其中 `:root` 提供 Select icon、dropdown 外層、container、options、item、button、icon、label、footer 的預設變數。

```css
:root {
  --form-select-icon-arrow-pc-p: 2px;
  --form-select-icon-arrow-tablet-p: 2px;
  --form-select-icon-arrow-mobile-p: 2px;

  --form-select-icon-arrow-pc-size: 14px;
  --form-select-icon-arrow-tablet-size: 14px;
  --form-select-icon-arrow-mobile-size: 14px;

  --form-dropdown-pc-my: 8px;
  --form-dropdown-tablet-my: 8px;
  --form-dropdown-mobile-my: 8px;

  --form-dropdown-pc-rounded: 5px;
  --form-dropdown-tablet-rounded: 5px;
  --form-dropdown-mobile-rounded: 5px;

  --form-dropdown-pc-border: 1px;
  --form-dropdown-tablet-border: 1px;
  --form-dropdown-mobile-border: 1px;

  --form-dropdown-pc-shadow: 0 3px 3px 0px #0000001f;
  --form-dropdown-tablet-shadow: 0 3px 3px 0px #0000001f;
  --form-dropdown-mobile-shadow: 0 3px 3px 0px #0000001f;

  --form-dropdown-container-pc-px: 16px;
  --form-dropdown-container-tablet-px: 16px;
  --form-dropdown-container-mobile-px: 16px;

  --form-dropdown-container-pc-py: 16px;
  --form-dropdown-container-tablet-py: 16px;
  --form-dropdown-container-mobile-py: 16px;

  --form-dropdown-header-pc-mb: 8px;
  --form-dropdown-header-tablet-mb: 8px;
  --form-dropdown-header-mobile-mb: 8px;

  --form-dropdown-options-pc-gap-y: 8px;
  --form-dropdown-options-tablet-gap-y: 8px;
  --form-dropdown-options-mobile-gap-y: 8px;

  --form-dropdown-item-pc-border-bottom: 0;
  --form-dropdown-item-tablet-border-bottom: 0;
  --form-dropdown-item-mobile-border-bottom: 0;

  --form-dropdown-button-pc-px: 8px;
  --form-dropdown-button-tablet-px: 8px;
  --form-dropdown-button-mobile-px: 8px;

  --form-dropdown-button-pc-py: 12px;
  --form-dropdown-button-tablet-py: 12px;
  --form-dropdown-button-mobile-py: 12px;

  --form-dropdown-button-pc-rounded: 5px;
  --form-dropdown-button-tablet-rounded: 5px;
  --form-dropdown-button-mobile-rounded: 5px;

  --form-dropdown-button-pc-gap-x: 3px;
  --form-dropdown-button-tablet-gap-x: 3px;
  --form-dropdown-button-mobile-gap-x: 3px;

  --form-dropdown-icon-pc-p: 2px;
  --form-dropdown-icon-tablet-p: 2px;
  --form-dropdown-icon-mobile-p: 2px;

  --form-dropdown-icon-pc-size: 16px;
  --form-dropdown-icon-tablet-size: 16px;
  --form-dropdown-icon-mobile-size: 16px;

  --form-dropdown-label-pc-text: 16px;
  --form-dropdown-label-tablet-text: 16px;
  --form-dropdown-label-mobile-text: 16px;

  --form-dropdown-footer-pc-mt: 8px;
  --form-dropdown-footer-tablet-mt: 8px;
  --form-dropdown-footer-mobile-mt: 8px;

  --form-select-icon-color: var(--gray-999);
  --form-select-icon-disabled-color: var(--gray-ccce);

  --form-dropdown-default-px: 4px;
  --form-dropdown-bg-color: var(--white);
  --form-dropdown-border-color: var(--green-6a2d);

  --form-dropdown-item-border-bottom-color: transparent;

  --form-dropdown-button-align: center;

  --form-dropdown-button-color: var(--gray-333);
  --form-dropdown-button-active-color: var(--gray-333);
  --form-dropdown-button-disabled-color: var(--gray-3334d);

  --form-dropdown-button-bg-color: var(--gray-f2);
  --form-dropdown-button-active-bg-color: var(--orange-feea);
  --form-dropdown-button-disabled-bg-color: transparent;

  --form-dropdown-icon-color: var(--orange-e646);
}
```

### 高度計算注意

- `.m-form-dropdown` 的 `my` 是 dropdown 與欄位之間的外距，會留在外層，不會加進內容高度。
- `.m-form-dropdown-container` 使用 `border-top-width` / `border-bottom-width` 模擬上下 padding，`useDropdownCore` 會把 border 高度納入 dropdown 高度。
- `.m-form-dropdown-body` 是卷軸與 `maxItems` 高度限制的目標。
- `.m-form-dropdown-options` 使用 `gap-y` 時，超過 `maxItems` 的 body 高度會另外計算可見項目之間的 row gap。
