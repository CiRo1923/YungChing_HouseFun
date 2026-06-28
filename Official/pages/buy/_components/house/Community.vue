<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const buyHouse = useBuyHouseStore()
const { community } = storeToRefs(buyHouse)

const isDeviceP = computed(() => device.value === 'p')
const hasCommunity = computed(() => community.value && Object.keys(community.value).length !== 0)

onResize()

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <PageBuyHouseContent title="社區資訊" v-if="hasCommunity">
    <div class="t:flex-wrap t:gap-x-[20px] pt:flex p:gap-x-[30px]">
      <PageBuyHouseCommunityImage />
      <article class="m:mt-[20px] t:grow">
        <PageBuyHouseCommunityName />
        <div class="mt-[5px] m:space-y-[5px] t:space-y-[10px] p:space-y-[15px]">
          <PageBuyHouseCommunityInfo />
          <PageBuyHouseCommunityPrice />
          <PageBuyHouseCommunityActioinButton v-if="isDeviceP" />
        </div>
      </article>
      <div
        class="t:w-full tm:mt-[20px] tm:space-y-[20px] tm:border-t-[1px] tm:border-t-[--gray-e5] tm:pt-[20px] p:flex-1 p:border-l-[1px] p:border-l-[--gray-e5] p:pl-[30px]"
      >
        <PageBuyHouseCommunityChart />
        <PageBuyHouseCommunityActioinButton v-if="!isDeviceP" />
      </div>
    </div>
  </PageBuyHouseContent>
</template>

<style></style>
