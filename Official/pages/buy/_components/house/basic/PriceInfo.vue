<script setup>
import { numberComma } from '@js/_prototype.js'

const buyHouse = useBuyHouseStore()
const { pricing } = storeToRefs(buyHouse)

const priceInfo = computed(() => {
  const { unitPrice, parkPrice, isPriceIncludeParking } = pricing.value

  return [
    {
      id: 'unitPrice',
      value: `<b>${numberComma.add(unitPrice)}</b> 萬 / 坪`,
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
  <div class="text-right m:mt-[5px] t:space-y-[5px] p:space-y-[10px]">
    <p class="relative flex items-baseline gap-x-[10px]">
      <span class="text-[14px] text-[--red-e45c]" v-if="pricing.priceDrop">
        ↓ {{ numberComma.add(pricing.priceDrop) }} 萬
      </span>
      <del class="text-[14px] text-[--gray-999]" v-if="pricing.lastPrice">
        {{ numberComma.add(pricing.lastPrice) }} 萬
      </del>
      <span class="leading-[1.2] text-[--red-e45c] tm:text-[12px] p:text-[16px]">
        <b class="tm:text-[24px] p:text-[36px]">
          {{ numberComma.add(pricing.price) }}
        </b>
        萬
      </span>
    </p>
    <BuyMSeparator
      :items="priceInfo"
      :setClass="{
        main: '--horizontal --gap-x-20 justify-end',
        item: 'tracking-default text-[14px] text-[--gray-666]',
      }"
    />
  </div>
</template>

<style></style>
