<script setup>
import BackStepNew from '@pages/buy/_containers/BackStepNew.vue'
const props = defineProps({
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
    :stepOptions="stepOptions"
    :config="{
      active: props.active,
    }"
  />
</template>

<style></style>
