<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// 降價金額取通知本身的 priceDropAmount(這一則通知發出時降了多少),
// 不取物件的 priceDrop —— 兩者的差別已列進 api 待確認文件,由後端確認。
const house = computed(() => props.item.house || {})
</script>

<template>
  <!-- 桌機降價與原價在上、總價在下;手機同一行、總價在最右,中間以上框線隔開。 -->
  <div
    class="text-[--gray-666] m:flex m:w-full m:items-center m:justify-end m:gap-x-[10px] m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] pt:min-w-[140px] pt:shrink-0 pt:text-right"
  >
    <p class="flex items-baseline gap-x-[10px] text-[12px] pt:justify-end">
      <span class="text-[--red-e45c]" v-if="props.item.priceDropAmount">
        ↓ {{ numberComma.add(props.item.priceDropAmount) }}萬
      </span>
      <del v-if="house.lastPrice">{{ numberComma.add(house.lastPrice) }}萬</del>
    </p>
    <p class="text-[14px] leading-[1.2] text-[--red-e45c]">
      <b class="text-[18px] font-medium">{{ house.price ? numberComma.add(house.price) : '--' }}</b>
      <template v-if="house.price">萬</template>
    </p>
  </div>
</template>
