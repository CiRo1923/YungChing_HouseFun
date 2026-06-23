<script setup>
const buyHouse = useBuyHouseStore()
const { hotForYou } = storeToRefs(buyHouse)
const hasHotForYou = computed(() => hotForYou.value?.length !== 0)
</script>

<template>
  <PageBuyHouseContent title="這些物件也很適合你" v-if="hasHotForYou">
    <BuyMSwiper12
      name="hotForYou"
      :data="hotForYou"
      :config="{
        nav: false,
        spaceBetween: {
          p: '4px',
        },
        slidesPerView: {
          pt: 4,
          m: 1.2,
        },
      }"
      :setClass="{
        main: 'h-full',
      }"
      v-slot="{ item }"
    >
      <PageBuyCommonCard :item="item" />
    </BuyMSwiper12>
  </PageBuyHouseContent>
</template>

<style></style>
