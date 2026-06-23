<script setup>
const common = useCommonStore()
const { device } = storeToRefs(common)
const { onResize } = useCommonActions()
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
  config: {
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
  <router-link
    :to="{
      name: 'buy-house-hfid',
      params: {
        hfid: props.item.hfid,
      },
    }"
    class="absolute inset-0 z-[1]"
  />
  <article class="order-2 flex grow flex-col">
    <header
      class="flex shrink-0 items-center overflow-hidden tm:gap-x-[10px] p:mb-[5px] p:gap-x-[15px]"
    >
      <h2 class="line-clamp-1 text-[20px] leading-[1.5]">
        <strong>{{ props.item.title }}</strong>
      </h2>
      <PageBuyListContentTagGold :item="props.item" v-if="!isDeviceM" />
    </header>
    <div class="tracking-default grow text-[14px] leading-[1.64] p:space-y-[5px]">
      <PageBuyListContentAddressInfo :item="props.item" />
      <PageBuyListContentBasicInfo :item="props.item" />
      <PageBuyListContentPinInfo :item="props.item" />
    </div>
    <PageBuyListContentFeatures :item="props.item" />
    <PageBuyListContentBroker :item="props.item" />
  </article>
  <div class="order-3 shrink-0 pt:flex pt:flex-col pt:justify-end pt:text-right p:w-[190px]">
    <PageBuyCommonFavorite
      :setClass="{
        main: 'z-[1] m:absolute m:right-[10px] m:top-[24px] pt:relative pt:shrink-0',
        button: 'm:text-[--white] pt:text-[--gray-db]',
      }"
    />
    <div class="flex pt:grow pt:flex-col">
      <PageBuyListContentPrice :item="props.item" />
      <PageBuyListContentComment />
    </div>
  </div>
  <PageBuyListContentMedia :item="props.item" />
</template>

<style></style>
