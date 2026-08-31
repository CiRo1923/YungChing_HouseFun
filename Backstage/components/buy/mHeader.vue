<script setup>
import '@css/_modules/buy/mHeader/variables.css'
import '@css/_modules/buy/mHeader/common.css'

const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const isDeviceP = computed(() => device.value === 'p')

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="m-header">
    <div class="m-header-logo">
      <CommonImgSrc
        src="buy/logo_text.svg"
        :setClass="{
          main: 'tm:h-[20px] tm:w-[57px] p:h-[25px] p:w-[77px]',
        }"
      />
      <CommonImgSrc
        src="buy/logo_icon.svg"
        :setClass="{
          main: 'p:ml-[4px] p:h-[25px] p:w-[87px]',
        }"
        v-if="isDeviceP"
      />
      <em v-if="isDeviceP">管理後台</em>
    </div>
  </div>
</template>
