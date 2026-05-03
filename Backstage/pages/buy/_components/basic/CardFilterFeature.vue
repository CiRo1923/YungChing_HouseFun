<script setup>
import CardFilter from '@pages/buy/_containers/CardFilter.vue'

import Warning from '@pages/buy/_components/basic/feature/Warning.vue'
import CaseDescription from '@pages/buy/_components/basic/feature/CaseDescription.vue'
import CaseFeature from '@pages/buy/_components/basic/feature/CaseFeature.vue'
import CaseFeatureCustomize from '@pages/buy/_components/basic/feature/CaseFeatureCustomize.vue'

import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

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
    component: Warning,
    setClass: {
      main: 'm:hidden',
    },
    hiddenDevice: 'm',
  },
  {
    id: 'caseDescription',
    component: CaseDescription,
  },
  {
    id: 'caseFeature',
    component: CaseFeature,
  },
  {
    id: 'caseFeatureCustomize',
    component: CaseFeatureCustomize,
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
  <CardFilter :title="props.title" :items="items">
    <template #tools v-if="isDeviceM">
      <Warning
        :setClass="{
          main: 'm:mt-[8px] pt:hidden',
        }"
      />
    </template>
  </CardFilter>
</template>

<style></style>
