# m-sort 組件規格文件

## 1. 元件目的

`m-sort` 是一個排序選擇元件，主要用來提供使用者切換排序條件。

元件需要支援兩種顯示模式：

- `button`：直接展開成按鈕列表
- `dropdown`：以下拉選單方式呈現

此外，`mode` 需要可以根據目前裝置類型切換不同顯示方式。

---

## 2. 前置引用

元件內需要先引用共用 store 與 resize action。

```js
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
```

---

## 3. Emits

元件需要定義 `click` 事件。

```js
const emits = defineEmits(['click'])
```

當使用者點擊排序項目時，透過 `click` emit 回傳目前點擊的單筆 item 資料。

```js
emits('click', item)
```

---

## 4. Props

### 4.1 options

型態：`Object`

`options` 為排序選項資料。

原始資料格式範例如下：

```js
{
  {
    label: '預設',
    value: '0',
  },
  {
    label: 'option1',
    value: '1',
    sort: {
      asc: {
        label: '小',
        value: 1,
      },
      desc: {
        label: '大',
        value: 2,
      },
    },
  },
  {
    label: 'option2',
    value: '2',
    sort: {
      asc: {
        label: '低',
        value: 1,
      },
      desc: {
        label: '高',
        value: 2,
      },
    },
  },
}
```

> `asc` 代表升冪，由小到大。  
> `desc` 代表降冪，由大到小。

---

### 4.2 config

型態：`Object`

`config` 為元件設定物件。

元件內部需要有自己的預設 config，並與 props 傳入的 `config` 合併。

```js
const defaultConfig = {
  mode: 'button',
}
```

合併邏輯範例：

```js
const sortConfig = computed(() => ({
  ...defaultConfig,
  ...props.config,
}))
```

---

## 5. config.mode 格式

`config.mode` 可以是字串，也可以是物件。

### 5.1 字串模式

```js
mode: 'button'
```

或：

```js
mode: 'dropdown'
```

可用值：

```js
'button' || 'dropdown'
```

---

### 5.2 裝置對應模式

當 `mode` 是物件時，需要依照目前 `device` 比對對應模式。

```js
mode: {
  p: 'button',
  pt: 'button',
  tm: 'dropdown',
  t: 'dropdown',
  m: 'dropdown',
}
```

可用裝置 key：

| key  | 說明                  |
| ---- | --------------------- |
| `p`  | PC                    |
| `pt` | 平板橫向 / 平板大尺寸 |
| `tm` | 平板或手機中間尺寸    |
| `t`  | Tablet                |
| `m`  | Mobile                |

> 實際 key 的定義依照專案中的 `device` 規則為主。

---

## 6. 元件內部 options

元件需要建立自己的 options 狀態，避免直接操作 props。

```js
const sortOptions = ref([])
```

當 `config.mode` 為 `button` 時，可以直接使用原始 options。

當 `config.mode` 為 `dropdown` 時，需要將 options 轉換成下拉選單需要的格式。

---

## 7. button 模式

當目前 mode 為 `button` 時，元件需要將 options 展開成 `ul` / `li` 結構，並使用 flex 排列。

結構概念如下：

```html
<ul class="m-sort-list">
  <li class="m-sort-item">
    <button type="button" class="m-sort-anchor">預設</button>
  </li>
</ul>
```

按鈕需要綁定 click 事件。

```html
<button type="button" @click="onClick(item)">{{ item.label }}</button>
```

點擊後執行：

```js
const onClick = (item) => {
  emits('click', item)
}
```

回傳資料為目前點擊的單筆 item 物件。

---

## 8. dropdown 模式

當目前 mode 為 `dropdown` 時，需要建立下拉選單。

需求如下：

- 使用 `Teleport to="body"`
- 使用 `Transition name="dropdown"`
- Transition 名稱直接使用 `dropdown`
- 可參考 `components/mForm/Select.vue`
- 下拉內容使用 `ul` / `li` 排列
- 每個選項使用 `button type="button"`
- 點擊後執行 `onClick(item)`
- 透過 `emits('click', item)` 回傳目前點擊的單筆 item 資料

結構概念如下：

```html
<Teleport to="body">
  <Transition name="dropdown">
    <ul class="m-sort-dropdown-list">
      <li class="m-sort-dropdown-item">
        <button type="button" class="m-sort-dropdown-anchor" @click="onClick(item)">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </Transition>
</Teleport>
```

---

## 9. dropdown options 轉換規則

當 mode 為 `dropdown` 時，需要將原始 options 轉換成以下格式。

