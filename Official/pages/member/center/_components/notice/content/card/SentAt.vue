<script setup>
import { onTimeAgo } from '@js/_projectPrototype.js'

const project = useProjectStore()
const { serverTime } = storeToRefs(project)
const props = defineProps({
  item: {
    type: Object,
    default: () => ({}),
  },
})

// 帶標籤的通知時間,配對物件與三種句子型的通知共用。
// 相對時間的規則見 onTimeAgo(全站共用一套),以伺服器時間為準。
const sentAt = computed(() => onTimeAgo(props.item.sentAt, serverTime.value?.full))
</script>

<template>
  <p class="text-[12px] text-[--gray-999]" v-if="sentAt">通知時間：{{ sentAt }}</p>
</template>
