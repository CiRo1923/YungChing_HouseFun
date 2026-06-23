<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="rounded-[6px] border-[1px] border-[--gray-ed] m:pb-[20px] t:gap-x-[10px] pt:flex pt:flex-wrap p:min-h-[85px] p:gap-x-[15px]"
  >
    <PageBuyHouseActualPriceRecord :item="props.item" />
    <div
      class="space-y-[5px] m:mx-[15px] t:ml-[10px] tm:pb-[10px] tm:pt-[20px] p:flex p:grow p:flex-col p:justify-center"
    >
      <PageBuyHouseActualPriceAddressInfo :item="props.item" />
      <PageBuyHouseActualPriceBasicInfo :item="props.item" />
    </div>
    <PageBuyHouseActualPriceInfo :item="props.item" />
    <PageBuyHouseActualPriceNote :item="props.item" />
  </div>
</template>

<style lang="postcss"></style>
