# m-table --default

`components/buy/mTable/Default.vue` 是預設表格組件。資料可透過 `table` 統一傳入，也可拆成 `thead`、`tbody`、`tfoot` 傳入。

## Props

| 名稱 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `thead` | `Array` | `null` | 表頭欄位設定。 |
| `tbody` | `Array` | `null` | 表格內容資料。可傳入陣列、空陣列或 `null`。 |
| `tfoot` | `Array` | `null` | 表尾資料。沒有資料時不顯示。 |
| `table` | `Object` | `null` | 完整表格資料。傳入後優先使用 `table.thead`、`table.tbody`、`table.tfoot`。 |
| `config` | `Object` | `{}` | 組件設定，會與預設設定合併。 |
| `setClass` | `Object` | `{}` | class 設定，會與預設 class 合併。 |

## Data

分開傳入：

```vue
<BuyMTableDefault :thead="thead" :tbody="tbody" :tfoot="tfoot" />
```

統一傳入：

```vue
<BuyMTableDefault :table="table" />
```

`table` 有值時，資料來源為：

```js
thead = table.thead
tbody = table.tbody
tfoot = table.tfoot
```

## Thead

```js
const thead = [
  {
    id: 'name',
    label: '姓名',
    type: null,
    format: 'YYYY-MM-DD',
    colspan: {
      thead: null,
      tbody: null,
    },
    rowspan: {
      thead: null,
      tbody: null,
    },
    class: {
      thead: null,
      tbody: null,
      tfoot: null,
    },
  },
]
```

| 名稱 | 說明 |
| --- | --- |
| `id` | 欄位 key，同時也是 tbody slot name。 |
| `label` | 表頭文字，使用 `v-html` 輸出。 |
| `type` | 預設欄位輸出格式。可傳 `date`、`comma`、`currency`。 |
| `format` | `type: 'date'` 時使用的日期格式，預設 `YYYY-MM-DD`。 |
| `colspan.thead` | 表頭 `th` 的 `colspan`。 |
| `colspan.tbody` | 內容 `td` 的 `colspan`。 |
| `rowspan.thead` | 表頭 `th` 的 `rowspan`。 |
| `rowspan.tbody` | 內容 `td` 的 `rowspan`。 |
| `class.thead` | 表頭 `th` 額外 class。 |
| `class.tbody` | 內容 `td` 額外 class。 |
| `class.tfoot` | 表尾 `td` 額外 class。 |

## Tbody

```js
const tbody = [
  {
    name: '王小明',
    price: 1200000,
    createdAt: '2026-05-31',
  },
]
```

欄位值會用 `thead.id` 對應資料物件：

```js
value = tbody[rowIndex][thead.id]
```

如果沒有提供對應的 named slot，組件會使用 `TBodyValue.vue` 輸出欄位值。

## TBodyValue

`components/buy/mTable/TBodyValue.vue` 接收：

| 名稱 | 型別 | 說明 |
| --- | --- | --- |
| `value` | `String \| Number` | 欄位值。 |
| `config` | `Object` | 欄位設定，通常傳入當前 `thead` item。 |

格式化規則：

| `config.type` | 輸出 |
| --- | --- |
| `date` | `onFormatDate(value, config.format || 'YYYY-MM-DD')` |
| `comma` | `onNumberComma(value) || 0` |
| `currency` | `$${onNumberComma(value) || 0}` |
| 其他 | 原值 |

## Tfoot

`tfoot` 或 `table.tfoot` 沒有資料時不顯示。

表尾欄位會依照 `thead` 產生，並提供 `${thead.id}-tfoot` slot。沒有提供 slot 時，會使用 `TBodyValue.vue` 輸出欄位值。

## Config

```js
const config = {
  isTheadFixed: false,
  noData: {
    icon: null,
    message: '尚無資料',
  },
}
```

| 名稱 | 說明 |
| --- | --- |
| `isTheadFixed` | 是否啟用固定表頭。啟用後會依 `.m-table-container` 的捲動位置移動同一個 `thead`。 |
| `noData.icon` | 無資料時傳給 `CommonSvgIcon` 的 icon。沒有值時不顯示 icon。 |
| `noData.message` | 無資料文字，使用 `v-html` 輸出。 |

## Set Class

```js
const setClass = {
  main: '',
  container: '',
  content: '',
  thead: '',
  theadTr: '',
  theadTh: '',
  theadLabel: '',
  tbody: '',
  tbodyTr: '',
  tbodyTd: '',
  tfoot: '',
  tfootTr: '',
  tfootTd: '',
  footer: '',
  noData: '',
}
```

## Slots

### Tbody 欄位

slot name 使用 `thead.id`。

```vue
<BuyMTableDefault :thead="thead" :tbody="tbody">
  <template #name="{ item, value, index, column }">
    <p>{{ value }}</p>
  </template>
</BuyMTableDefault>
```

| 名稱 | 說明 |
| --- | --- |
| `item` | tbody 當前列的完整資料。 |
| `value` | `item[thead.id]` 的欄位值。 |
| `index` | tbody 當前列 index。 |
| `column` | 當前 thead 欄位設定。 |

### Tfoot 欄位

slot name 使用 `${thead.id}-tfoot`。

```vue
<template #name-tfoot="{ item, value, index, column }">
  <p>{{ value }}</p>
</template>
```

### Footer

有傳入 `footer` slot 時，會在 table 後方顯示 `.m-table-footer`。

```vue
<template #footer>
  <BuyMPagination />
</template>
```

## CSS Variables

### components/buy/mTable/Default.vue

```css
:root {
  --table-default-thtd-pc-px: 5px;
  --table-default-thtd-tabled-px: 5px;
  --table-default-thtd-mobile-px: 5px;

  --table-default-tbody-tr-pc-boder-b: 1px;
  --table-default-tbody-tr-tabled-boder-b: 1px;
  --table-default-tbody-tr-mobile-boder-b: 1px;

  --table-default-thead-th-pc-py: 8px;
  --table-default-thead-th-tabled-py: 8px;
  --table-default-thead-th-mobile-py: 8px;

  --table-default-thead-th-pc-text: 16px;
  --table-default-thead-th-tabled-text: 16px;
  --table-default-thead-th-mobile-text: 16px;

  --table-default-tbody-td-pc-py: 15px;
  --table-default-tbody-td-tabled-py: 15px;
  --table-default-tbody-td-mobile-py: 15px;

  --table-default-tbody-td-pc-text: 16px;
  --table-default-tbody-td-tabled-text: 16px;
  --table-default-tbody-td-mobile-text: 16px;

  --table-default-thead-th-color: var(--gray-666);
  --table-default-tbody-td-color: var(--gray-666);
  --table-default-tbody-tr-boder-color: var(--gray-e5);
}
```

### assets/css/_modules/buy/mTable.css

```css
:root {
  --table-pc-rounded: 15px;
  --table-tabled-rounded: 15px;
  --table-mobile-rounded: 15px;
}
```

## Structure

```text
div.m-table.--default
  div.m-table-container
    table.m-table-content
      thead.m-table-thead
        tr.m-table-thead-tr
          th.m-table-thead-th
            p
      tbody.m-table-tbody
        tr.m-table-tbody-tr
          td.m-table-tbody-td
            slot | BuyMTableTBodyValue
        tr.m-table-tbody-tr.--empty
          td.m-table-tbody-td.--empty
            div.m-table-no-data
              CommonSvgIcon
              p
      tfoot.m-table-tfoot
        tr.m-table-tfoot-tr
          td.m-table-tfoot-td
            slot | BuyMTableTBodyValue
  div.m-table-footer
    slot name="footer"
```
