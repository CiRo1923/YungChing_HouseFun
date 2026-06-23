<script setup>
const buyHouse = useBuyHouseStore()
const { broker, agentPick } = storeToRefs(buyHouse)
const hasAgentPick = computed(() => agentPick.value?.length !== 0)
</script>

<template>
  <PageBuyHouseContent :title="`${broker.name}的精選物件`" v-if="hasAgentPick">
    <BuyMSwiper12
      name="agentPick"
      :data="agentPick"
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
