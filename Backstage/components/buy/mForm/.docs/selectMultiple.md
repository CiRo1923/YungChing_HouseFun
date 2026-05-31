# SelectMultiple.vue

`SelectMultiple.vue` 是 mForm 的多組單選下拉元件雛形。目前實作先完成 dropdown shell、觸發元素、開關狀態、定位、外部點擊關閉與 resize 重新定位，邏輯共用 `useDropdownCore`。

目前版本透過 `items` 接收多組下拉資料，每組資料提供自己的 options ref 與 model ref。每組 data 都是單選，點擊 option 時會直接寫回該組的 model ref，達成外部雙向綁定。

## 參考來源

- 元件：`components/buy/mForm/SelectMultiple.vue`
- 共用邏輯：`components/buy/mForm/.composables/useDropdownCore.js`
- 共用樣式：`assets/css/_modules/buy/mForm.css`
- dropdown 樣式：`assets/css/_modules/buy/mFormDropdown.css`
- 動畫：`assets/css/_common/vueTransition.css`

## 目前結構

`SelectMultiple.vue` 使用 `useDropdownCore` 提供下列狀態與方法：

- `elenemtRef`：觸發元素，作為 dropdown 定位基準。
- `dropdownRef`：dropdown 外層，負責定位、寬度與展開高度。
- `dropdownContainerRef`：dropdown 內容容器，負責內容高度與捲動計算。
- `dropdownItemRef`：dropdown item refs，預留給後續 options / maxItems 計算。
- `isActive`：控制 dropdown 是否顯示。
- `isFocus`：控制觸發元素 focus 樣式。
- `onElementClick`：切換 dropdown 開關並重新計算位置。
- `onSelectResize`：視窗 resize 時重新計算 dropdown。
- `isDropdownOutside`：判斷外部點擊並關閉 dropdown。

## DOM 結構

```vue
<div class="m-form">
  <div class="m-form-container">
    <button class="m-form-element --select">
      <div class="m-form-type">
        <slot />
      </div>
      <CommonSvgIcon class="m-form-icon" />
      <i class="m-form-icon-arrow" />
    </button>
  </div>
</div>

<Teleport to="body">
  <Transition name="dropdown">
    <div class="m-form-dropdown --dropdown">
      <div class="m-form-dropdown-container scrollbar --y">
        <div class="m-form-dropdown-datas">
          <div class="m-form-dropdown-data">
            <div class="m-form-dropdown-header">
              <slot name="dropdownHeader" :data="data" />
            </div>
            <ul class="m-form-dropdown-options scrollbar --y">
              <li class="m-form-dropdown-item">
                <button class="m-form-dropdown-button">
                  <CommonSvgIcon class="m-form-dropdown-icon" />
                  <em class="m-form-dropdown-label">
                    <slot name="option" :item="item" />
                  </em>
                </button>
              </li>
            </ul>
            <footer class="m-form-dropdown-footer">
              <slot name="dropdownFooter" :data="data" />
            </footer>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

## Props

| 名稱 | 型別 | 預設 | 說明 |
| --- | --- | --- | --- |
| `items` | `Array` | `[]` | 多組 dropdown data，每組包含 options ref 與 model ref。 |
| `config` | `Object` | `{}` | dropdown 設定。 |
| `setClass` | `Object` | `{}` | 外部覆寫 class。 |

## items 結構

```js
const items = [
  {
    options: optionsRef,
    model: modelRef,
    schema: {
      label: 'name',
      value: 'id',
      isDisabled: 'disabled',
    },
  },
]
```

### items[].options

選項資料，需傳入 ref。元件會讀取 `options.value` 產生 `.m-form-dropdown-data` 內的 option DOM。

### items[].model

選取值資料，需傳入 ref。每組 data 都是單選，點擊 option 時元件會直接把 option value 寫入 `model.value`，因此外層可以維持雙向綁定。

若要綁定物件欄位，請使用 `toRef(target, key)`，不要使用 `toRef(target[key])`。

```js
const items = computed(() => {
  return [
    {
      options: options.value.room,
      model: toRef(apiData.value, 'roomCountToken'),
    },
    {
      options: options.value.price,
      model: toRef(apiData.value, 'priceToken'),
    },
    {
      options: options.value.pin,
      model: toRef(apiData.value, 'pinToken'),
    },
  ]
})
```

`toRef(apiData.value.roomCountToken)` 只會把目前值包成新的 ref，無法回寫到 `apiData.value.roomCountToken`。

### items[].schema

單一 data 的 schema 設定。若 `items[].schema` 有傳值，會優先於 `config.schema`；沒有傳的 key 會回落使用 `config.schema`。

```js
const cityOptions = ref([
  { name: '台北市', id: 'taipei' },
  { name: '新北市', id: 'new-taipei' },
])
const cityModel = ref(null)

