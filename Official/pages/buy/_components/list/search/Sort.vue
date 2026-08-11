<script setup>
const buyList = useBuyListStore()
const { content } = storeToRefs(buyList)
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

const emits = defineEmits(['click:routePush'])

// const data = computed(() => content.value.data || [])
const apiData = computed(() => content.value.apiData || {})

// 攤平後的排序值序列(需與 BuyMSortMain dropdown 攤平邏輯一致):
// 無方向的選項 → [sort];有方向 → 依 asc、desc 且有 value 者
const flatValues = computed(() =>
  options.flatMap((item) => {
    const hasDirections = item.sort && typeof item.sort === 'object'

    if (!hasDirections) return [item.sort]

    return ['asc', 'desc']
      .filter((type) => item.sort[type]?.value != null)
      .map((type) => item.sort[type].value)
  })
)

// 依 content.apiData.od 反推攤平索引,讓重整 / 分享後排序下拉能還原選中狀態
const activeIndex = computed(() => {
  const od = apiData.value.od

  if (!od) return 0

  const index = flatValues.value.findIndex((value) => value === Number(od))

  return index === -1 ? 0 : index
})

const onClick = (item) => {
  const { value } = item
  apiData.value.od = `${value.sort}`
  // 排序改變 → 走 routePush,讓 od 以 querystring 寫入網址(可分享 / 重整還原)
  emits('click:routePush')
}
</script>

<template>
  <BuyMSortMain
    :options="options"
    :config="{
      index: activeIndex,
      mode: 'dropdown',
      position: 'right',
      symbol: '→',
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