```js
;[
  {
    label: '預設',
    value: {
      key: '0',
    },
  },
  {
    label: 'option1 小 ➜ 大',
    value: {
      key: '1',
      sort: 1,
    },
  },
  {
    label: 'option1 大 ➜ 小',
    value: {
      key: '1',
      sort: 2,
    },
  },
  {
    label: 'option2 低 ➜ 高',
    value: {
      key: '2',
      sort: 1,
    },
  },
  {
    label: 'option2 高 ➜ 低',
    value: {
      key: '2',
      sort: 2,
    },
  },
]
```

---

## 10. dropdown label 組合邏輯

### 10.1 沒有 sort 的項目

如果該 options item 沒有 `sort`，只需要回傳第一層 label。

```js
{
  label: '預設',
  value: {
    key: item.value,
  },
}
```

---

### 10.2 有 sort 的項目

如果該 options item 有 `sort`，需要產生兩筆資料。

#### asc 排序

label 組合方式：

```js
;`${item.label} ${item.sort.asc.label} ➜ ${item.sort.desc.label}`
```

value 組合方式：

```js
{
  key: item.value,
  sort: item.sort.asc.value,
}
```

範例：

```js
{
  label: 'option1 小 ➜ 大',
  value: {
    key: '1',
    sort: 1,
  },
}
```

---

#### desc 排序

label 組合方式：

```js
;`${item.label} ${item.sort.desc.label} ➜ ${item.sort.asc.label}`
```

value 組合方式：

```js
{
  key: item.value,
  sort: item.sort.desc.value,
}
```

範例：

```js
{
  label: 'option1 大 ➜ 小',
  value: {
    key: '1',
    sort: 2,
  },
}
```

---

## 11. 主要 function

### 11.1 onClick

處理使用者點擊排序項目的事件。

```js
const onClick = (item) => {
  emits('click', item)
}
```

---

### 11.2 onSortResize

處理不同裝置下的 mode 切換邏輯。

當 `config.mode` 是字串時，直接使用該模式。

```js
mode: 'button'
```

當 `config.mode` 是物件時，需要根據目前 `device.value` 找出對應模式。

```js
mode: {
  p: 'button',
  pt: 'button',
  tm: 'dropdown',
  t: 'dropdown',
  m: 'dropdown',
}
```

邏輯概念：

```js
const onSortResize = () => {
  const mode = sortConfig.value.mode

  if (typeof mode === 'string') {
    currentMode.value = mode
    return
  }

  if (typeof mode === 'object' && mode[device.value]) {
    currentMode.value = mode[device.value]
  }
}
```

---

## 12. Resize 邏輯

元件初始化時需要先執行一次 `onResize()`。

```js
onResize()
```

在 mounted 時監聽視窗 resize。

```js
onMounted(() => {
  window.addEventListener('resize', () => {
    onResize()
    onSortResize()
  })
})
```

在 unmounted 時移除 resize 監聽。

```js
onUnmounted(() => {
  window.removeEventListener('resize', () => {
    onResize()
    onSortResize()
  })
})
```

---

## 13. Resize 監聽注意事項

`addEventListener` 與 `removeEventListener` 需要使用同一個 function reference，否則事件不會被正確移除。

建議將 resize handler 抽出：

```js
const onWindowResize = () => {
  onResize()
  onSortResize()
}

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})
```

---

## 14. 建議狀態設計

```js
const currentMode = ref('button')
const sortOptions = ref([])
```

### currentMode

儲存目前實際使用的顯示模式。

可能值：

```js
'button' || 'dropdown'
```

### sortOptions

儲存元件內部實際渲染用的 options。

- `button` 模式：使用原始 options
- `dropdown` 模式：使用轉換後的 dropdown options

---

## 15. 建議流程

元件初始化流程：

1. 取得 `props.options`
2. 合併 `defaultConfig` 與 `props.config`
3. 執行 `onResize()` 更新目前裝置
4. 執行 `onSortResize()` 判斷目前 mode
5. 根據目前 mode 建立 `sortOptions`
6. mounted 後監聽 window resize
7. resize 時重新執行：
   - `onResize()`
   - `onSortResize()`
8. unmounted 時移除 resize 監聽

---

## 16. 建議 Vue 結構

```vue
<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()

const props = defineProps({
  options: {
    type: Object,
    default: () => ({}),
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits(['click'])

const defaultConfig = {
  mode: 'button',
}

const sortConfig = computed(() => ({
  ...defaultConfig,
  ...props.config,
}))

const currentMode = ref('button')
const sortOptions = ref([])

const onClick = (item) => {
  emits('click', item)
}

const onSortResize = () => {
  const mode = sortConfig.value.mode

  if (typeof mode === 'string') {
    currentMode.value = mode
    return
  }

  if (typeof mode === 'object' && mode[device.value]) {
    currentMode.value = mode[device.value]
  }
}

const onWindowResize = () => {
  onResize()
  onSortResize()
}

onResize()
onSortResize()

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})
</script>
```