const items = [
  {
    options: cityOptions,
    model: cityModel,
    schema: {
      label: 'name',
      value: 'id',
    },
  },
]
```

## config 預設值

共同預設值集中在 `useDropdownCore.js` 的 `defaultDropdownConfig`，`SelectMultiple.vue` 透過 `onMergeDropdownConfig(props.config)` 合併。

```js
{
  arrowType: 'caret',
  isDisabled: false,
  position: 'auto',
  maxItems: null,
  schema: {
    label: 'label',
    value: 'value',
    isDisabled: 'isDisabled'
  }
}
```

### config.arrowType

- `caret`：顯示 `CommonSvgIcon` 的 `caret_large_down`。
- `arrow`：顯示 CSS 三角形 `.m-form-icon-arrow`。

### config.maxItems / config.maxItem

`SelectMultiple.vue` 的高度限制會套在每一組 `.m-form-dropdown-options`，不是整個 `.m-form-dropdown-container`。

當某組 options 數量超過 `maxItems` 時，該組 `.m-form-dropdown-options` 會依照可見 item 高度與 `gap-y` 計算高度，並透過 `scrollbar --y` 出現垂直捲軸。

```vue
<ul class="m-form-dropdown-options scrollbar --y">
  ...
</ul>
```

options 高度套用完成後，元件會重新用 `.m-form-dropdown-container` 的內容高度回寫 `.m-form-dropdown`，避免外層保留未限制前的完整高度。

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
  dropdownButton: ''
}
```

## Slots

### `default`

觸發元素內的顯示內容，通常放目前已選取項目的摘要。

```vue
<BuyMFormSelectMultiple>
  已選 3 個條件
</BuyMFormSelectMultiple>
```

### `dropdownHeader`

`.m-form-dropdown-data` 上方區塊，可放搜尋、分類標題或資料群組標籤。

```vue
<template #dropdownHeader="{ data }">
  <strong>{{ data.title }}</strong>
</template>
```

### `option`

自訂 option 顯示內容。

```vue
<template #option="{ item }">
  {{ item.label }}
</template>
```

### `dropdownFooter`

`.m-form-dropdown-data` 下方區塊，可放清除、套用或補充操作。

```vue
<template #dropdownFooter="{ data }">
  <button type="button">套用</button>
</template>
```

## CSS Variables

`SelectMultiple.vue` 共用 `mFormDropdown.css` 的 dropdown 變數。主要相關變數如下：

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

  --form-dropdown-header-pc-mb: 8px;
  --form-dropdown-header-tablet-mb: 8px;
  --form-dropdown-header-mobile-mb: 8px;

  --form-dropdown-footer-pc-mt: 8px;
  --form-dropdown-footer-tablet-mt: 8px;
  --form-dropdown-footer-mobile-mt: 8px;
}
```

## 高度與樣式注意

- 不要在 `.m-form-dropdown-container` 加 `max-height: 100%` / `max-h-full`，避免展開時量到被裁切後的高度。
- 需要 dropdown 與欄位距離時，請調整 `.m-form-dropdown` 的 `--form-dropdown-*-my`。
- options 會被建立在 `.m-form-dropdown-options` 內，讓 `gap-y` 能被 `useDropdownCore` 正確計算。
- `.m-form-dropdown-datas` 使用 `w-full`，`.m-form-dropdown-data` 使用 `min-w-0 flex-1`，避免 footer 內的 input 或長文字把單一欄位撐寬，讓多組 data 能平均分欄。

## 後續補強方向

- 視需求補上清除、套用等操作。
- 視需求補上 `maxItems` 與鍵盤操作。
