# m-tooltip 組件規格文件

## 1. 元件目的

`m-tooltip` 是一個提示泡泡（tooltip）元件，由一個「觸發節點」與一個「浮層內容」組成。

特性：

- 觸發方式（hover / click）可透過 `config.events` 設定，並可依裝置切換。
- 浮層位置（上 / 下 / 左 / 右、對齊方向）可透過 `config.position` 設定，並可依裝置切換。
- 浮層使用 `Teleport to="body"` + `position: fixed`，以觸發節點的座標即時計算位置，**不會被父層 `overflow: hidden` 裁切**。
- 觸發節點標籤可透過 `config.as` 指定（預設 `button`）。
- 可顯示文字 `label` 與圖示 `config.icon`。

---

## 2. 前置引用

```js
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const { onResolveByDevice } = useBuyProjectActions()
```

- `device`：目前裝置，**只會是 `p` | `t` | `m`**。
- `onResize`：更新 `device`。
- `onResolveByDevice(value, device)`：將「可依裝置設定的物件」解析成目前裝置對應的值（見第 5 節）。

---

## 3. Props

| prop       | 型態     | 預設         | 說明                       |
| ---------- | -------- | ------------ | -------------------------- |
| `label`    | `String` | `null`       | 觸發節點顯示的文字         |
| `config`   | `Object` | `() => ({})` | 元件設定，與內部預設合併   |
| `setClass` | `Object` | `() => ({})` | 各區塊外掛 class           |

### 3.1 slot

| slot      | 說明           |
| --------- | -------------- |
| `content` | 浮層內容       |

---

## 4. config 設定

元件內部有預設 config，並與 `props.config` 合併：

```js
const config = computed(() => {
  return {
    as: 'button',
    events: 'hover',
    position: 'center, top',
    icon: null,
    ...props.config,
  }
})
```

| key        | 型態                | 預設            | 說明                                          |
| ---------- | ------------------- | --------------- | --------------------------------------------- |
| `as`       | `String`            | `'button'`      | 觸發節點要渲染的標籤（`button` / `div` …）    |
| `events`   | `String` \| `Object`| `'hover'`       | 觸發方式，可依裝置設定                         |
| `position` | `String` \| `Object`| `'center, top'` | 浮層位置，可依裝置設定                         |
| `icon`     | `String` \| `Object`| `null`          | 觸發節點的圖示                                |

---

## 5. 可依裝置設定（onResolveByDevice）

`events` 與 `position` 都可傳「字串」或「依裝置設定的物件」。

### 5.1 字串

直接套用，不分裝置：

```js
events: 'hover'
position: 'center, top'
```

### 5.2 裝置物件

```js
events: {
  p: 'hover',
  t: 'click',
  m: 'click',
}
```

可用 key 與比對規則（`device` 只會回傳 `p` / `t` / `m`，故用 `pt` / `tm` 表示區間）：

| key  | 命中的 device |
| ---- | ------------- |
| `p`  | `p`           |
| `t`  | `t`           |
| `m`  | `m`           |
| `pt` | `p`、`t`      |
| `tm` | `t`、`m`      |

解析順序為「先比單一 device，再比區間」，由 `onResolveByDevice` 處理。

---

## 6. config.events 觸發方式

解析後以逗號拆成陣列，支援同時多種：

```js
const events = computed(() => {
  const value = onResolveByDevice(config.value.events, device.value) || ''

  return value
    .split(',')
    .map((event) => event.trim())
    .filter(Boolean)
})

const hasHover = computed(() => events.value.includes('hover'))
const hasClick = computed(() => events.value.includes('click'))
```

可用值：

```js
'hover' || 'click' || 'hover, click'
```

行為：

- `hover`：`mouseenter` 開啟、`mouseleave` 關閉。觸發節點與浮層皆綁定 hover 事件，滑入浮層內容不會關閉。
- `click`：點擊觸發節點開 / 關；點擊觸發節點與浮層**以外**的區域會關閉（capture 階段監聽 `document` click）。

---

## 7. config.position 位置

格式為 `'{align}, {side}'`，解析成 `{ align, side }`：

```js
const position = computed(() => {
  const value = onResolveByDevice(config.value.position, device.value) || 'center, top'
  const [align, side] = value.split(',').map((item) => item.trim())

  return { align, side }
})
```

可用值：

```js
'center, top'    | 'center, bottom'
'left, top'      | 'left, bottom'   | 'left, center'
'right, top'     | 'right, bottom'  | 'right, center'
```

語意：

- 第二個值 `side` 為「浮層相對觸發節點的擺放側」：
  - `top`：上方
  - `bottom`：下方
  - `center`：同水平高度（擺左 / 右側，由 `align` 決定）
