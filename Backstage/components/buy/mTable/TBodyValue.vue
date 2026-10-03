<script setup>
/* component-deps —— 複製這支元件的時候這幾支要一起帶走:
   scripts/_prototype.js
     這支元件用到的共用函式。少了它**建置直接失敗**,而訊息只說某個名字不存在 —— 看不出那是元件帶來的相依。 */
import { onFormatDate, numberComma } from '@js/_prototype.js'

const props = defineProps({
  value: {
    type: [String, Number],
    default: null,
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const config = computed(() => {
  return {
    type: null,
    format: 'YYYY-MM-DD',
    ...props.config,
  }
})
</script>

<template>
  <p
    v-html="onFormatDate(props.value, config.format || 'YYYY-MM-DD')"
    v-if="config.type === 'date'"
  />
  <p v-html="numberComma.add(props.value) || 0" v-else-if="config.type === 'comma'" />
  <p v-html="`$${numberComma.add(props.value) || 0}`" v-else-if="config.type === 'currency'" />
  <p v-html="props.value" v-else />
</template>
