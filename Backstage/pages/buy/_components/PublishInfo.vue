<script setup>
import Address from '@pages/buy/_components/Address.vue'

import { numberComma } from '@js/_prototype.js'

import { useCommonStore } from '@stores/common.js'
import useCommonActions from '@stores/composables/useCommonActions.js'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
})
const isDeviceM = computed(() => device.value === 'm')

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
</script>

<template>
  <div class="flex items-center">
    <div class="order-2 grow pt:flex pt:items-center">
      <div class="m:space-y-[16px] pt:grow pt:space-y-[8px]">
        <p class="mb-[8px] text-[--gray-666]">
          <b class="font-medium tracking-wider p:text-[18px]">{{ props.data.title }}</b>
        </p>
        <Address :data="props.data" />
      </div>
      <div class="pt:shrink-0">
        <span class="text-[--gray-666] p:text-[16px]">
          <b class="text-[--orange-e646] p:text-[36px]">{{ numberComma.add(props.data.price) }}</b>
          萬
        </span>
      </div>
    </div>
    <CommonImgSrc
      :src="props.data.cover"
      :alt="props.data.title"
      :setClass="{
        main: 'order-1 shrink-0 overflow-hidden t:h-[114px] t:w-[150px] p:h-[114px] p:w-[150px]',
      }"
      v-if="!isDeviceM"
    />
  </div>
  <!-- {{ props.data }} -->
</template>

<style lang="postcss"></style>
