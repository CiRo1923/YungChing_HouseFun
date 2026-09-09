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
          main: 'm-header-logo-text',
        }"
      />
      <CommonImgSrc
        src="buy/logo_icon.svg"
        :setClass="{
          main: 'm-header-logo-icon',
        }"
        v-if="isDeviceP"
      />
      <em v-if="isDeviceP">管理後台</em>
    </div>
  </div>
</template>
