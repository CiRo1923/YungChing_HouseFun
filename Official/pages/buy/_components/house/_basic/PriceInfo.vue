<script setup>
import Dialog from '@components/buy/mDialog.vue'
import TagDefault from '@components/buy/mTag/Default.vue'
import Separator from '@components/buy/mSeparator.vue'

import { numberComma } from '@js/_prototype.js'

import { useBuyHouseStore } from '@stores/buy/house.js'

const buyHouse = useBuyHouseStore()
const { pricing, parking } = storeToRefs(buyHouse)

const priceInfo = computed(() => {
  const { unitPrice } = pricing.value
  const { price, isPriceInclude } = parking.value

  return [
    {
      id: 'unitPrice',
      label: '單價',
      value: `單價 <b class="text-[--gray-333]">${unitPrice}</b> 萬`,
    },
    {
      id: 'parkingPrice',
      label: '車位價',
      value: `含車位 ${price} 萬`,
      isHidden: !isPriceInclude,
    },
  ]
})
</script>

<template>
  <div class="text-right m:mt-[5px] t:space-y-[5px] p:space-y-[10px]">
    <p class="relative text-[--red-e45c]">
      <Dialog
        :label="`↓ ${pricing.priceDrop} 萬`"
        :setClass="{
          main: '--orange-e646 pt:--arrow-bottom m:--arrow-right p:--px-15 p:--h-34 tm:--h-20 tm:--px-10 m:mr-[5px] m:translate-y-[-5px] pt:absolute pt:right-[-10px] pt:top-0 pt:-translate-y-full',
          label: 'font-bold tm:text-[12px] p:text-[14px]',
        }"
        v-if="pricing.priceDrop"
      />
      <del class="text-[--gray-999] tm:text-[12px] p:text-[14px]" v-if="pricing.lastPrice">
        {{ pricing.lastPrice }} 萬
      </del>
      <b class="leading-[1.2] tm:text-[24px] p:text-[45px]">
        {{ numberComma.add(pricing.price) }}
      </b>
      <small class="tm:text-[12px] p:text-[16px]">萬</small>
    </p>
    <div
      class="flex m:flex-row-reverse m:items-center m:gap-x-[6px] t:space-y-[6px] pt:flex-col pt:items-end p:space-y-[12px]"
    >
      <Separator
        :items="priceInfo"
        :setClass="{
          main: '--horizontal p:--gap-x-20 tm:--gap-x-12',
          item: 'tracking-default text-[--gray-666] tm:text-[12px] p:text-[14px]',
        }"
      />
      <TagDefault
        :label="`每坪低於實價 5 萬`"
        :setClass="{
          main: '--bg --orange-feea p:--px-12 tm:--px-8',
          label: 'font-bold text-[--orange-e646] tm:text-[12px] p:text-[14px]',
        }"
      />
    </div>
  </div>
</template>

<style></style>
