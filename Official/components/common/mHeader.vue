<script setup>
import ImgSrc from '@components/common/ImgSrc.vue'
import Nav from '@components/common/mNav.vue'

// import { onDevice } from '@js/_prototype.js'

// const device = ref('p') // 預設值先給 p
// const isDeviceP = computed(() => device.value === 'p')

// const onResize = () => {
//   device.value = onDevice()
// }

// onMounted(() => {
//   onResize()
//   window.addEventListener('resize', onResize)
// })

// onUnmounted(() => {
//   window.removeEventListener('resize', onResize)
// })
</script>

<template>
  <div class="m-header relative bg-[--white] tm:h-[55px] p:h-[65px]">
    <div
      class="m-header-container mx-auto flex tm:px-[15px] pt:h-full p:max-w-[1220px] p:px-[10px]"
    >
      <div class="m-header-logo flex m:items-end m:gap-x-[3px] pt:flex-col pt:justify-center">
        <ImgSrc
          src="buy/logo_text.svg"
          :setClass="{
            main: 'tm:h-[24px] tm:w-[69px] p:ml-auto p:h-[30px] p:w-[88px]',
          }"
        />
        <ImgSrc
          src="buy/logo_icon.svg"
          :setClass="{
            main: 'tm:h-[12px] tm:w-[78px] p:mt-[-3px] p:h-[16px] p:w-[105px]',
          }"
        />
      </div>
      <Nav />
    </div>
  </div>
</template>

<style lang="postcss"></style>
