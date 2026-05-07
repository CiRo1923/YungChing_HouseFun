<script setup>
const props = defineProps({
  anchor: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <BuyMAnchorTool :anchor="props.anchor">尚未刊登</BuyMAnchorTool>
</template>

<style></style>
