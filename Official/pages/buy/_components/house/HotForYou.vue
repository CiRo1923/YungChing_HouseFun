<script setup>
const buyHouse = useBuyHouseStore()
const { hotForYou } = storeToRefs(buyHouse)
const hasHotForYou = computed(() => hotForYou.value?.length !== 0)
</script>

<template>
  <PageBuyHouseContent title="這些物件也很適合你" v-if="hasHotForYou">
    <BuyMSwiperHorizontal
      name="hotForYou"
      :data="hotForYou"
      :config="{
        nav: false,
        slidesPerView: {
          p: 4,
          t: 2.5,
          m: 1.2,
        },
      }"
      :setClass="{
        main: 'h-full',
        container: 'pt:[--m-swiper-gap:4px]',
      }"
      v-slot="{ item }"
    >
      <PageBuyCommonCard
        :item="item"
        :setClass="{
          main: 'px-[3px] py-[5px]',
          container: 'rounded-[5px]',
        }"
      />
    </BuyMSwiperHorizontal>
  </PageBuyHouseContent>
</template>

<style></style>
