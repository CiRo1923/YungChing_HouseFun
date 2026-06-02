<script setup>
import {
  PageBuyPublishBasicPosterInfoPosterDataSource,
  PageBuyPublishBasicPosterInfoAgentName,
  PageBuyPublishBasicPosterInfoAgentPhone,
  PageBuyPublishBasicPosterInfoAgentLine,
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

const items = computed(() => {
  return [
    {
      id: 'posterDataSource',
      isRequired: false,
      label: '匯入資訊',
      class: 'p:h-[35px]',
      component: PageBuyPublishBasicPosterInfoPosterDataSource,
      hasEmits: false,
    },
    {
      id: 'agentName',
      isRequired: true,
      label: '姓名',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPosterInfoAgentName,
      hasEmits: false,
    },
    {
      id: 'agentPhone',
      isRequired: true,
      label: '行動電話',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPosterInfoAgentPhone,
      hasEmits: false,
    },
    {
      id: 'agentLine',
      isRequired: false,
      label: 'LINE 聯絡',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicPosterInfoAgentLine,
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
