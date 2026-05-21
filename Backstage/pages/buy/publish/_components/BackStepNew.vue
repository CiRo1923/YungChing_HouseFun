<script setup>
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
  <PageBuyPublishBackTools
    :anchor="props.anchor"
    :stepOptions="stepOptions"
    :config="{
      active: props.active,
    }"
  />
</template>

<style></style>