---

## 17. 待實作項目

- [ ] 建立 `m-sort` 元件
- [ ] 定義 `options` props
- [ ] 定義 `config` props
- [ ] 建立預設 config
- [ ] 合併 props config
- [ ] 建立元件內部 options
- [ ] 建立 `onClick` function
- [ ] 建立 `onSortResize` function
- [ ] 建立 dropdown options 轉換邏輯
- [ ] 建立 button 模式 template
- [ ] 建立 dropdown 模式 template
- [ ] 使用 `Teleport to="body"`
- [ ] 使用 `Transition name="dropdown"`
- [ ] 加入 resize 監聽
- [ ] unmounted 時移除 resize 監聽
- [ ] click 時 emits 單筆 item 資料

---

## 18. 注意事項

- `button` 模式回傳原始 item 單筆資料。
- `dropdown` 模式回傳轉換後 item 單筆資料。
- 沒有 `sort` 的 options 不需要組 `sort` 欄位。
- 有 `sort` 的 options 需要拆成 asc 與 desc 兩筆資料。
- `mode` 若是物件，需要依照 `device.value` 動態取得對應模式。
- resize handler 需要抽成同一個 function，才能正確移除事件監聽。

## responsive mode 比對邏輯

`config.mode` 支援 responsive object，key 可使用：

```js
const responsiveKeys = ['p', 'pt', 'tm', 't', 'm']
```

比對規則：

- `p` 只套用在 `device.value === 'p'`
- `t` 只套用在 `device.value === 't'`
- `m` 只套用在 `device.value === 'm'`
- `pt` 套用在 `p`、`t`
- `tm` 套用在 `t`、`m`

解析順序會先比對單一 device，再比對群組 device：

```js
const resolveResponsiveConfig = (value) => {
  const resolvedValue = unref(value)

  if (!hasResponsiveConfig(resolvedValue)) return resolvedValue

  if ('p' in resolvedValue && device.value === 'p') return resolvedValue.p
  if ('t' in resolvedValue && device.value === 't') return resolvedValue.t
  if ('m' in resolvedValue && device.value === 'm') return resolvedValue.m
  if ('pt' in resolvedValue && ['p', 't'].includes(device.value)) return resolvedValue.pt
  if ('tm' in resolvedValue && ['t', 'm'].includes(device.value)) return resolvedValue.tm

  return false
}
```

例如 `device.value === 't'` 時，若同時有 `t` 與 `pt`，會優先使用 `t`：

```js
mode: {
  pt: 'button',
  t: 'dropdown',
}
```

上例在 tablet 會得到 `dropdown`。

若 responsive object 沒有命中目前 device，會回到 `defaultConfig.mode`，也就是 `button`：

```js
mode: {
  m: 'dropdown',
}
```

上例只有 mobile 會使用 `dropdown`，PC / tablet 會使用預設 `button`。

## config.maxItems

`config.maxItems` 用於限制 dropdown 一次顯示的項目數，邏輯與 `components/buy/mForm/Select.vue` 相同。

預設值：

```js
const defaultConfig = {
  mode: 'button',
  index: null,
  maxItems: 5,
  position: 'auto',
}
```

當 dropdown options 超過 `maxItems` 時，dropdown 會固定高度並啟用垂直捲動。

## config.position

`config.position` 用於設定 dropdown 依主要點擊按鈕的靠齊方向，邏輯參考 `components/buy/mForm/Select.vue`。

預設值：

```js
position: 'auto'
```

可用值：

```js
'auto' || 'left' || 'right'
```

- `auto`：預設靠左，若右側空間不足則改靠右。
- `left`：強制 dropdown 左側對齊主要點擊按鈕左側。
- `right`：強制 dropdown 右側對齊主要點擊按鈕右側。

## fixed popup 內的 dropdown 定位

dropdown 使用 `Teleport to="body"`，若主要點擊按鈕位於 `position: fixed` 的 popup 內，dropdown 需要使用 viewport 座標，不能加上 `window.scrollY / window.scrollX`。

元件會自動往上檢查主要點擊按鈕的父層，若任一父層為 `position: fixed`，dropdown 會改用：

```js
$dropdown.style.position = 'fixed'
```

一般頁面情境則維持：

```js
$dropdown.style.position = 'absolute'
```

## config.index

`config.index` 用於設定預設選中的項目 index，可在 query 已經設定好後，由外層傳入要選中的第幾筆。

預設值：

```js
index: null
```

元件初始化時會先同步：

