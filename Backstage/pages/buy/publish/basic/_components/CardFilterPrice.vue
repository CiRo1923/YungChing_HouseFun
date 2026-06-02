<script setup>
import {
  PageBuyPublishBasicPriceCasePrice,
  PageBuyPublishBasicPriceCaseParkingPrice,
  PageBuyPublishBasicPriceCasePriceUnit,
} from '#components'

const buyPublish = useBuyPublishStore()
const { apiData } = storeToRefs(buyPublish)

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})

const casePurposeToken = computed(() => apiData.value.caseInfo.casePurposeToken)

// 1: 住宅 2: 店面 3: 住店 4: 辦公 5: 住辦 6: 廠房 7: 車位 8: 土地 9: 其他
const items = computed(() => {
  return [
    {
      id: 'casePrice',
      isRequired: true,
      label: '總價',
      class: 'p:h-[40px]',
      hidden: [7], // 7: 車位
      component: PageBuyPublishBasicPriceCasePrice,
      hasEmits: false,
    },
    {
      id: 'caseParkingPrice',
      isRequired: casePurposeToken.value === 7, // 7: 車位
      label: '車位價',
      class: 'p:h-[40px]',
      hidden: [8], // 8: 車位
      component: PageBuyPublishBasicPriceCaseParkingPrice,
      hasEmits: false,
    },
    {
      id: 'casePriceUnit',
      isRequired: false,
      label: '單價',
      class: 'p:h-[40px]',
      hidden: [7], // 7: 車位
      component: PageBuyPublishBasicPriceCasePriceUnit,
      hasEmits: false,
    },
  ]
})

const visibleItems = computed(() => {
  return items.value.filter((item) => {
    const isHidden = item.hidden?.includes(casePurposeToken.value)
    const isVisibleOnly = item.visible?.length

    if (isHidden) return false

    if (isVisibleOnly) {
      return item.visible.includes(casePurposeToken.value)
    }

    return true
  })
})
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="visibleItems" />
</template>

<style></style>