- 第一個值 `align` 為對齊 / 擺放側：
  - `top` / `bottom` 時：`left`（左緣對齊）、`center`（置中）、`right`（右緣對齊）
  - `center` 時：`left`（擺觸發節點左側）、`right`（擺觸發節點右側）

`position` 會輸出到浮層 class，對應箭頭方向：

```html
:class="[`--${position.align}-x`, `--${position.side}-y`]"
```

即 `--left-x` / `--center-x` / `--right-x` 與 `--top-y` / `--bottom-y` / `--center-y`。

---

## 8. config.icon 圖示

可傳「字串」或「物件」，統一整理成 `{ name, position }`：

```js
const icon = computed(() => {
  const value = config.value.icon

  if (!value) return null

  if (typeof value === 'object') {
    return { name: null, position: 'right', ...value }
  }

  return { name: value, position: 'right' }
})
```

| 傳入                                   | 結果                                  |
| -------------------------------------- | ------------------------------------- |
| `null`（未傳）                         | `null`，不渲染 icon                   |
| `'icon_vr'`（字串）                    | `{ name: 'icon_vr', position: 'right' }` |
| `{ name: 'icon_vr', position: 'left' }`| 直接使用，缺 `position` 補 `right`    |

- `position` 為 `left` / `right`，決定 icon 在 `label` 的左或右。
- icon 以 `CommonSvgIcon` 渲染。

---

## 9. 觸發節點與 v-bind

觸發節點以動態 component 渲染，屬性集中在 `bind` computed 方便擴充：

```js
const bind = computed(() => {
  const isButton = config.value.as === 'button'
  if (isButton) return { type: 'button' }

  return {}
})
```

```html
<component :is="config.as" v-bind="bind" ...>
```

- `as === 'button'` 時綁定 `type="button"`，避免 form 內被當成 submit。
- 其他標籤不輸出 `type`。
- 之後要擴充 `disabled` / `href` / `aria-*` 等，加入 `bind` 即可。

---

## 10. 定位計算（onUpdatePosition）

以觸發節點的 `getBoundingClientRect()` 計算浮層的 `fixed` 座標。

```js
const onUpdatePosition = () => {
  const $root = tooltipRef.value
  const $container = containerRef.value
  if (!$root || !$container) return

  const { align, side } = position.value
  const trigger = $root.getBoundingClientRect()
  const tooltip = $container.getBoundingClientRect()

  // ::after 箭頭為 absolute，不含在 rect 內，需另外把箭頭尺寸算進間距（讀 computed border，CSS 改尺寸會同步）
  const after = getComputedStyle($container, '::after')
  const arrowH = (parseFloat(after.borderTopWidth) || 0) + (parseFloat(after.borderBottomWidth) || 0)
  const arrowW = (parseFloat(after.borderLeftWidth) || 0) + (parseFloat(after.borderRightWidth) || 0)

  // margin 不含在 rect，且 fixed 設了 top/left 後 margin 會再位移 border box；間距 = 箭頭 + margin，最後扣回位移
  const containerStyle = getComputedStyle($container)
  const mTop = parseFloat(containerStyle.marginTop) || 0
  const mRight = parseFloat(containerStyle.marginRight) || 0
  const mBottom = parseFloat(containerStyle.marginBottom) || 0
  const mLeft = parseFloat(containerStyle.marginLeft) || 0

  // 先算目標 border-box 位置（含 箭頭 + margin 間距）
  let boxTop = 0
  let boxLeft = 0

  // y 軸
  if (side === 'top') {
    boxTop = trigger.top - tooltip.height - arrowH - mBottom
  } else if (side === 'center') {
    boxTop = trigger.top + trigger.height / 2 - tooltip.height / 2
  } else {
    boxTop = trigger.bottom + arrowH + mTop
  }

  // x 軸
  if (align === 'left') {
    boxLeft = side === 'center' ? trigger.left - tooltip.width - arrowW - mRight : trigger.left
  } else if (align === 'right') {
    boxLeft = side === 'center' ? trigger.right + arrowW + mLeft : trigger.right - tooltip.width
  } else {
    boxLeft = trigger.left + trigger.width / 2 - tooltip.width / 2
  }

  // top/left 設定值需扣掉 margin，渲染後 border box 才會落在目標位置
  floatingStyle.value = {
    position: 'fixed',
    top: `${boxTop - mTop}px`,
    left: `${boxLeft - mLeft}px`,
  }
}
```

重點：

