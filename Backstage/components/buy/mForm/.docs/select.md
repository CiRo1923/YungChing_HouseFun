# Select.vue

`Select.vue` 是 mForm 的下拉選取元件，負責顯示目前選取值、開關 dropdown、渲染 options，並透過 `useDropdownCore` 共用定位、展開高度、外部點擊關閉與 resize 重新定位邏輯。

## 參考來源

- 元件：`components/buy/mForm/Select.vue`
- 共用邏輯：`components/buy/mForm/.composables/useDropdownCore.js`
- 共用樣式：`assets/css/_modules/buy/mForm.css`
- dropdown 樣式：`assets/css/_modules/buy/mFormDropdown.css`
- 動畫：`assets/css/_common/vueTransition.css`

## DOM 結構

```vue
<div class="m-form-main">
  <div class="m-form-container">
    <button class="m-form-element --select">
      <span class="m-form-type"></span>
      <CommonSvgIcon class="m-form-icon" />
    </button>
  </div>
</div>

<Teleport to="body">
  <Transition name="dropdown">
    <div class="m-form-dropdown --select">
      <div class="m-form-dropdown-container scrollbar --y">
        <ul class="m-form-dropdown-options">
          <li class="m-form-dropdown-item">
            <button class="m-form-dropdown-button">
              <CommonSvgIcon class="m-form-dropdown-icon" />
              <em class="m-form-dropdown-label"></em>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</Teleport>
```

## Props

| 名稱 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `modelValue` | `String` / `Number` / `Boolean` / `Object` | `null` | 目前選取值。 |
| `options` | `Array` | `[]` | 下拉選項資料。 |
| `config` | `Object` | `{}` | Select 與 dropdown 設定。 |
| `setClass` | `Object` | `{}` | 外部覆寫 class。 |

## config 預設值

```js
{
  arrowType: 'caret',
  startOption: null,
  placeholder: null,
  isDisabled: false,
  isError: false,
  position: 'auto',
  schema: {
    label: 'label',
    value: 'value'
  },
  keyboard: false,
  maxItems: 5
}
```

### config.arrowType

- `caret`：顯示 `CommonSvgIcon` 的 `caret_large_down`。
- `arrow`：顯示 CSS 三角形 `.m-form-icon-arrow`。

### config.maxItems

`maxItems` 控制 dropdown 超過指定項目數時的可視高度。高度計算會包含：

- 可視 item 的實際高度。
- `.m-form-dropdown-container` 的上下 padding / border。
- `.m-form-dropdown-options` 的 `gap-y`。

scrollbar 樣式不由 JS 寫入；需要捲動時請自行透過 class 處理，例如 `scrollbar --y`。

## setClass key

```js
{
  main: '',
  container: '',
  element: '',
  type: '',
  suffix: '',
  error: '',
  dropdown: '',
  dropdownContainer: '',
  dropdownButton: ''
}
```

## Slots

### `selected`

自訂目前選取值顯示內容。

```vue
<template #selected="{ item }">
  {{ item.label }}
</template>
```

### `option`

自訂 dropdown option 顯示內容。

```vue
<template #option="{ item }">
  {{ item.label }}
</template>
```

## CSS Variables

`Select.vue` 會共用 `mFormDropdown.css` 的 `:root` 變數。主要相關變數如下：

```css
:root {
  --form-select-icon-arrow-pc-p: 2px;
  --form-select-icon-arrow-tablet-p: 2px;
  --form-select-icon-arrow-mobile-p: 2px;

  --form-select-icon-arrow-pc-size: 14px;
  --form-select-icon-arrow-tablet-size: 14px;
  --form-select-icon-arrow-mobile-size: 14px;

  --form-select-icon-color: var(--gray-999);
  --form-select-icon-disabled-color: var(--gray-ccce);

  --form-dropdown-pc-my: 8px;
  --form-dropdown-tablet-my: 8px;
  --form-dropdown-mobile-my: 8px;

  --form-dropdown-container-pc-px: 16px;
  --form-dropdown-container-tablet-px: 16px;
  --form-dropdown-container-mobile-px: 16px;

  --form-dropdown-container-pc-py: 16px;
  --form-dropdown-container-tablet-py: 16px;
  --form-dropdown-container-mobile-py: 16px;

  --form-dropdown-options-pc-gap-y: 8px;
  --form-dropdown-options-tablet-gap-y: 8px;
  --form-dropdown-options-mobile-gap-y: 8px;

  --form-dropdown-button-pc-px: 8px;
  --form-dropdown-button-tablet-px: 8px;
  --form-dropdown-button-mobile-px: 8px;

  --form-dropdown-button-pc-py: 12px;
  --form-dropdown-button-tablet-py: 12px;
  --form-dropdown-button-mobile-py: 12px;

  --form-dropdown-button-pc-gap-x: 3px;
  --form-dropdown-button-tablet-gap-x: 3px;
  --form-dropdown-button-mobile-gap-x: 3px;

  --form-dropdown-label-pc-text: 16px;
  --form-dropdown-label-tablet-text: 16px;
  --form-dropdown-label-mobile-text: 16px;
}
```

## 高度與樣式注意

- 不要在 `.m-form-dropdown-container` 加 `max-height: 100%` / `max-h-full`，避免展開時量到被裁切後的高度。
- 需要 dropdown 與欄位距離時，請調整 `.m-form-dropdown` 的 `--form-dropdown-*-my`。
- options 間距請用 `.m-form-dropdown-options` 的 `gap-y` 變數，`maxItems` 計算會同步納入。
