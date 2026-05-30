<script setup>
import { onFormatDate, numberComma } from '@js/_prototype.js'

import { computed } from 'vue'

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

<style></style>
