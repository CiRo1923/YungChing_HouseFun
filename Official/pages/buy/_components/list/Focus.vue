<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyList = useBuyListStore()
const { focus } = storeToRefs(buyList)
const hasFocus = computed(() => focus.value?.length !== 0 ?? false)

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
  <div class="t:mb-[15px] t:px-[10px] p:mb-[30px]" v-if="hasFocus && !isDeviceM">
    <BuyMSwiperHorizontal
      name="focus"
      :data="focus"
      :config="{
        nav: {
          p: true,
        },
        slidesPerView: {
          p: 4.4,
          t: 2.7,
          m: 1.2,
        },
      }"
      :setClass="{
        main: 'h-full',
        container: 'pt:[--m-swiper-gap:6px]',
        nav: 'text-[--white] p:h-[50px] p:w-[50px] p:p-[7px]',
        navPrev: 'left-0 -translate-x-full',
        navNext: 'right-0 translate-x-full',
      }"
      v-slot="{ item }"
    >
      <PageBuyCommonCard
        :item="item"
        :setClass="{
          main: 'px-[3px] py-[5px]',
          container: 'rounded-[8px]',
        }"
      />
    </BuyMSwiperHorizontal>
  </div>
</template>
<style lang="postcss"></style>
