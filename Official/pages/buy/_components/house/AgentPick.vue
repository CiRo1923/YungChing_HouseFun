<script setup>
const buyHouse = useBuyHouseStore()
const { broker, agentPick } = storeToRefs(buyHouse)
const hasAgentPick = computed(() => agentPick.value?.length !== 0)
</script>

<template>
  <PageBuyHouseContent :title="`${broker.name}的精選物件`" v-if="hasAgentPick">
    <BuyMSwiperHorizontal
      name="agentPick"
      :data="agentPick"
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