```js
activeIndex.value = config.index
```

當 `config.index` 改變時，也會重新同步 `activeIndex`。

## button active 與 sort 點擊邏輯

button mode 會使用 `activeIndex` 判斷目前選中的 `m-sort-anchor`，選中時會加上：

```html
--active
```

若 item 沒有 `sort`，點擊後只會更新 `activeIndex`，不會有第一次 / 第二次排序狀態。
若 item 沒有 `sort` 且 `activeIndex === index`，再次點擊不會執行 `emits('click')`。

dropdown mode 點擊項目時，若 `activeIndex === index`，只會關閉 dropdown，不會執行 `emits('click')`。

若 item 有 `sort`：

- 第一次點擊該 item：使用 `desc`，也就是降冪。
- 再次點擊同一個 item：切換為 `asc`，也就是升冪。
- 再次點擊會在 `desc` / `asc` 間切換。

button mode 點擊有 `sort` 的 item 時，emit 出去的 item 會帶有目前排序值：

```js
{
  label: `${item.label} ${item.sort.desc.label} - ${item.sort.asc.label}`,
  value: {
    key: item.value,
    sort: item.sort.desc.value,
  },
}
```

---

## CSS Variables

`m-sort` 樣式可透過 `:root` CSS variables 調整，預設如下：

```css
:root {
  --sort-list-pc-gap-x: 16px;
  --sort-list-tablet-gap-x: 16px;
  --sort-list-mobile-gap-x: 16px;

  --sort-anchor-pc-text: 14px;
  --sort-anchor-tablet-text: 14px;
  --sort-anchor-mobile-text: 14px;

  --sort-anchor-pc-gap-x: 5px;
  --sort-anchor-tablet-gap-x: 5px;
  --sort-anchor-mobile-gap-x: 5px;

  --sort-icon-pc-p: 2px;
  --sort-icon-tablet-p: 2px;
  --sort-icon-mobile-p: 2px;

  --sort-icon-pc-size: 14px;
  --sort-icon-tablet-size: 14px;
  --sort-icon-mobile-size: 14px;

  --sort-select-anchor-pc-text: 14px;
  --sort-select-anchor-tablet-text: 14px;
  --sort-select-anchor-mobile-text: 14px;

  --sort-select-anchor-pc-gap-x: 3px;
  --sort-select-anchor-tablet-gap-x: 3px;
  --sort-select-anchor-mobile-gap-x: 3px;

  --sort-select-icon-pc-p: 2px;
  --sort-select-icon-tablet-p: 2px;
  --sort-select-icon-mobile-p: 2px;

  --sort-select-icon-pc-size: 14px;
  --sort-select-icon-tablet-size: 14px;
  --sort-select-icon-mobile-size: 14px;

  --sort-dropdown-pc-my: 3px;
  --sort-dropdown-tablet-my: 3px;
  --sort-dropdown-mobile-my: 3px;

  --sort-dropdown-pc-rounded: 0;
  --sort-dropdown-tablet-rounded: 0;
  --sort-dropdown-mobile-rounded: 0;

  --sort-dropdown-item-pc-px: 0;
  --sort-dropdown-item-tablet-px: 0;
  --sort-dropdown-item-mobile-px: 0;

  --sort-dropdown-anchor-pc-px: 8px;
  --sort-dropdown-anchor-tablet-px: 8px;
  --sort-dropdown-anchor-mobile-px: 8px;

  --sort-dropdown-anchor-pc-py: 8px;
  --sort-dropdown-anchor-tablet-py: 8px;
  --sort-dropdown-anchor-mobile-py: 8px;

  --sort-dropdown-anchor-pc-text: 14px;
  --sort-dropdown-anchor-tablet-text: 14px;
  --sort-dropdown-anchor-mobile-text: 14px;

  --sort-dropdown-anchor-pc-border-b: 1px;
  --sort-dropdown-anchor-tablet-border-b: 1px;
  --sort-dropdown-anchor-mobile-border-b: 1px;

  --sort-anchor-color: var(--gray-666);
  --sort-anchor-hover-color: var(--orange-e646);
  --sort-anchor-active-color: var(--orange-e646);

  --sort-dropdown-bg-color: var(--white);
  --sort-dropdown-anchor-color: var(--gray-333);
  --sort-dropdown-anchor-hover-color: var(--orange-e646);
  --sort-dropdown-anchor-active-color: var(--orange-e646);
  --sort-dropdown-anchor-bg-color: tranparent;
  --sort-dropdown-anchor-hover-bg-color: tranparent;
  --sort-dropdown-anchor-active-bg-color: tranparent;
  --sort-dropdown-anchor-border-b-color: var(--gray-e5);
}
```
