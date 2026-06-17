<script setup>
const buyList = useBuyListStore()
const { apiSearchData } = storeToRefs(buyList)
const options = shallowReadonly([
  {
    label: '預設排序',
    value: 'default',
    sort: 0,
  },
  {
    label: '總價',
    value: 'price',
    sort: {
      asc: {
        label: '低',
        value: 2,
      },
      desc: {
        label: '高',
        value: 1,
      },
    },
  },
  {
    label: '單價',
    value: 'uniprice',
    sort: {
      asc: {
        label: '低',
        value: 9,
      },
      desc: {
        label: '高',
        value: 3,
      },
    },
  },
  {
    label: '主建物坪 + 陽台坪',
    value: 'usepin',
    sort: {
      asc: {
        label: '低',
      },
      desc: {
        label: '高',
        value: 4,
      },
    },
  },
  {
    label: '建坪',
    value: 'buildpin',
    sort: {
      asc: {
        label: '低',
        value: 6,
      },
      desc: {
        label: '高',
        value: 5,
      },
    },
  },
  {
    label: '土地坪',
    value: 'landpin',
    sort: {
      asc: {
        label: '低',
      },
      desc: {
        label: '高',
        value: 7,
      },
    },
  },
  {
    label: '上架時間',
    value: 'date',
    sort: {
      asc: {
        label: '舊',
      },
      desc: {
        label: '新',
        value: 10,
      },
    },
  },
])

const onClick = (item) => {
  const { value } = item
  apiSearchData.value.od = `${value.sort}`
}
</script>

<template>
  <BuyMSortMain
    :options="options"
    :config="{
      index: 0,
      mode: 'dropdown',
      position: 'right',
      symbol: '到',
    }"
    :setClass="{
      main: 'ml-auto',
    }"
    @click="onClick"
  />
</template>

<style lang="postcss">
.mode-anchor {
  &.\-\-active {
    @apply text-[--green-8b0d];
  }
}
</style>