- **箭頭尺寸**：`::after` 為 `absolute`，不算在浮層 rect 內，需把箭頭高 / 寬加進間距，箭頭尖端才會貼齊觸發節點。
- 箭頭尺寸由 `getComputedStyle($container, '::after')` 動態取得，CSS 改箭頭大小會自動同步，不寫死。
- **margin**：`.m-tooltip-container` 的 `margin`（`--tooltip-container-m`）同樣不在 rect 內，且 `position: fixed` 設了 `top/left` 後，margin 會把 border box 再往內位移。因此間距採「箭頭 + margin」，並以「目標 border-box 位置 − margin」回推 `top/left`，渲染後 border box 才落在預期位置（各側視覺間距 = 箭頭 + margin）。
- `top` / `bottom` 算高（`arrowH` + 上下 margin）；`left, center` / `right, center` 算寬（`arrowW` + 左右 margin + 浮層自身寬度）。

---

## 11. 觸發節點量測注意事項

定位以 `.m-tooltip`（`tooltipRef`）的 rect 為基準，因此這個 rect 必須剛好貼齊可見內容：

```css
.m-tooltip {
  @apply inline-flex items-center; /* block 會撐滿整列，rect 會錯 */
}

.m-tooltip svg {
  @apply block; /* inline svg 底部有 baseline 空隙，會讓 rect 比 icon 高，定位偏低 */
}
```

- 觸發節點用 `inline-flex` 緊貼內容，避免 `block` 撐滿整列導致水平定位錯誤。
- 內部 `svg` 設 `display: block`，消除 inline svg 的 baseline 下緣空隙，否則只有 icon 時量測到的位置會偏低。

---

## 12. 開啟流程與第一次定位

```js
const onOpen = async () => {
  isOpen.value = true
  await nextTick()
  onUpdatePosition()
}
```

- 先開啟（`v-if` 掛上浮層）→ `nextTick` 等 DOM 渲染 → 再量測定位（需要浮層尺寸做置中 / 上方對齊）。
- 浮層基底 CSS 先給 `position: fixed`，避免第一次開啟時為 `static` 區塊（寬度撐滿 viewport）導致量測寬度錯誤、第一次位置跑掉。

```css
.m-tooltip-container {
  @apply fixed left-0 top-0 ...;
}
```

- 進場 transition 為 `opacity`，首幀不可見，`nextTick` 內已寫入正確座標，不會看到從 `(0,0)` 跳動。

---

## 13. Transition

浮層使用 `Transition name="tooltip"`，對應 CSS 建立在 `assets/css/_common/vueTransition.css`：

```css
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  @apply opacity-0;
}

.tooltip-enter-to,
.tooltip-leave-from {
  @apply opacity-100;
}
```

> 定位採 `top` / `left`（非 transform），與 transition 不衝突。

---

## 14. resize / scroll 重新定位

開啟期間，視窗 resize 或捲動時需要重算位置：

```js
const onReposition = () => {
  if (isOpen.value) onUpdatePosition()
}

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true) // capture：祖先捲動也要重算
  document.addEventListener('click', onOutside, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  document.removeEventListener('click', onOutside, true)
})
```

- `onResize` 更新 `device`（影響 `events` / `position` 的裝置解析）。
- `onReposition` 在開啟中重算座標。
- `scroll` 用 capture（第三參數 `true`），任一祖先捲動都會觸發。
- `click`（capture）用於 `click` 模式的外部點擊關閉。

---

## 15. setClass

各區塊可外掛 class：

```js
const setClass = computed(() => {
  return {
    main: '',      // 觸發節點 .m-tooltip
    label: '',     // 文字 .m-tooltip-label
    icon: '',      // icon（CommonSvgIcon）
    container: '', // 浮層 .m-tooltip-container
    ...props.setClass,
  }
})
```

---

## 16. 使用範例

僅 icon、hover、預設位置（上方置中）：

```html
<BuyMTooltipMain
  :config="{ icon: 'icon_vr' }"
  :setClass="{ icon: 'h-[16px] w-[16px]' }"
>
  <template #content>132456</template>
</BuyMTooltipMain>
```

文字 + 點擊觸發 + 依裝置切換位置：

```html
<BuyMTooltipMain
  label="說明"
  :config="{
    events: 'click',
    position: { p: 'right, center', m: 'center, bottom' },
  }"
>
  <template #content>提示內容</template>
</BuyMTooltipMain>
```

---

## 17. 注意事項

- `device` 只會回傳 `p` / `t` / `m`；`events` / `position` 用裝置物件時靠 `onResolveByDevice` 把 `pt` / `tm` 區間對應到目前裝置。
- 定位以 `.m-tooltip` 的 rect 為基準，務必讓它貼齊內容（`inline-flex` + `svg { block }`）。
- 浮層基底需先 `position: fixed`，否則第一次開啟量測寬度會錯。
- 箭頭 `::after` 不在浮層 rect 內，定位需另外把箭頭尺寸算進間距（高用於 top/bottom、寬用於 left/right center）。
- `config.as === 'button'` 時務必輸出 `type="button"`，避免 form 內被當成 submit。
- 量測需在 `nextTick` 之後，確保浮層已渲染、尺寸正確。
