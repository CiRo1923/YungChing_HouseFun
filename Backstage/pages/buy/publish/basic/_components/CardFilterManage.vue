<script setup>
import {
  PageBuyPublishBasicManageCaseManageType,
  PageBuyPublishBasicManageCaseManageDuty,
  PageBuyPublishBasicManageCaseManagePay,
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
      id: 'caseManageType',
      isRequired: false,
      label: '管理方式',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicManageCaseManageType,
      hasEmits: false,
    },
    {
      id: 'caseManageDuty',
      isRequired: false,
      label: '管理時段',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicManageCaseManageDuty,
      hasEmits: false,
    },
    {
      id: 'caseManagePay',
      isRequired: false,
      label: '管理費',
      class: 'p:h-[40px]',
      component: PageBuyPublishBasicManageCaseManagePay,
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
