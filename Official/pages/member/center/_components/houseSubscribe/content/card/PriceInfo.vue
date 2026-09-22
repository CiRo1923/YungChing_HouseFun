<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const house = computed(() => props.item.house || {})
</script>

<template>
  <!-- 桌機總價在上、降價與原價在下;手機同一行且總價在最右,靠 order 對調。 -->
  <div
    class="text-[--gray-666] m:flex m:w-full m:items-center m:justify-end m:gap-x-[10px] m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] t:px-[15px] pt:shrink-0 pt:text-right p:px-[20px]"
  >
    <p class="tm:order-2">
      <span class="text-[14px] leading-[1.2] text-[--red-e45c]">
        <b class="text-[18px] font-medium">{{ numberComma.add(house.totalPrice) }}</b>
        萬
      </span>
    </p>
    <p
      class="flex items-baseline text-[12px] m:gap-x-[5px] t:gap-x-[10px] tm:order-1 p:gap-x-[15px]"
    >
      <span class="text-[--red-e45c]" v-if="props.item.priceDropAmount">
        ↓ {{ numberComma.add(props.item.priceDropAmount) }} 萬
      </span>
      <del v-if="house.lastPrice"> {{ numberComma.add(house.lastPrice) }} 萬 </del>
    </p>
  </div>
</template>
