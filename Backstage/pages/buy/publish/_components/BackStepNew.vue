<script setup>
import BackStepNew from '@pages/buy/publish/_container/BackStepNew.vue'

const props = defineProps({
  anchor: {
    type: Object,
    default: () => ({}),
  },
  active: {
    type: Number,
    default: 0,
  },
})

const stepOptions = readonly([
  {
    label: '編輯資料',
  },
  {
    label: '選擇額度',
  },
  {
    label: '完成刊登',
  },
])
</script>

<template>
  <BackStepNew
    :anchor="props.anchor"
    :stepOptions="stepOptions"
    :config="{
      active: props.active,
    }"
  />
</template>

<style></style>
