<script setup>
import { numberComma } from '@js/_prototype.js'

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

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="flex items-center t:gap-x-[16px] p:gap-x-[24px]">
    <div class="order-2 grow t:gap-x-[16px] pt:flex pt:items-center p:gap-x-[24px]">
      <div class="m:space-y-[16px] pt:grow pt:space-y-[8px]">
        <p class="text-[18px] tracking-wider text-[--gray-666]">
          <b class="font-medium">{{ props.data.title }}</b>
        </p>
        <PageBuyAddress
          :data="props.data"
          :setClass="{
            main: 'text-[16px] text-[--gray-666]',
          }"
        />
      </div>
      <div class="m:text-center pt:shrink-0">
        <span class="text-[16px] text-[--gray-666]">
          <b class="text-[36px] text-[--orange-e646]">{{ numberComma.add(props.data.price) }}</b>
          萬
        </span>
      </div>
    </div>
    <CommonImgSrc
      :src="props.data.cover"
      :alt="props.data.title"
      :setClass="{
        main: 'order-1 shrink-0 overflow-hidden rounded-[15px] t:h-[114px] t:w-[150px] p:h-[114px] p:w-[150px]',
      }"
      v-if="!isDeviceM"
    />
  </div>
  <!-- {{ props.data }} -->
</template>

<style lang="postcss"></style>
