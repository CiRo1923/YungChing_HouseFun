<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const items = computed(() => {
  const { unitPrice, parkPrice, isPriceIncludeParking } = props.item

  return [
    {
      id: 'unitPrice',
      value: `${numberComma.add(unitPrice)} 萬 / 坪`,
    },
    {
      id: 'parkingPrice',
      value: `含車位價 ${numberComma.add(parkPrice)} 萬`,
      isHidden: !isPriceIncludeParking,
    },
  ]
})
</script>

<template>
  <div class="mt-[10px] border-t-[1px] border-t-[--gray-e5] pt-[5px] text-[--gray-666]">
    <p class="relative flex items-baseline justify-end gap-x-[5px]">
      <span class="text-[12px] text-[--red-e45c]" v-if="props.item.priceDrop">
        ↓ {{ numberComma.add(props.item.priceDrop) }} 萬
      </span>
      <del class="text-[12px]" v-if="props.item.lastPrice">
        {{ numberComma.add(props.item.lastPrice) }} 萬
      </del>
      <span class="text-[12px] leading-[1.2] text-[--red-e45c]">
        <b class="text-[20px]">
          {{ numberComma.add(props.item.price) }}
        </b>
        萬
      </span>
    </p>
    <BuyMSeparator
      :items="items"
      :setClass="{
        main: '--horizontal --gap-x-20 justify-end',
        item: 'tracking-default text-[12px]',
      }"
    />
  </div>
</template>

<style></style>
