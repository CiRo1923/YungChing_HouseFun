<script setup>
import { onFormatDate } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const createdAt = computed(() => onFormatDate(props.item.createdAt, 'YYYY-MM-DD'))
</script>

<template>
  <!-- 設計稿上只有加入時間一項。swagger 的 RealPriceSubscriptionItem 還沒有這個欄位,
    createdAt 這個名字是照搜尋訂閱那一層暫定的,api 定案後要跟著改。 -->
  <p class="text-[12px] text-[--gray-999]">加入時間：{{ createdAt }}</p>
</template>
