<script setup>
import {
  PageBuyPublishBasicFeatureWarning,
  PageBuyPublishBasicFeatureCaseDescription,
  PageBuyPublishBasicFeatureCaseFeature,
  PageBuyPublishBasicFeatureCaseFeatureCustomize,
} from '#components'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
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
      id: 'warning',
      component: PageBuyPublishBasicFeatureWarning,
      hasEmits: false,
      setClass: {
        main: 'm:hidden',
      },
      hiddenDevice: 'm',
    },
    {
      id: 'caseDescription',
      component: PageBuyPublishBasicFeatureCaseDescription,
      hasEmits: false,
    },
    {
      id: 'caseFeature',
      hidden: [8], // 8 土地;
      component: PageBuyPublishBasicFeatureCaseFeature,

      hasEmits: false,
    },
    {
      id: 'caseFeatureCustomize',
      component: PageBuyPublishBasicFeatureCaseFeatureCustomize,
      hasEmits: false,
    },
  ]
})

const isDeviceM = computed(() => device.value === 'm')
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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="visibleItems">
    <template #tools v-if="isDeviceM">
      <PageBuyPublishBasicFeatureWarning
        :setClass="{
          main: 'm:mt-[8px] pt:hidden',
        }"
      />
    </template>
  </PageBuyPublishBasicCardFilter>
</template>

<style></style>
