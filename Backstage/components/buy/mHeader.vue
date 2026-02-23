<script setup>
import ImgSrc from '@components/common/ImgSrc.vue'

import { onDevice } from '@js/_prototype.js'

const device = ref('p') // 預設值先給 p
const isDeviceP = computed(() => device.value === 'p')

const onResize = () => {
  device.value = onDevice()
}

onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="m-header mx-auto flex items-center tm:h-[50px] tm:px-[15px] p:h-[60px] p:max-w-[1920px] p:px-[50px]"
  >
    <div class="m-header-logo flex shrink-0 items-center">
      <ImgSrc
        src="buy/logo_text.svg"
        :setClass="{
          main: 'tm:h-[20px] tm:w-[57px] p:h-[25px] p:w-[77px]',
        }"
      />
      <!-- device 預設值先給 p 平板、手機 先用 css 隱藏；畫面不會跳閃 -->
      <ImgSrc
        src="buy/logo_icon.svg"
        :setClass="{
          main: 'tm:hidden p:ml-[4px] p:h-[25px] p:w-[87px]',
        }"
        v-if="isDeviceP"
      />
      <em class="text-[--white] tm:hidden p:ml-[10px] p:text-[24px]" v-if="isDeviceP">管理後台</em>
    </div>
  </div>
</template>

<style lang="postcss"></style>
