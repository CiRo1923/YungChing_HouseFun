<script setup>
import { onFormatDate } from '@js/_prototype.js'

const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

const timeInfo = computed(() => {
  const { subscribedAt, priceDropAt } = props.item

  return [
    {
      id: 'subscribedAt',
      value: `加入時間：${onFormatDate(subscribedAt, 'YYYY-MM-DD')}`,
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
