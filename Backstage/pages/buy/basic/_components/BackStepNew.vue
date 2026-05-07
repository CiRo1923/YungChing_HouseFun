<script setup>
import BackStepNew from '@pages/buy/basic/_containers/BackStepNew.vue'

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
    :anchor="{
      to: {
        name: 'buy-list-publish',
      },
    }"
    :stepOptions="stepOptions"
    :config="{
      active: props.active,
    }"
  />
</template>

<style></style>
