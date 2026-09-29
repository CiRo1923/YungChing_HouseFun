<script setup>
import { numberComma } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const matchedHouseCount = computed(() => numberComma.add(props.item.matchedHouseCount))
</script>

<template>
  <!-- 規格書第七節:這個數字是「距離上一次更新新增了多少物件」,不是符合條件的總數。
    手機把它放在分隔線下方靠右,桌機是右側獨立一欄、標題與數字分兩行。 -->
  <div
    class="text-[--gray-333] m:flex m:w-full m:items-baseline m:justify-end m:gap-x-[10px] m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] t:px-[15px] pt:shrink-0 pt:text-right p:px-[20px]"
  >
    <p class="text-[16px]">配對房屋</p>
    <p class="text-[14px]">
      <b class="text-[18px] font-medium text-[--orange-e646]">{{ matchedHouseCount }}</b>
      戶
    </p>
  </div>
</template>
