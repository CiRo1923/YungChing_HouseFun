<script setup>
import { PageBuyPublishBasicTermsItems, PageBuyPublishBasicTermsAgreeUserTerm } from '#components'

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
      id: 'items',
      component: PageBuyPublishBasicTermsItems,
      hasEmits: false,
    },
    {
      id: 'agreeUserTerm',
      component: PageBuyPublishBasicTermsAgreeUserTerm,
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
