<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

/* 規格書第八節的「行情資訊」:訂閱條件底下最近一筆成交。

  三項裡只有單價在 swagger 的 RealPriceSubscriptionItem 裡
  (latestUnitPrice),權狀坪數與總價還沒有 —— 這裡的兩個名字是照
  latestUnitPrice 的形狀暫定的,api 定案後要跟著改。 */
const tradeInfo = computed(() => {
  const { latestBuildPing, latestTotalPrice, latestUnitPrice } = props.item

  return [
    {
      id: 'latestBuildPing',
      label: '權狀坪數',
      value: numberComma.add(latestBuildPing),
      unit: '坪',
    },
    {
      id: 'latestTotalPrice',
      label: '總價',
      value: numberComma.add(latestTotalPrice),
      unit: '萬',
    },
    {
      id: 'latestUnitPrice',
      label: '單價',
      value: numberComma.add(latestUnitPrice),
      unit: '萬 / 坪',
    },
  ]
})
</script>

<template>
  <!-- 手機放在分隔線下方、整行靠左,桌機與平板是右側獨立一欄。
    兩個斷點的內容與對齊相同,只有外框的位置不一樣。 -->
  <div
    class="text-[14px] text-[--gray-666] m:w-full m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] t:px-[15px] pt:min-w-[160px] pt:shrink-0"
  >
    <p class="text-[--gray-999]">最新成交記錄</p>
    <p v-for="{ id, label, value, unit } in tradeInfo" :key="id">
      {{ label }}
      <b class="font-medium text-[--orange-e646]">{{ value }}</b>
      {{ unit }}
    </p>
  </div>
</template>
