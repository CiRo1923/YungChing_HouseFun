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
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
})
const isDeviceM = computed(() => device.value === 'm')
const items = shallowReadonly([
  {
    id: 'warning',
    component: PageBuyPublishBasicFeatureWarning,
    setClass: {
      main: 'm:hidden',
    },
    hiddenDevice: 'm',
  },
  {
    id: 'caseDescription',
    component: PageBuyPublishBasicFeatureCaseDescription,
  },
  {
    id: 'caseFeature',
    component: PageBuyPublishBasicFeatureCaseFeature,
  },
  {
    id: 'caseFeatureCustomize',
    component: PageBuyPublishBasicFeatureCaseFeatureCustomize,
  },
])

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
</script>

<template>
  <PageBuyPublishBasicCardFilter :title="props.title" :items="items">
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
