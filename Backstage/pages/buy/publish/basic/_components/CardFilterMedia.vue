<script setup>
import {
  PageBuyPublishBasicMediaVideo,
  PageBuyPublishBasicMediaCaseVideoDisplay,
  PageBuyPublishBasicMediaNote,
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
      id: 'video',
      component: PageBuyPublishBasicMediaVideo,
      hasEmits: false,
    },
    {
      id: 'caseVideoDisplay',
      component: PageBuyPublishBasicMediaCaseVideoDisplay,
      hasEmits: false,
    },
    {
      id: 'note',
      component: PageBuyPublishBasicMediaNote,
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
