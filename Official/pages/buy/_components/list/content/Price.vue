<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div
    class="grow m:grid m:grid-cols-[auto_auto] m:justify-start m:gap-x-[5px] pt:flex pt:flex-col pt:justify-center"
  >
    <p
      class="flex items-center m:order-3 m:w-full tm:gap-x-[6px] tm:text-[12px] p:gap-x-[10px] p:text-[14px]"
      v-if="props.item.lastPrice || props.item.priceDrop"
    >
      <small class="text-[--red-e45c]" v-if="props.item.priceDrop">
        ↓ {{ numberComma.add(props.item.priceDrop) }} 萬
      </small>
      <del class="text-[--gray-999]" v-if="props.item.lastPrice">
        {{ numberComma.add(props.item.lastPrice) }} 萬
      </del>
    </p>
    <p class="text-[--red-e45c] m:order-1 tm:text-[12px] p:text-[16px]">
      <b class="tm:text-[20px] p:text-[30px]">{{ numberComma.add(props.item.price) }}</b> 萬
    </p>
    <small
      class="tracking-default block text-[--gray-999] m:order-2 m:mb-[1px] m:self-end tm:text-[12px] p:text-[14px]"
      v-if="props.item.unitPrice"
    >
      {{ numberComma.add(props.item.unitPrice) }} 萬 / 坪
    </small>
    <small
      class="tracking-default relative block text-[--gray-999] m:order-4 m:pl-[6px] m:before:absolute m:before:left-0 m:before:top-1/2 m:before:h-[12px] m:before:w-[1px] m:before:-translate-y-1/2 m:before:bg-[--gray-999] m:before:content-default tm:text-[12px] p:text-[14px]"
      v-if="props.item.isPriceIncludeParking"
    >
      含車位價 {{ props.item.parkPrice }} 萬元
    </small>
  </div>
</template>

<style lang="postcss"></style>
