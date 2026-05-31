# Dropdown.vue

`Dropdown.vue` 是 `components/buy/mForm/Select.vue` 抽出的 dropdown shell，目標是讓下拉層的觸發元素、開關、定位、動畫與樣式 class 可以共用。

## 參考來源

- 主要參考：`components/buy/mForm/Select.vue`
- 共用邏輯：`components/buy/mForm/.composables/useDropdownCore.js`
- 動畫：`<Transition name="dropdown" @after-leave="onCloseDropdown" appear>`

## 目前結構

元件已先補上 `useDropdownCore` 需要的核心狀態：

- `elenemtRef`：觸發元素，提供 dropdown 定位基準。
- `config`：合併 dropdown 預設設定與外部傳入設定。
- `setClass`：合併預設 class key 與外部傳入 class。
- `isActive`：控制 dropdown 是否顯示。
- `isFocus`：控制觸發元素 focus 樣式。
- `onCloseDropdown`：離場動畫結束後關閉 dropdown。
- `dropdownRef` / `dropdownContainerRef`：提供定位與捲動計算使用。
- 外部點擊與視窗 resize 事件：開啟後可點擊外部關閉，視窗尺寸變更時重新定位。

## Props

| 名稱 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `config` | `Object` | `{}` | dropdown 設定。 |
| `setClass` | `Object` | `{}` | 外部覆寫 class。 |

## config 預設值

```js
{
  arrowType: 'caret',
  isDisabled: false,
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
  dropdown: '',
  dropdownContainer: '',
}
```

## Slots

### `default`

觸發 dropdown 的內容，會被包在 `.m-form-element` button 內。

### `dropdown`

dropdown container 內的內容。沒有設定 `maxItems` 時，`useDropdownCore` 會用 container `scrollHeight` 加上 container 自己的 border 計算展開高度。

需要 dropdown 與觸發元素之間的間距時，請加在 `.m-form-dropdown` / `dropdownRef` 外層，不要加在 `.m-form-dropdown-container`，避免內層 margin 被外層 `overflow-hidden` 裁切。

不要在 `dropdownContainer` 上加 `max-height: 100%` / `max-h-full`，否則 container 會被父層動畫高度限制，導致 `scrollHeight` 量到被裁切後的高度。

## defineExpose

元件目前 expose 下列值，方便外層接入觸發元素與控制 dropdown：

- `elenemtRef`
- `dropdownRef`
- `dropdownContainerRef`
- `dropdownItemRef`
- `isActive`
- `isFocus`
- `onSwitchActive`
- `onDropdownOpen`
- `onElementClick`
- `onSelectResize`
- `isDropdownOutside`

## 使用範例

```vue
<BuyMFormDropdown>
  <span>展開</span>

  <template #dropdown>
    <button type="button" class="m-form-dropdown-button">選項一</button>
    <button type="button" class="m-form-dropdown-button">選項二</button>
  </template>
</BuyMFormDropdown>
```

## 後續補強方向

- 若需要完整 Select 行為，可繼續搬移 `Select.vue` 的鍵盤操作與選取事件。

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
- `.m-form-dropdown-options` 使用 `gap-y` 時，超過 `maxItems` 的高度會另外計算可見項目之間的 row gap。
