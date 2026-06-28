<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { basic } = storeToRefs(buyHouse)

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
  <CommonMContent class="pt:--rounded-20 p:--p-24 t:--p-15 t:mx-[15px]">
    <div class="t:gap-x-[10px] pt:flex p:gap-x-[25px]">
      <div
        class="m:flex m:flex-col-reverse t:w-[380px] t:space-y-[10px] pt:shrink-0 p:w-[760px] p:space-y-[15px]"
      >
        <article
          class="relative z-[1] space-y-[5px] m:mt-[-20px] m:rounded-[20px] m:bg-[--white] m:px-[20px] m:pt-[30px]"
        >
          <header class="flex items-center t:gap-x-[5px] p:gap-x-[10px]">
            <h2 class="leading-[1.556] tm:text-[20px] p:text-[27px]">
              <strong>{{ basic.title }}</strong>
            </h2>
            <PageBuyHouseBasicTagGold v-if="isDeviceP" />
          </header>
          <PageBuyHouseBasicAddressInfo />
        </article>
        <PageBuyHouseBasicMedia />
      </div>
      <div class="flex flex-col items-end m:px-[20px] m:pb-[30px] pt:min-w-0 pt:grow">
        <PageBuyHouseBasicPriceInfo />
        <div
          class="w-full m:py-[20px] t:py-[15px] tm:space-y-[8px] p:mb-[20px] p:mt-[10px] p:space-y-[12px]"
        >
          <PageBuyHouseBasicTypeInfo />
          <PageBuyHouseBasicHouseInfo />
        </div>
        <div
          class="w-full border-t-[1px] border-t-[--gray-e5] tm:pt-[20px] p:space-y-[20px] p:pt-[30px]"
        >
          <PageBuyHouseBasicBrokerInfo />
          <PageBuyHouseBasicComment />
        </div>
        <!-- <pre>
          {{ house }}
        </pre> -->
      </div>
    </div>
  </CommonMContent>
</template>

<style></style>
