<script setup>
import { onFormatDate } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const timeInfo = computed(() => {
  const { messageSentAt, priceDropAt } = props.item

  return [
    {
      // 規格書第六節的欄位名是「留言時間」,設計稿的標籤寫「加入時間」——以規格書為準。
      id: 'messageSentAt',
      value: `留言時間：${onFormatDate(messageSentAt, 'YYYY-MM-DD')}`,
    },
    {
      // 沒有降價紀錄時 api 給 null,規格書要求那種情況顯示 --。
      id: 'priceDropAt',
      value: `降價時間：${priceDropAt ? onFormatDate(priceDropAt, 'YYYY-MM-DD') : '--'}`,
    },
  ]
})
</script>

<template>
  <CommonMSeparator
    :items="timeInfo"
    :setClass="{
      main: '--horizontal --gap-x-30 text-[12px] text-[--gray-999]',
    }"
  />
</template>
