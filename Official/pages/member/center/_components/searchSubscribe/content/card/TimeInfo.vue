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
  <!-- 只有加入時間一項。手機版設計稿在這裡還畫了「降價時間」,桌機版與規格書第七節都沒有,
    api 也沒有對應欄位 —— 訂閱的是一組搜尋條件,不是某一個物件,沒有降價可言。 -->
  <p class="text-[12px] text-[--gray-999]">加入時間：{{ createdAt }}</p>
</template>
