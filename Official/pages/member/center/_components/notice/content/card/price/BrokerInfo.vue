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

// 規格書:聯絡人、品牌、連絡電話、通知時間。分機有值才接在電話後面。
const brokerInfo = computed(() => {
  const { name, brand, phone, extension } = props.item.house?.broker || {}
  const nameText = [name, brand].filter(Boolean).join(' ')

  return [
    {
      id: 'name',
      value: nameText,
      isHidden: !nameText,
    },
    {
      id: 'phone',
      value: phone && extension ? `${phone} # ${extension}` : phone,
      isHidden: !phone,
    },
  ]
})
// 相對時間的規則見 onTimeAgo(全站共用一套),以伺服器時間為準
const sentAt = computed(() => onTimeAgo(props.item.sentAt, serverTime.value?.full))
</script>

<template>
  <!-- 桌機一行:姓名品牌 | 電話 時間;手機姓名品牌與電話上下兩行,時間對齊電話那一行 -->
  <div class="flex gap-x-[15px] text-[14px] text-[--gray-999] m:items-end pt:items-center">
    <CommonMSeparator
      :items="brokerInfo"
      :setClass="{
        main: 'pt:--horizontal --gap-x-30',
        item: 'whitespace-nowrap',
      }"
    />
    <span class="whitespace-nowrap text-[12px]" v-if="sentAt">{{ sentAt }}</span>
  </div>
</template>
