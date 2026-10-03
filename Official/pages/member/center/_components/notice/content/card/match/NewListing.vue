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
  <!-- 規格書用「本日新上架」(手機設計稿寫「本週」,以規格書為準)。
    戶數實際包含「新上架符合」與「降價入圍」兩種,用語與資料不同是規格書刻意的設計。
    桌機上下兩行;手機同一行靠右,以上框線與條件隔開。 -->
  <p
    class="text-[14px] text-[--gray-666] m:flex m:items-baseline m:justify-end m:gap-x-[5px] m:border-t-[1px] m:border-t-[--gray-e5] m:pt-[10px] pt:min-w-[165px] pt:shrink-0"
  >
    <span class="pt:block">本日新上架</span>
    <span class="text-[--orange-e646]">
      <b class="text-[16px] font-medium">
        {{ numberComma.add(props.item.newListingCount ?? 0) }}
      </b>
      戶
    </span>
  </p>
</template>
