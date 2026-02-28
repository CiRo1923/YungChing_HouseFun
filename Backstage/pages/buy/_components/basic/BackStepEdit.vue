<script setup>
import AnchorTool from '@components/buy/mAnchorTool.vue'

const props = defineProps({
  anchor: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <AnchorTool :anchor="props.anchor">尚未刊登</AnchorTool>
</template>

<style></style>
